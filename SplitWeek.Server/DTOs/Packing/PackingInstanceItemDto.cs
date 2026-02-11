namespace SplitWeek.Server.DTOs.Packing;

public class PackingInstanceItemDto
{
    public int Id { get; set; }
    public required string ItemName { get; set; }
    public bool IsCritical { get; set; }
    public bool IsChecked { get; set; }
    public bool IsOneTime { get; set; }
    public DateTime? CheckedAt { get; set; }
    public int SortOrder { get; set; }
}
