namespace SplitWeek.Server.Models;

public class MedicationLog
{
    public int Id { get; set; }

    public int MedicationId { get; set; }

    public int AdministeredByUserId { get; set; }

    public DateTime AdministeredAt { get; set; }

    public string? Notes { get; set; }

    public bool WasMissed { get; set; } = false;

    // Navigation properties
    public Medication Medication { get; set; } = null!;
    public User AdministeredBy { get; set; } = null!;
}
