namespace SplitWeek.Server.DTOs.Children;

public class CreateMedicationRequest
{
    public required string Name { get; set; }
    public required string Dosage { get; set; }
    public required string Frequency { get; set; }
    public string? Instructions { get; set; }
}
