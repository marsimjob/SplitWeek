using System.ComponentModel.DataAnnotations;

namespace SplitWeek.Server.Models;

public class CustodySchedule
{
    public int Id { get; set; }

    public int ChildId { get; set; }

    [MaxLength(10)]
    public required string Date { get; set; } // YYYY-MM-DD

    public int AssignedParentId { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    [MaxLength(10)]
    public string? HandoffTime { get; set; }

    [MaxLength(256)]
    public string? HandoffLocation { get; set; }

    public DateTime? HandoffConfirmedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Child Child { get; set; } = null!;
    public User AssignedParent { get; set; } = null!;
}
