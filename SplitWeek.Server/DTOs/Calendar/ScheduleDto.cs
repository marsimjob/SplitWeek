namespace SplitWeek.Server.DTOs.Calendar;

public class ScheduleDto
{
    public int Id { get; set; }
    public int ChildId { get; set; }
    public required string Date { get; set; }
    public int AssignedParentId { get; set; }
    public string? AssignedParentName { get; set; }
    public string? Notes { get; set; }
    public string? HandoffTime { get; set; }
    public string? HandoffLocation { get; set; }
    public DateTime? HandoffConfirmedAt { get; set; }
    public bool IsHandoffDay { get; set; }
}
