using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SplitWeek.Server.Data;
using SplitWeek.Server.DTOs.Calendar;
using SplitWeek.Server.Models;
using SplitWeek.Server.Services;

namespace SplitWeek.Server.Controllers;

[ApiController]
[Route("api/children/{childId}/schedule")]
[Authorize]
public class ScheduleController : ControllerBase
{
    private readonly SplitWeekDbContext _db;
    private readonly NotificationService _notifications;

    public ScheduleController(SplitWeekDbContext db, NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> HasAccess(int childId)
    {
        return await _db.ParentChildren.AnyAsync(pc => pc.ChildId == childId && pc.UserId == CurrentUserId);
    }

    [HttpGet]
    public async Task<IActionResult> GetSchedule(int childId, [FromQuery] string? month)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var query = _db.CustodySchedules
            .Where(cs => cs.ChildId == childId)
            .Include(cs => cs.AssignedParent);

        IQueryable<CustodySchedule> filtered = query;

        if (!string.IsNullOrEmpty(month))
        {
            // month format: "2026-02"
            filtered = query.Where(cs => cs.Date.StartsWith(month));
        }

        var schedules = await filtered
            .OrderBy(cs => cs.Date)
            .Select(cs => new ScheduleDto
            {
                Id = cs.Id,
                ChildId = cs.ChildId,
                Date = cs.Date,
                AssignedParentId = cs.AssignedParentId,
                AssignedParentName = cs.AssignedParent.FirstName + " " + cs.AssignedParent.LastName,
                Notes = cs.Notes,
                HandoffTime = cs.HandoffTime,
                HandoffLocation = cs.HandoffLocation,
                HandoffConfirmedAt = cs.HandoffConfirmedAt,
                IsHandoffDay = cs.HandoffTime != null
            })
            .ToListAsync();

        return Ok(schedules);
    }

    [HttpPost]
    public async Task<IActionResult> CreateSchedule(int childId, [FromBody] ScheduleUpsertRequest request)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var schedule = new CustodySchedule
        {
            ChildId = childId,
            Date = request.Date,
            AssignedParentId = request.AssignedParentId == 0
                ? CurrentUserId
                : await GetParentIdFromRequest(childId, request.AssignedParentId),
            Notes = request.Notes,
            HandoffTime = request.HandoffTime,
            HandoffLocation = request.HandoffLocation,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.CustodySchedules.Add(schedule);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSchedule), new { childId }, new { id = schedule.Id });
    }

    [HttpPut("{scheduleId}")]
    public async Task<IActionResult> UpdateSchedule(int childId, int scheduleId, [FromBody] ScheduleUpsertRequest request)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var schedule = await _db.CustodySchedules.FirstOrDefaultAsync(cs => cs.Id == scheduleId && cs.ChildId == childId);
        if (schedule == null)
            return NotFound(new { message = "Schedule entry not found." });

        schedule.Notes = request.Notes;
        schedule.HandoffTime = request.HandoffTime;
        schedule.HandoffLocation = request.HandoffLocation;
        schedule.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { id = schedule.Id });
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> BulkUpsert(int childId, [FromBody] BulkScheduleRequest request)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var results = new List<object>();

        foreach (var entry in request.Entries)
        {
            var dateStr = entry.Date;
            var existing = await _db.CustodySchedules
                .FirstOrDefaultAsync(cs => cs.ChildId == childId && cs.Date == dateStr);

            if (existing != null)
            {
                existing.AssignedParentId = await GetParentIdFromRequest(childId, entry.AssignedParentId);
                existing.Notes = entry.Notes;
                existing.HandoffTime = entry.HandoffTime;
                existing.HandoffLocation = entry.HandoffLocation;
                existing.UpdatedAt = DateTime.UtcNow;
                results.Add(new { id = existing.Id, date = dateStr, action = "updated" });
            }
            else
            {
                var schedule = new CustodySchedule
                {
                    ChildId = childId,
                    Date = dateStr,
                    AssignedParentId = await GetParentIdFromRequest(childId, entry.AssignedParentId),
                    Notes = entry.Notes,
                    HandoffTime = entry.HandoffTime,
                    HandoffLocation = entry.HandoffLocation,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.CustodySchedules.Add(schedule);
                await _db.SaveChangesAsync();
                results.Add(new { id = schedule.Id, date = dateStr, action = "created" });
            }
        }

        await _db.SaveChangesAsync();
        return Ok(results);
    }

    [HttpPost("{scheduleId}/confirm-handoff")]
    public async Task<IActionResult> ConfirmHandoff(int childId, int scheduleId)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var schedule = await _db.CustodySchedules
            .FirstOrDefaultAsync(cs => cs.Id == scheduleId && cs.ChildId == childId);

        if (schedule == null)
            return NotFound(new { message = "Schedule entry not found." });

        schedule.HandoffConfirmedAt = DateTime.UtcNow;
        schedule.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _notifications.NotifyOtherParent(
            CurrentUserId, childId, "Schedule",
            "Handoff confirmed",
            $"Handoff for {schedule.Date} has been confirmed.",
            "CustodySchedule", schedule.Id);

        return Ok(new { id = schedule.Id, handoffConfirmedAt = schedule.HandoffConfirmedAt });
    }

    private async Task<int> GetParentIdFromRequest(int childId, int assignedParentId)
    {
        // If the ID is 0 or not provided, default to current user.
        // Otherwise, verify the parent is linked to this child.
        if (assignedParentId == 0)
            return CurrentUserId;

        var parents = await _db.ParentChildren
            .Where(pc => pc.ChildId == childId)
            .Select(pc => pc.UserId)
            .ToListAsync();

        // Return the requested parent ID if valid, otherwise current user as fallback
        return parents.Contains(assignedParentId) ? assignedParentId : CurrentUserId;
    }
}
