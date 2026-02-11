namespace SplitWeek.Server.DTOs.Notifications;

public class NotificationDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int ChildId { get; set; }
    public required string Category { get; set; }
    public required string Title { get; set; }
    public string? Body { get; set; }
    public string? RelatedEntityType { get; set; }
    public int? RelatedEntityId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}
