using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SplitWeek.Server.Data;
using SplitWeek.Server.Models;

namespace SplitWeek.Server.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly SplitWeekDbContext _db;

    public ChatHub(SplitWeekDbContext db)
    {
        _db = db;
    }

    private int CurrentUserId => int.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);

    public override async Task OnConnectedAsync()
    {
        // Join groups for each child the user is linked to
        var childIds = await _db.ParentChildren
            .Where(pc => pc.UserId == CurrentUserId)
            .Select(pc => pc.ChildId)
            .ToListAsync();

        foreach (var childId in childIds)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"child-{childId}");
        }

        await base.OnConnectedAsync();
    }

    public async Task SendMessage(int childId, string body, string type, string? subject)
    {
        var hasAccess = await _db.ParentChildren
            .AnyAsync(pc => pc.ChildId == childId && pc.UserId == CurrentUserId);

        if (!hasAccess) return;

        var otherParentId = await _db.ParentChildren
            .Where(pc => pc.ChildId == childId && pc.UserId != CurrentUserId)
            .Select(pc => pc.UserId)
            .FirstOrDefaultAsync();

        if (otherParentId == 0) return;

        var sender = await _db.Users.FindAsync(CurrentUserId);
        if (sender == null) return;

        var message = new Message
        {
            ChildId = childId,
            SenderId = CurrentUserId,
            RecipientId = otherParentId,
            Type = type,
            Subject = subject,
            Body = body,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.Messages.Add(message);
        await _db.SaveChangesAsync();

        // Create notification
        var notification = new ChangeNotification
        {
            UserId = otherParentId,
            ChildId = childId,
            Category = "Message",
            Title = "New message",
            Body = body.Length > 100 ? body[..100] + "..." : body,
            RelatedEntityType = "Message",
            RelatedEntityId = message.Id,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        _db.ChangeNotifications.Add(notification);
        await _db.SaveChangesAsync();

        var messageDto = new
        {
            id = message.Id,
            childId = message.ChildId,
            senderId = message.SenderId,
            senderName = $"{sender.FirstName} {sender.LastName}",
            recipientId = message.RecipientId,
            type = message.Type,
            subject = message.Subject,
            body = message.Body,
            isRead = false,
            createdAt = message.CreatedAt
        };

        // Send to both parents in the child's group
        await Clients.Group($"child-{childId}").SendAsync("ReceiveMessage", messageDto);

        // Notify unread count update
        await Clients.Group($"child-{childId}").SendAsync("UnreadCountUpdated", childId);
    }

    public async Task MarkMessagesRead(int childId)
    {
        var unread = await _db.Messages
            .Where(m => m.ChildId == childId && m.RecipientId == CurrentUserId && !m.IsRead)
            .ToListAsync();

        foreach (var msg in unread)
        {
            msg.IsRead = true;
        }

        await _db.SaveChangesAsync();

        // Notify the sender that messages were read
        await Clients.Group($"child-{childId}").SendAsync("MessagesRead", new
        {
            childId,
            readByUserId = CurrentUserId,
            messageIds = unread.Select(m => m.Id).ToList()
        });
    }

    public async Task SendTypingIndicator(int childId, bool isTyping)
    {
        var sender = await _db.Users.FindAsync(CurrentUserId);
        if (sender == null) return;

        await Clients.OthersInGroup($"child-{childId}").SendAsync("TypingIndicator", new
        {
            childId,
            userId = CurrentUserId,
            userName = sender.FirstName,
            isTyping
        });
    }
}
