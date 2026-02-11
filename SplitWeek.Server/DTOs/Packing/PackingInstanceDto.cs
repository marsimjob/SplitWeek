namespace SplitWeek.Server.DTOs.Packing;

public class PackingInstanceDto
{
    public int Id { get; set; }
    public int ChildId { get; set; }
    public int? ScheduleId { get; set; }
    public string? TemplateName { get; set; }
    public string? PackedByName { get; set; }
    public required string Status { get; set; }
    public DateTime? ReadyAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public List<PackingInstanceItemDto> Items { get; set; } = [];
    public int CheckedCount { get; set; }
    public int TotalCount { get; set; }
}
