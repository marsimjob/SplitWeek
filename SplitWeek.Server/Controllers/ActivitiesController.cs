using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SplitWeek.Server.Data;
using SplitWeek.Server.DTOs.Children;
using SplitWeek.Server.Models;

namespace SplitWeek.Server.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class ActivitiesController : ControllerBase
{
    private readonly SplitWeekDbContext _db;

    public ActivitiesController(SplitWeekDbContext db)
    {
        _db = db;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> HasAccess(int childId)
    {
        return await _db.ParentChildren.AnyAsync(pc => pc.ChildId == childId && pc.UserId == CurrentUserId);
    }

    [HttpGet("children/{childId}/activities")]
    public async Task<IActionResult> GetActivities(int childId)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var activities = await _db.Activities
            .Where(a => a.ChildId == childId && a.IsActive)
            .OrderBy(a => a.DayOfWeek)
            .ThenBy(a => a.StartTime)
            .Select(a => new ActivityDto
            {
                Id = a.Id,
                ChildId = a.ChildId,
                Name = a.Name,
                DayOfWeek = a.DayOfWeek,
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                Location = a.Location,
                Notes = a.Notes,
                IsActive = a.IsActive
            })
            .ToListAsync();

        return Ok(activities);
    }

    [HttpPost("children/{childId}/activities")]
    public async Task<IActionResult> CreateActivity(int childId, [FromBody] CreateActivityRequest request)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var activity = new Activity
        {
            ChildId = childId,
            Name = request.Name,
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Location = request.Location,
            Notes = request.Notes,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Activities.Add(activity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetActivities), new { childId }, new { id = activity.Id });
    }

    [HttpPut("activities/{activityId}")]
    public async Task<IActionResult> UpdateActivity(int activityId, [FromBody] CreateActivityRequest request)
    {
        var activity = await _db.Activities.FindAsync(activityId);
        if (activity == null)
            return NotFound(new { message = "Activity not found." });

        if (!await HasAccess(activity.ChildId))
            return NotFound(new { message = "Access denied." });

        activity.Name = request.Name;
        activity.DayOfWeek = request.DayOfWeek;
        activity.StartTime = request.StartTime;
        activity.EndTime = request.EndTime;
        activity.Location = request.Location;
        activity.Notes = request.Notes;

        await _db.SaveChangesAsync();
        return Ok(new { id = activity.Id });
    }

    [HttpDelete("activities/{activityId}")]
    public async Task<IActionResult> DeleteActivity(int activityId)
    {
        var activity = await _db.Activities.FindAsync(activityId);
        if (activity == null)
            return NotFound(new { message = "Activity not found." });

        if (!await HasAccess(activity.ChildId))
            return NotFound(new { message = "Access denied." });

        _db.Activities.Remove(activity);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
