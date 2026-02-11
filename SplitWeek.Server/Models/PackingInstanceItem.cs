using System.ComponentModel.DataAnnotations;

namespace SplitWeek.Server.Models;

public class PackingInstanceItem
{
    public int Id { get; set; }

    public int InstanceId { get; set; }

    [MaxLength(200)]
    public required string ItemName { get; set; }

    public bool IsCritical { get; set; } = false;

    public bool IsChecked { get; set; } = false;

    public bool IsOneTime { get; set; } = false;

    public DateTime? CheckedAt { get; set; }

    public int SortOrder { get; set; } = 0;

    // Navigation properties
    public PackingInstance Instance { get; set; } = null!;
}
