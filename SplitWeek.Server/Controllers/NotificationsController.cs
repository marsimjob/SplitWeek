using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SplitWeek.Server.Data;
using SplitWeek.Server.DTOs.Notifications;

namespace SplitWeek.Server.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly SplitWeekDbContext _db;

    public NotificationsController(SplitWeekDbContext db)
    {
        _db = db;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] bool? unreadOnly)
    {
        var query = _db.ChangeNotifications
            .Where(n => n.UserId == CurrentUserId);

        if (unreadOnly == true)
        {
            query = query.Where(n => !n.IsRead);
        }

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                UserId = n.UserId,
                ChildId = n.ChildId,
                Category = n.Category,
                Title = n.Title,
                Body = n.Body,
                RelatedEntityType = n.RelatedEntityType,
                RelatedEntityId = n.RelatedEntityId,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpPost("{notificationId}/read")]
    public async Task<IActionResult> MarkAsRead(int notificationId)
    {
        var notification = await _db.ChangeNotifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == CurrentUserId);

        if (notification == null)
            return NotFound(new { message = "Notification not found." });

        notification.IsRead = true;
        await _db.SaveChangesAsync();

        return Ok(new { id = notification.Id, isRead = true });
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var unread = await _db.ChangeNotifications
            .Where(n => n.UserId == CurrentUserId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in unread)
        {
            notification.IsRead = true;
        }

        await _db.SaveChangesAsync();

        return Ok(new { markedCount = unread.Count });
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount()
    {
        var count = await _db.ChangeNotifications
            .Where(n => n.UserId == CurrentUserId && !n.IsRead)
            .CountAsync();

        return Ok(new { count });
    }
}
