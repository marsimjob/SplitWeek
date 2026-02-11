namespace SplitWeek.Server.DTOs.Children;

public class MedicationLogDto
{
    public int Id { get; set; }
    public int MedicationId { get; set; }
    public string? AdministeredByName { get; set; }
    public DateTime AdministeredAt { get; set; }
    public string? Notes { get; set; }
    public bool WasMissed { get; set; }
}
