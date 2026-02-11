using System.ComponentModel.DataAnnotations;

namespace SplitWeek.Server.Models;

public class Reminder
{
    public int Id { get; set; }

    public int ChildId { get; set; }

    public int UserId { get; set; }

    public int? ScheduleId { get; set; }

    [MaxLength(50)]
    public required string Type { get; set; }

    [MaxLength(500)]
    public required string Message { get; set; }

    public DateTime TriggerAt { get; set; }

    public int? IntervalMinutes { get; set; }

    public bool IsDismissed { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Child Child { get; set; } = null!;
    public User User { get; set; } = null!;
    public CustodySchedule? Schedule { get; set; }
}
