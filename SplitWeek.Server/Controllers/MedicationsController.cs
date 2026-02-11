using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SplitWeek.Server.Data;
using SplitWeek.Server.DTOs.Children;
using SplitWeek.Server.Models;
using SplitWeek.Server.Services;

namespace SplitWeek.Server.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class MedicationsController : ControllerBase
{
    private readonly SplitWeekDbContext _db;
    private readonly NotificationService _notifications;

    public MedicationsController(SplitWeekDbContext db, NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> HasAccess(int childId)
    {
        return await _db.ParentChildren.AnyAsync(pc => pc.ChildId == childId && pc.UserId == CurrentUserId);
    }

    [HttpGet("children/{childId}/medications")]
    public async Task<IActionResult> GetMedications(int childId)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var medications = await _db.Medications
            .Where(m => m.ChildId == childId && m.IsActive)
            .Include(m => m.Logs.OrderByDescending(l => l.AdministeredAt).Take(5))
                .ThenInclude(l => l.AdministeredBy)
            .OrderBy(m => m.Name)
            .Select(m => new MedicationDto
            {
                Id = m.Id,
                ChildId = m.ChildId,
                Name = m.Name,
                Dosage = m.Dosage,
                Frequency = m.Frequency,
                Instructions = m.Instructions,
                IsActive = m.IsActive,
                LatestLogs = m.Logs.Select(l => new MedicationLogDto
                {
                    Id = l.Id,
                    MedicationId = l.MedicationId,
                    AdministeredByName = l.AdministeredBy.FirstName + " " + l.AdministeredBy.LastName,
                    AdministeredAt = l.AdministeredAt,
                    Notes = l.Notes,
                    WasMissed = l.WasMissed
                }).ToList()
            })
            .ToListAsync();

        return Ok(medications);
    }

    [HttpPost("children/{childId}/medications")]
    public async Task<IActionResult> CreateMedication(int childId, [FromBody] CreateMedicationRequest request)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var medication = new Medication
        {
            ChildId = childId,
            Name = request.Name,
            Dosage = request.Dosage,
            Frequency = request.Frequency,
            Instructions = request.Instructions,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Medications.Add(medication);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMedications), new { childId }, new { id = medication.Id });
    }

    [HttpPut("medications/{medicationId}")]
    public async Task<IActionResult> UpdateMedication(int medicationId, [FromBody] CreateMedicationRequest request)
    {
        var medication = await _db.Medications.FindAsync(medicationId);
        if (medication == null)
            return NotFound(new { message = "Medication not found." });

        if (!await HasAccess(medication.ChildId))
            return NotFound(new { message = "Access denied." });

        medication.Name = request.Name;
        medication.Dosage = request.Dosage;
        medication.Frequency = request.Frequency;
        medication.Instructions = request.Instructions;

        await _db.SaveChangesAsync();
        return Ok(new { id = medication.Id });
    }

    [HttpPost("medications/{medicationId}/log")]
    public async Task<IActionResult> LogDose(int medicationId, [FromBody] LogMedicationRequest request)
    {
        var medication = await _db.Medications.FindAsync(medicationId);
        if (medication == null)
            return NotFound(new { message = "Medication not found." });

        if (!await HasAccess(medication.ChildId))
            return NotFound(new { message = "Access denied." });

        var log = new MedicationLog
        {
            MedicationId = medicationId,
            AdministeredByUserId = CurrentUserId,
            AdministeredAt = request.AdministeredAt,
            Notes = request.Notes,
            WasMissed = request.WasMissed
        };

        _db.MedicationLogs.Add(log);
        await _db.SaveChangesAsync();

        var action = request.WasMissed ? "missed" : "administered";
        await _notifications.NotifyOtherParent(
            CurrentUserId, medication.ChildId, "Medication",
            $"Medication {action}: {medication.Name}",
            $"{medication.Name} ({medication.Dosage}) was {action}.",
            "MedicationLog", log.Id);

        return Ok(new { id = log.Id });
    }

    [HttpGet("medications/{medicationId}/logs")]
    public async Task<IActionResult> GetLogs(int medicationId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var medication = await _db.Medications.FindAsync(medicationId);
        if (medication == null)
            return NotFound(new { message = "Medication not found." });

        if (!await HasAccess(medication.ChildId))
            return NotFound(new { message = "Access denied." });

        var query = _db.MedicationLogs
            .Where(l => l.MedicationId == medicationId)
            .Include(l => l.AdministeredBy)
            .AsQueryable();

        if (from.HasValue)
            query = query.Where(l => l.AdministeredAt >= from.Value);

        if (to.HasValue)
            query = query.Where(l => l.AdministeredAt <= to.Value);

        var logs = await query
            .OrderByDescending(l => l.AdministeredAt)
            .Select(l => new MedicationLogDto
            {
                Id = l.Id,
                MedicationId = l.MedicationId,
                AdministeredByName = l.AdministeredBy.FirstName + " " + l.AdministeredBy.LastName,
                AdministeredAt = l.AdministeredAt,
                Notes = l.Notes,
                WasMissed = l.WasMissed
            })
            .ToListAsync();

        return Ok(logs);
    }
}
