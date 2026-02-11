using System.ComponentModel.DataAnnotations;

namespace SplitWeek.Server.Models;

public class Child
{
    public int Id { get; set; }

    [MaxLength(100)]
    public required string FirstName { get; set; }

    [MaxLength(100)]
    public required string LastName { get; set; }

    [MaxLength(10)]
    public string? DateOfBirth { get; set; }

    [MaxLength(512)]
    public string? PhotoUrl { get; set; }

    [MaxLength(200)]
    public string? EmergencyContact1Name { get; set; }

    [MaxLength(20)]
    public string? EmergencyContact1Phone { get; set; }

    [MaxLength(200)]
    public string? EmergencyContact2Name { get; set; }

    [MaxLength(20)]
    public string? EmergencyContact2Phone { get; set; }

    [MaxLength(1000)]
    public string? Allergies { get; set; }

    [MaxLength(2000)]
    public string? MedicalNotes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<ParentChild> ParentChildren { get; set; } = new List<ParentChild>();
}
