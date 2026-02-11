namespace SplitWeek.Server.DTOs.Packing;

public class PackingTemplateItemDto
{
    public int Id { get; set; }
    public required string ItemName { get; set; }
    public bool IsCritical { get; set; }
    public int SortOrder { get; set; }
}
