namespace SplitWeek.Server.DTOs.Children;

public class RoutineDto
{
    public int Id { get; set; }
    public int ChildId { get; set; }
    public required string RoutineType { get; set; }
    public required string Description { get; set; }
    public string? TimeOfDay { get; set; }
    public string? Notes { get; set; }
    public int SortOrder { get; set; }
}
