namespace SplitWeek.Server.DTOs.ScheduleChanges;

public class ChangeRequestDto
{
    public int Id { get; set; }
    public int ChildId { get; set; }
    public int RequestedByUserId { get; set; }
    public string? RequestedByName { get; set; }
    public required string Status { get; set; }
    public string? Reason { get; set; }
    public required string OriginalData { get; set; }
    public required string ProposedData { get; set; }
    public string? CounterData { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? RespondedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
