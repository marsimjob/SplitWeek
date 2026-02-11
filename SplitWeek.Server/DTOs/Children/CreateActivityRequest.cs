namespace SplitWeek.Server.DTOs.Children;

public class CreateActivityRequest
{
    public required string Name { get; set; }
    public int? DayOfWeek { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? Location { get; set; }
    public string? Notes { get; set; }
}
