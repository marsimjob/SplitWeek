using System.ComponentModel.DataAnnotations;

namespace SplitWeek.Server.Models;

public class ChangeNotification
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int ChildId { get; set; }

    [MaxLength(50)]
    public required string Category { get; set; }

    [MaxLength(256)]
    public required string Title { get; set; }

    [MaxLength(1000)]
    public string? Body { get; set; }

    [MaxLength(50)]
    public string? RelatedEntityType { get; set; }

    public int? RelatedEntityId { get; set; }

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public Child Child { get; set; } = null!;
}
