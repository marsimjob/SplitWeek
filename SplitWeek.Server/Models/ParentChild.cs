using System.ComponentModel.DataAnnotations;

namespace SplitWeek.Server.Models;

public class ParentChild
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int ChildId { get; set; }

    [MaxLength(10)]
    public required string Role { get; set; } // "ParentA" or "ParentB"

    [MaxLength(7)]
    public string? ColorHex { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public Child Child { get; set; } = null!;
}
