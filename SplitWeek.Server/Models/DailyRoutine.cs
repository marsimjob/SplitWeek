using System.ComponentModel.DataAnnotations;

namespace SplitWeek.Server.Models;

public class DailyRoutine
{
    public int Id { get; set; }

    public int ChildId { get; set; }

    [MaxLength(50)]
    public required string RoutineType { get; set; }

    [MaxLength(500)]
    public required string Description { get; set; }

    [MaxLength(10)]
    public string? TimeOfDay { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public int SortOrder { get; set; } = 0;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Child Child { get; set; } = null!;
}
