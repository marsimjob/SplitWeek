namespace SplitWeek.Server.DTOs.Messages;

public class SendMessageRequest
{
    public required string Type { get; set; }
    public string? Subject { get; set; }
    public required string Body { get; set; }
    public int? RelatedScheduleId { get; set; }
}
