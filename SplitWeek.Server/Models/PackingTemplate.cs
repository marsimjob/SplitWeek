using System.ComponentModel.DataAnnotations;

namespace SplitWeek.Server.Models;

public class PackingTemplate
{
    public int Id { get; set; }

    public int ChildId { get; set; }

    [MaxLength(200)]
    public required string Name { get; set; }

    public bool IsDefault { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Child Child { get; set; } = null!;
    public ICollection<PackingTemplateItem> Items { get; set; } = new List<PackingTemplateItem>();
}
