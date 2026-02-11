using System.ComponentModel.DataAnnotations;

namespace SplitWeek.Server.Models;

public class PackingTemplateItem
{
    public int Id { get; set; }

    public int TemplateId { get; set; }

    [MaxLength(200)]
    public required string ItemName { get; set; }

    public bool IsCritical { get; set; } = false;

    public int SortOrder { get; set; } = 0;

    // Navigation properties
    public PackingTemplate Template { get; set; } = null!;
}
