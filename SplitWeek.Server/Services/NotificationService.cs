using Microsoft.EntityFrameworkCore;
using SplitWeek.Server.Data;
using SplitWeek.Server.Models;

namespace SplitWeek.Server.Services;

public class NotificationService
{
    private readonly SplitWeekDbContext _db;

    public NotificationService(SplitWeekDbContext db)
    {
        _db = db;
    }

    public async Task CreateNotification(int userId, int childId, string category, string title, string? body = null, string? relatedEntityType = null, int? relatedEntityId = null)
    {
        var notification = new ChangeNotification
        {
            UserId = userId,
            ChildId = childId,
            Category = category,
            Title = title,
            Body = body,
            RelatedEntityType = relatedEntityType,
            RelatedEntityId = relatedEntityId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.ChangeNotifications.Add(notification);
        await _db.SaveChangesAsync();
    }

    public async Task NotifyOtherParent(int currentUserId, int childId, string category, string title, string? body = null, string? relatedEntityType = null, int? relatedEntityId = null)
    {
        var otherParent = await _db.ParentChildren
            .Where(pc => pc.ChildId == childId && pc.UserId != currentUserId)
            .Select(pc => pc.UserId)
            .FirstOrDefaultAsync();

        if (otherParent != 0)
        {
            await CreateNotification(otherParent, childId, category, title, body, relatedEntityType, relatedEntityId);
        }
    }
}
