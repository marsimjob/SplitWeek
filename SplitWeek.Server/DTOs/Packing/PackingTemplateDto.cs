namespace SplitWeek.Server.DTOs.Packing;

public class PackingTemplateDto
{
    public int Id { get; set; }
    public int ChildId { get; set; }
    public required string Name { get; set; }
    public bool IsDefault { get; set; }
    public List<PackingTemplateItemDto> Items { get; set; } = [];
}
