namespace SplitWeek.Server.DTOs.Messages;

public class MessageDto
{
    public int Id { get; set; }
    public int ChildId { get; set; }
    public int SenderId { get; set; }
    public string? SenderName { get; set; }
    public int RecipientId { get; set; }
    public string? RecipientName { get; set; }
    public required string Type { get; set; }
    public string? Subject { get; set; }
    public required string Body { get; set; }
    public int? RelatedScheduleId { get; set; }
    public int? RelatedRequestId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}
