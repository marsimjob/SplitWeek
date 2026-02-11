using System.ComponentModel.DataAnnotations;

namespace SplitWeek.Server.Models;

public class Medication
{
    public int Id { get; set; }

    public int ChildId { get; set; }

    [MaxLength(200)]
    public required string Name { get; set; }

    [MaxLength(100)]
    public required string Dosage { get; set; }

    [MaxLength(100)]
    public required string Frequency { get; set; }

    [MaxLength(1000)]
    public string? Instructions { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Child Child { get; set; } = null!;
    public ICollection<MedicationLog> Logs { get; set; } = new List<MedicationLog>();
}
