using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SplitWeek.Server.Data;
using SplitWeek.Server.DTOs.Messages;
using SplitWeek.Server.Models;
using SplitWeek.Server.Services;

namespace SplitWeek.Server.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly SplitWeekDbContext _db;
    private readonly NotificationService _notifications;

    public MessagesController(SplitWeekDbContext db, NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> HasAccess(int childId)
    {
        return await _db.ParentChildren.AnyAsync(pc => pc.ChildId == childId && pc.UserId == CurrentUserId);
    }

    [HttpGet("children/{childId}/messages")]
    public async Task<IActionResult> GetMessages(int childId, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var totalCount = await _db.Messages
            .Where(m => m.ChildId == childId && (m.SenderId == CurrentUserId || m.RecipientId == CurrentUserId))
            .CountAsync();

        var messages = await _db.Messages
            .Where(m => m.ChildId == childId && (m.SenderId == CurrentUserId || m.RecipientId == CurrentUserId))
            .Include(m => m.Sender)
            .Include(m => m.Recipient)
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MessageDto
            {
                Id = m.Id,
                ChildId = m.ChildId,
                SenderId = m.SenderId,
                SenderName = m.Sender.FirstName + " " + m.Sender.LastName,
                RecipientId = m.RecipientId,
                RecipientName = m.Recipient.FirstName + " " + m.Recipient.LastName,
                Type = m.Type,
                Subject = m.Subject,
                Body = m.Body,
                RelatedScheduleId = m.RelatedScheduleId,
                RelatedRequestId = m.RelatedRequestId,
                IsRead = m.IsRead,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync();

        return Ok(new { data = messages, totalCount, page, pageSize });
    }

    [HttpPost("children/{childId}/messages")]
    public async Task<IActionResult> SendMessage(int childId, [FromBody] SendMessageRequest request)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        // Find the other parent for this child
        var otherParentId = await _db.ParentChildren
            .Where(pc => pc.ChildId == childId && pc.UserId != CurrentUserId)
            .Select(pc => pc.UserId)
            .FirstOrDefaultAsync();

        if (otherParentId == 0)
            return BadRequest(new { message = "No other parent linked to this child." });

        var msg = new Message
        {
            ChildId = childId,
            SenderId = CurrentUserId,
            RecipientId = otherParentId,
            Type = request.Type,
            Subject = request.Subject,
            Body = request.Body,
            RelatedScheduleId = null,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.Messages.Add(msg);
        await _db.SaveChangesAsync();

        // Create notification for the recipient
        await _notifications.CreateNotification(
            otherParentId, childId, "Message",
            "New message received",
            request.Subject ?? (request.Body.Length > 100 ? request.Body[..100] + "..." : request.Body),
            "Message", msg.Id);

        return CreatedAtAction(nameof(GetMessages), new { childId }, new { id = msg.Id });
    }

    [HttpPost("messages/{messageId}/read")]
    public async Task<IActionResult> MarkAsRead(int messageId)
    {
        var message = await _db.Messages.FirstOrDefaultAsync(m => m.Id == messageId && m.RecipientId == CurrentUserId);
        if (message == null)
            return NotFound(new { message = "Message not found." });

        message.IsRead = true;
        await _db.SaveChangesAsync();

        return Ok(new { id = message.Id, isRead = true });
    }

    [HttpGet("children/{childId}/messages/unread-count")]
    public async Task<IActionResult> UnreadCount(int childId)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var count = await _db.Messages
            .Where(m => m.ChildId == childId && m.RecipientId == CurrentUserId && !m.IsRead)
            .CountAsync();

        return Ok(new { count });
    }
}
