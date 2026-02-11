using System.ComponentModel.DataAnnotations;

namespace SplitWeek.Server.Models;

public class ScheduleChangeRequest
{
    public int Id { get; set; }

    public int ChildId { get; set; }

    public int RequestedByUserId { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "Pending";

    [MaxLength(1000)]
    public string? Reason { get; set; }

    public required string OriginalData { get; set; } // JSON

    public required string ProposedData { get; set; } // JSON

    public string? CounterData { get; set; } // JSON

    public int? ParentRequestId { get; set; }

    public DateTime ExpiresAt { get; set; }

    public DateTime? RespondedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Child Child { get; set; } = null!;
    public User RequestedBy { get; set; } = null!;
    public ScheduleChangeRequest? ParentRequest { get; set; }
}
