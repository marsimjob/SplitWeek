namespace SplitWeek.Server.DTOs.Children;

public class CreateChildRequest
{
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? DateOfBirth { get; set; }
    public string? Allergies { get; set; }
    public string? MedicalNotes { get; set; }
    public string? EmergencyContact1Name { get; set; }
    public string? EmergencyContact1Phone { get; set; }
    public string? EmergencyContact2Name { get; set; }
    public string? EmergencyContact2Phone { get; set; }
}
