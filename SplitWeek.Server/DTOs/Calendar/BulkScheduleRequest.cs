namespace SplitWeek.Server.DTOs.Calendar;

public class BulkScheduleRequest
{
    public required List<ScheduleUpsertRequest> Entries { get; set; }
}
