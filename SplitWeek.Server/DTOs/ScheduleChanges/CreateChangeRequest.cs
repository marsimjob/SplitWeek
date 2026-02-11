namespace SplitWeek.Server.DTOs.ScheduleChanges;

public class CreateChangeRequest
{
    public string? Reason { get; set; }
    public required string OriginalData { get; set; }
    public required string ProposedData { get; set; }
}
