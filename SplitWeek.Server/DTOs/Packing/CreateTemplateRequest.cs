namespace SplitWeek.Server.DTOs.Packing;

public class CreateTemplateRequest
{
    public required string Name { get; set; }
    public bool? IsDefault { get; set; }
    public List<CreateTemplateItemRequest> Items { get; set; } = [];
}

public class CreateTemplateItemRequest
{
    public required string ItemName { get; set; }
    public bool IsCritical { get; set; }
    public int SortOrder { get; set; }
}
