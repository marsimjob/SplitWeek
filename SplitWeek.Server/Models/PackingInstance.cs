using System.ComponentModel.DataAnnotations;

namespace SplitWeek.Server.Models;

public class PackingInstance
{
    public int Id { get; set; }

    public int ChildId { get; set; }

    public int ScheduleId { get; set; }

    public int? TemplateId { get; set; }

    public int PackedByUserId { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "InProgress";

    public DateTime? ReadyAt { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Child Child { get; set; } = null!;
    public CustodySchedule Schedule { get; set; } = null!;
    public PackingTemplate? Template { get; set; }
    public User PackedBy { get; set; } = null!;
    public ICollection<PackingInstanceItem> Items { get; set; } = new List<PackingInstanceItem>();
}
