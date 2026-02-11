using System.ComponentModel.DataAnnotations;

namespace SplitWeek.Server.Models;

public class Message
{
    public int Id { get; set; }

    public int ChildId { get; set; }

    public int SenderId { get; set; }

    public int RecipientId { get; set; }

    [MaxLength(50)]
    public required string Type { get; set; }

    [MaxLength(256)]
    public string? Subject { get; set; }

    [MaxLength(4000)]
    public required string Body { get; set; }

    public int? RelatedScheduleId { get; set; }

    public int? RelatedRequestId { get; set; }

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Child Child { get; set; } = null!;
    public User Sender { get; set; } = null!;
    public User Recipient { get; set; } = null!;
    public CustodySchedule? RelatedSchedule { get; set; }
    public ScheduleChangeRequest? RelatedRequest { get; set; }
}
