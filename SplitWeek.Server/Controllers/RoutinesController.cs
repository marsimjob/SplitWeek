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
public class RoutinesController : ControllerBase
{
    private readonly SplitWeekDbContext _db;
    private readonly NotificationService _notifications;

    public RoutinesController(SplitWeekDbContext db, NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> HasAccess(int childId)
    {
        return await _db.ParentChildren.AnyAsync(pc => pc.ChildId == childId && pc.UserId == CurrentUserId);
    }

    [HttpGet("children/{childId}/routines")]
    public async Task<IActionResult> GetRoutines(int childId)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var routines = await _db.DailyRoutines
            .Where(r => r.ChildId == childId)
            .OrderBy(r => r.SortOrder)
            .Select(r => new RoutineDto
            {
                Id = r.Id,
                ChildId = r.ChildId,
                RoutineType = r.RoutineType,
                Description = r.Description,
                TimeOfDay = r.TimeOfDay,
                Notes = r.Notes,
                SortOrder = r.SortOrder
            })
            .ToListAsync();

        return Ok(routines);
    }

    [HttpPost("children/{childId}/routines")]
    public async Task<IActionResult> CreateRoutine(int childId, [FromBody] CreateRoutineRequest request)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var routine = new DailyRoutine
        {
            ChildId = childId,
            RoutineType = request.RoutineType,
            Description = request.Description,
            TimeOfDay = request.TimeOfDay,
            Notes = request.Notes,
            SortOrder = request.SortOrder ?? 0,
            UpdatedAt = DateTime.UtcNow
        };

        _db.DailyRoutines.Add(routine);
        await _db.SaveChangesAsync();

        await _notifications.NotifyOtherParent(
            CurrentUserId, childId, "Routine",
            "New routine added",
            $"A new routine '{routine.Description}' has been added.",
            "DailyRoutine", routine.Id);

        return CreatedAtAction(nameof(GetRoutines), new { childId }, new { id = routine.Id });
    }

    [HttpPut("routines/{routineId}")]
    public async Task<IActionResult> UpdateRoutine(int routineId, [FromBody] CreateRoutineRequest request)
    {
        var routine = await _db.DailyRoutines.FindAsync(routineId);
        if (routine == null)
            return NotFound(new { message = "Routine not found." });

        if (!await HasAccess(routine.ChildId))
            return NotFound(new { message = "Access denied." });

        routine.RoutineType = request.RoutineType;
        routine.Description = request.Description;
        routine.TimeOfDay = request.TimeOfDay;
        routine.Notes = request.Notes;
        routine.SortOrder = request.SortOrder ?? routine.SortOrder;
        routine.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _notifications.NotifyOtherParent(
            CurrentUserId, routine.ChildId, "Routine",
            "Routine updated",
            $"The routine '{routine.Description}' has been updated.",
            "DailyRoutine", routine.Id);

        return Ok(new { id = routine.Id });
    }

    [HttpDelete("routines/{routineId}")]
    public async Task<IActionResult> DeleteRoutine(int routineId)
    {
        var routine = await _db.DailyRoutines.FindAsync(routineId);
        if (routine == null)
            return NotFound(new { message = "Routine not found." });

        if (!await HasAccess(routine.ChildId))
            return NotFound(new { message = "Access denied." });

        _db.DailyRoutines.Remove(routine);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
