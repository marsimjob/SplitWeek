using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SplitWeek.Server.Data;
using SplitWeek.Server.DTOs.ScheduleChanges;
using SplitWeek.Server.Models;
using SplitWeek.Server.Services;

namespace SplitWeek.Server.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class ScheduleChangesController : ControllerBase
{
    private readonly SplitWeekDbContext _db;
    private readonly NotificationService _notifications;

    public ScheduleChangesController(SplitWeekDbContext db, NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> HasAccess(int childId)
    {
        return await _db.ParentChildren.AnyAsync(pc => pc.ChildId == childId && pc.UserId == CurrentUserId);
    }

    [HttpGet("children/{childId}/schedule-changes")]
    public async Task<IActionResult> GetChangeRequests(int childId, [FromQuery] string? status)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var query = _db.ScheduleChangeRequests
            .Where(scr => scr.ChildId == childId)
            .Include(scr => scr.RequestedBy)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(scr => scr.Status == status);
        }
        else
        {
            // Default: show pending requests
            query = query.Where(scr => scr.Status == "Pending");
        }

        var requests = await query
            .OrderByDescending(scr => scr.CreatedAt)
            .Select(scr => new ChangeRequestDto
            {
                Id = scr.Id,
                ChildId = scr.ChildId,
                RequestedByUserId = scr.RequestedByUserId,
                RequestedByName = scr.RequestedBy.FirstName + " " + scr.RequestedBy.LastName,
                Status = scr.Status,
                Reason = scr.Reason,
                OriginalData = scr.OriginalData,
                ProposedData = scr.ProposedData,
                CounterData = scr.CounterData,
                ExpiresAt = scr.ExpiresAt,
                RespondedAt = scr.RespondedAt,
                CreatedAt = scr.CreatedAt
            })
            .ToListAsync();

        return Ok(requests);
    }

    [HttpPost("children/{childId}/schedule-changes")]
    public async Task<IActionResult> CreateChangeRequest(int childId, [FromBody] CreateChangeRequest request)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var changeRequest = new ScheduleChangeRequest
        {
            ChildId = childId,
            RequestedByUserId = CurrentUserId,
            Status = "Pending",
            Reason = request.Reason,
            OriginalData = request.OriginalData,
            ProposedData = request.ProposedData,
            ExpiresAt = DateTime.UtcNow.AddHours(48),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.ScheduleChangeRequests.Add(changeRequest);
        await _db.SaveChangesAsync();

        await _notifications.NotifyOtherParent(
            CurrentUserId, childId, "ScheduleChange",
            "New schedule change request",
            request.Reason ?? "A schedule change has been requested.",
            "ScheduleChangeRequest", changeRequest.Id);

        return CreatedAtAction(nameof(GetChangeRequests), new { childId }, new { id = changeRequest.Id });
    }

    [HttpPost("schedule-changes/{requestId}/approve")]
    public async Task<IActionResult> ApproveRequest(int requestId)
    {
        var changeRequest = await _db.ScheduleChangeRequests
            .Include(scr => scr.RequestedBy)
            .FirstOrDefaultAsync(scr => scr.Id == requestId);

        if (changeRequest == null)
            return NotFound(new { message = "Change request not found." });

        if (!await HasAccess(changeRequest.ChildId))
            return NotFound(new { message = "Access denied." });

        if (changeRequest.RequestedByUserId == CurrentUserId)
            return BadRequest(new { message = "You cannot approve your own request." });

        changeRequest.Status = "Approved";
        changeRequest.RespondedAt = DateTime.UtcNow;
        changeRequest.UpdatedAt = DateTime.UtcNow;

        // Apply proposed schedule changes
        try
        {
            var proposedEntries = JsonSerializer.Deserialize<List<ProposedScheduleEntry>>(
                changeRequest.ProposedData,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (proposedEntries != null)
            {
                foreach (var entry in proposedEntries)
                {
                    var dateStr = entry.Date;
                    var existing = await _db.CustodySchedules
                        .FirstOrDefaultAsync(cs => cs.ChildId == changeRequest.ChildId && cs.Date == dateStr);

                    if (existing != null)
                    {
                        existing.AssignedParentId = entry.AssignedParentId;
                        existing.Notes = entry.Notes;
                        existing.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        _db.CustodySchedules.Add(new CustodySchedule
                        {
                            ChildId = changeRequest.ChildId,
                            Date = dateStr,
                            AssignedParentId = entry.AssignedParentId,
                            Notes = entry.Notes,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        });
                    }
                }
            }
        }
        catch
        {
            // ProposedData is not in expected format; skip schedule updates
        }

        await _db.SaveChangesAsync();

        // Notify the requester
        await _notifications.CreateNotification(
            changeRequest.RequestedByUserId, changeRequest.ChildId, "ScheduleChange",
            "Schedule change approved",
            "Your schedule change request has been approved.",
            "ScheduleChangeRequest", changeRequest.Id);

        return Ok(new { id = changeRequest.Id, status = changeRequest.Status });
    }

    [HttpPost("schedule-changes/{requestId}/decline")]
    public async Task<IActionResult> DeclineRequest(int requestId)
    {
        var changeRequest = await _db.ScheduleChangeRequests.FindAsync(requestId);
        if (changeRequest == null)
            return NotFound(new { message = "Change request not found." });

        if (!await HasAccess(changeRequest.ChildId))
            return NotFound(new { message = "Access denied." });

        changeRequest.Status = "Declined";
        changeRequest.RespondedAt = DateTime.UtcNow;
        changeRequest.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _notifications.CreateNotification(
            changeRequest.RequestedByUserId, changeRequest.ChildId, "ScheduleChange",
            "Schedule change declined",
            "Your schedule change request has been declined.",
            "ScheduleChangeRequest", changeRequest.Id);

        return Ok(new { id = changeRequest.Id, status = changeRequest.Status });
    }

    [HttpPost("schedule-changes/{requestId}/counter")]
    public async Task<IActionResult> CounterPropose(int requestId, [FromBody] RespondToChangeRequest request)
    {
        var originalRequest = await _db.ScheduleChangeRequests.FindAsync(requestId);
        if (originalRequest == null)
            return NotFound(new { message = "Change request not found." });

        if (!await HasAccess(originalRequest.ChildId))
            return NotFound(new { message = "Access denied." });

        originalRequest.Status = "CounterProposed";
        originalRequest.CounterData = request.CounterData;
        originalRequest.RespondedAt = DateTime.UtcNow;
        originalRequest.UpdatedAt = DateTime.UtcNow;

        // Create a new linked counter-proposal request
        var counterRequest = new ScheduleChangeRequest
        {
            ChildId = originalRequest.ChildId,
            RequestedByUserId = CurrentUserId,
            Status = "Pending",
            Reason = "Counter-proposal",
            OriginalData = originalRequest.ProposedData,
            ProposedData = request.CounterData ?? originalRequest.ProposedData,
            ParentRequestId = originalRequest.Id,
            ExpiresAt = DateTime.UtcNow.AddHours(48),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.ScheduleChangeRequests.Add(counterRequest);
        await _db.SaveChangesAsync();

        await _notifications.CreateNotification(
            originalRequest.RequestedByUserId, originalRequest.ChildId, "ScheduleChange",
            "Counter-proposal received",
            "A counter-proposal has been made to your schedule change request.",
            "ScheduleChangeRequest", counterRequest.Id);

        return Ok(new { id = counterRequest.Id, status = counterRequest.Status, parentRequestId = originalRequest.Id });
    }

    [HttpGet("children/{childId}/schedule-changes/history")]
    public async Task<IActionResult> GetHistory(int childId)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var history = await _db.ScheduleChangeRequests
            .Where(scr => scr.ChildId == childId && scr.Status != "Pending")
            .Include(scr => scr.RequestedBy)
            .OrderByDescending(scr => scr.UpdatedAt)
            .Select(scr => new ChangeRequestDto
            {
                Id = scr.Id,
                ChildId = scr.ChildId,
                RequestedByUserId = scr.RequestedByUserId,
                RequestedByName = scr.RequestedBy.FirstName + " " + scr.RequestedBy.LastName,
                Status = scr.Status,
                Reason = scr.Reason,
                OriginalData = scr.OriginalData,
                ProposedData = scr.ProposedData,
                CounterData = scr.CounterData,
                ExpiresAt = scr.ExpiresAt,
                RespondedAt = scr.RespondedAt,
                CreatedAt = scr.CreatedAt
            })
            .ToListAsync();

        return Ok(history);
    }

    [HttpGet("children/{childId}/schedule-changes/export")]
    public async Task<IActionResult> ExportHistory(int childId)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var history = await _db.ScheduleChangeRequests
            .Where(scr => scr.ChildId == childId)
            .Include(scr => scr.RequestedBy)
            .OrderByDescending(scr => scr.CreatedAt)
            .ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("Id,ChildId,RequestedBy,Status,Reason,OriginalData,ProposedData,CounterData,ExpiresAt,RespondedAt,CreatedAt");

        foreach (var scr in history)
        {
            var reason = EscapeCsv(scr.Reason);
            var originalData = EscapeCsv(scr.OriginalData);
            var proposedData = EscapeCsv(scr.ProposedData);
            var counterData = EscapeCsv(scr.CounterData);
            var requestedBy = $"{scr.RequestedBy.FirstName} {scr.RequestedBy.LastName}";

            csv.AppendLine($"{scr.Id},{scr.ChildId},{EscapeCsv(requestedBy)},{scr.Status},{reason},{originalData},{proposedData},{counterData},{scr.ExpiresAt:O},{scr.RespondedAt?.ToString("O") ?? ""},{scr.CreatedAt:O}");
        }

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", $"schedule-changes-child-{childId}.csv");
    }

    private static string EscapeCsv(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }
}

public class ProposedScheduleEntry
{
    public string Date { get; set; } = "";
    public int AssignedParentId { get; set; }
    public string? Notes { get; set; }
}
