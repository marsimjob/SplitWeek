using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SplitWeek.Server.Data;
using SplitWeek.Server.DTOs.Notifications;
using SplitWeek.Server.Models;

namespace SplitWeek.Server.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class RemindersController : ControllerBase
{
    private readonly SplitWeekDbContext _db;

    public RemindersController(SplitWeekDbContext db)
    {
        _db = db;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> HasAccess(int childId)
    {
        return await _db.ParentChildren.AnyAsync(pc => pc.ChildId == childId && pc.UserId == CurrentUserId);
    }

    [HttpGet("children/{childId}/reminders")]
    public async Task<IActionResult> GetReminders(int childId, [FromQuery] bool? upcoming)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var query = _db.Reminders.Where(r => r.ChildId == childId && r.UserId == CurrentUserId);

        if (upcoming == true)
        {
            var now = DateTime.UtcNow;
            query = query.Where(r => r.TriggerAt > now && !r.IsDismissed);
        }

        var reminders = await query
            .OrderBy(r => r.TriggerAt)
            .Select(r => new ReminderDto
            {
                Id = r.Id,
                ChildId = r.ChildId,
                UserId = r.UserId,
                ScheduleId = r.ScheduleId,
                Type = r.Type,
                Message = r.Message,
                TriggerAt = r.TriggerAt,
                IntervalMinutes = r.IntervalMinutes,
                IsDismissed = r.IsDismissed,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(reminders);
    }

    [HttpPost("children/{childId}/reminders")]
    public async Task<IActionResult> CreateReminder(int childId, [FromBody] CreateReminderRequest request)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var reminder = new Reminder
        {
            ChildId = childId,
            UserId = CurrentUserId,
            ScheduleId = request.ScheduleId,
            Type = request.Type,
            Message = request.Message,
            TriggerAt = request.TriggerAt,
            IntervalMinutes = request.IntervalMinutes,
            IsDismissed = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.Reminders.Add(reminder);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetReminders), new { childId }, new { id = reminder.Id });
    }

    [HttpPut("reminders/{reminderId}")]
    public async Task<IActionResult> UpdateReminder(int reminderId, [FromBody] CreateReminderRequest request)
    {
        var reminder = await _db.Reminders.FirstOrDefaultAsync(r => r.Id == reminderId && r.UserId == CurrentUserId);
        if (reminder == null)
            return NotFound(new { message = "Reminder not found." });

        reminder.Type = request.Type;
        reminder.Message = request.Message;
        reminder.TriggerAt = request.TriggerAt;
        reminder.IntervalMinutes = request.IntervalMinutes;
        reminder.ScheduleId = request.ScheduleId;

        await _db.SaveChangesAsync();
        return Ok(new { id = reminder.Id });
    }

    [HttpPost("reminders/{reminderId}/dismiss")]
    public async Task<IActionResult> DismissReminder(int reminderId)
    {
        var reminder = await _db.Reminders.FirstOrDefaultAsync(r => r.Id == reminderId && r.UserId == CurrentUserId);
        if (reminder == null)
            return NotFound(new { message = "Reminder not found." });

        reminder.IsDismissed = true;
        await _db.SaveChangesAsync();

        return Ok(new { id = reminder.Id, isDismissed = true });
    }

    [HttpDelete("reminders/{reminderId}")]
    public async Task<IActionResult> DeleteReminder(int reminderId)
    {
        var reminder = await _db.Reminders.FirstOrDefaultAsync(r => r.Id == reminderId && r.UserId == CurrentUserId);
        if (reminder == null)
            return NotFound(new { message = "Reminder not found." });

        _db.Reminders.Remove(reminder);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

public class CreateReminderRequest
{
    public required string Type { get; set; }
    public required string Message { get; set; }
    public DateTime TriggerAt { get; set; }
    public int? IntervalMinutes { get; set; }
    public int? ScheduleId { get; set; }
}
