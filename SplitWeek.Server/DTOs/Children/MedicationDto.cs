namespace SplitWeek.Server.DTOs.Children;

public class MedicationDto
{
    public int Id { get; set; }
    public int ChildId { get; set; }
    public required string Name { get; set; }
    public required string Dosage { get; set; }
    public required string Frequency { get; set; }
    public string? Instructions { get; set; }
    public bool IsActive { get; set; }
    public List<MedicationLogDto>? LatestLogs { get; set; }
}
