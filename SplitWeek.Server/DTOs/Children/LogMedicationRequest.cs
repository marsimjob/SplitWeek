namespace SplitWeek.Server.DTOs.Children;

public class LogMedicationRequest
{
    public DateTime AdministeredAt { get; set; }
    public string? Notes { get; set; }
    public bool WasMissed { get; set; } = false;
}
