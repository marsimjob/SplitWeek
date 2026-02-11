using System.ComponentModel.DataAnnotations;

namespace SplitWeek.Server.Models;

public class Activity
{
    public int Id { get; set; }

    public int ChildId { get; set; }

    [MaxLength(200)]
    public required string Name { get; set; }

    public int? DayOfWeek { get; set; }

    [MaxLength(10)]
    public string? StartTime { get; set; }

    [MaxLength(10)]
    public string? EndTime { get; set; }

    [MaxLength(256)]
    public string? Location { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Child Child { get; set; } = null!;
}
