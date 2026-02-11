using System.ComponentModel.DataAnnotations;

namespace SplitWeek.Server.Models;

public class InviteLink
{
    public int Id { get; set; }

    public int ChildId { get; set; }

    public int InvitedByUserId { get; set; }

    [MaxLength(256)]
    public required string Token { get; set; }

    public DateTime ExpiresAt { get; set; }

    public int? AcceptedByUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Child Child { get; set; } = null!;
    public User InvitedBy { get; set; } = null!;
    public User? AcceptedBy { get; set; }
}
