namespace SplitWeek.Server.DTOs.Notifications;

public class ReminderDto
{
    public int Id { get; set; }
    public int ChildId { get; set; }
    public int UserId { get; set; }
    public int? ScheduleId { get; set; }
    public required string Type { get; set; }
    public required string Message { get; set; }
    public DateTime TriggerAt { get; set; }
    public int? IntervalMinutes { get; set; }
    public bool IsDismissed { get; set; }
    public DateTime CreatedAt { get; set; }
}
