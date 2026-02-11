namespace SplitWeek.Server.DTOs.Calendar;

public class ScheduleUpsertRequest
{
    public required string Date { get; set; }
    public int AssignedParentId { get; set; }
    public string? Notes { get; set; }
    public string? HandoffTime { get; set; }
    public string? HandoffLocation { get; set; }
}
