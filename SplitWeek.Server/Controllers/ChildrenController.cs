using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SplitWeek.Server.Data;
using SplitWeek.Server.DTOs.Children;
using SplitWeek.Server.Models;

namespace SplitWeek.Server.Controllers;

[ApiController]
[Route("api/children")]
[Authorize]
public class ChildrenController : ControllerBase
{
    private readonly SplitWeekDbContext _db;

    public ChildrenController(SplitWeekDbContext db)
    {
        _db = db;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetChildren()
    {
        var children = await _db.ParentChildren
            .Where(pc => pc.UserId == CurrentUserId)
            .Include(pc => pc.Child)
            .Select(pc => new
            {
                id = pc.Child.Id,
                firstName = pc.Child.FirstName,
                lastName = pc.Child.LastName,
                dateOfBirth = pc.Child.DateOfBirth,
                photoUrl = pc.Child.PhotoUrl,
                myRole = pc.Role,
                colorHex = pc.ColorHex
            })
            .ToListAsync();

        return Ok(children);
    }

    [HttpGet("{childId}")]
    public async Task<IActionResult> GetChild(int childId)
    {
        var pc = await _db.ParentChildren
            .Where(pc => pc.ChildId == childId && pc.UserId == CurrentUserId)
            .Include(pc => pc.Child)
                .ThenInclude(c => c.ParentChildren)
                    .ThenInclude(pc2 => pc2.User)
            .FirstOrDefaultAsync();

        if (pc == null)
            return NotFound(new { message = "Child not found or access denied." });

        var child = pc.Child;
        var parentA = child.ParentChildren.FirstOrDefault(p => p.Role == "ParentA");
        var parentB = child.ParentChildren.FirstOrDefault(p => p.Role == "ParentB");

        return Ok(new ChildProfileDto
        {
            Id = child.Id,
            FirstName = child.FirstName,
            LastName = child.LastName,
            DateOfBirth = child.DateOfBirth,
            PhotoUrl = child.PhotoUrl,
            Allergies = child.Allergies,
            MedicalNotes = child.MedicalNotes,
            EmergencyContact1Name = child.EmergencyContact1Name,
            EmergencyContact1Phone = child.EmergencyContact1Phone,
            EmergencyContact2Name = child.EmergencyContact2Name,
            EmergencyContact2Phone = child.EmergencyContact2Phone,
            ParentAName = parentA != null ? $"{parentA.User.FirstName} {parentA.User.LastName}" : null,
            ParentBName = parentB != null ? $"{parentB.User.FirstName} {parentB.User.LastName}" : null,
            MyRole = pc.Role
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateChild([FromBody] CreateChildRequest request)
    {
        var child = new Child
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            DateOfBirth = request.DateOfBirth,
            Allergies = request.Allergies,
            MedicalNotes = request.MedicalNotes,
            EmergencyContact1Name = request.EmergencyContact1Name,
            EmergencyContact1Phone = request.EmergencyContact1Phone,
            EmergencyContact2Name = request.EmergencyContact2Name,
            EmergencyContact2Phone = request.EmergencyContact2Phone,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Children.Add(child);
        await _db.SaveChangesAsync();

        var parentChild = new ParentChild
        {
            UserId = CurrentUserId,
            ChildId = child.Id,
            Role = "ParentA",
            ColorHex = "#3B82F6"
        };

        _db.ParentChildren.Add(parentChild);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetChild), new { childId = child.Id }, new { id = child.Id });
    }

    [HttpPut("{childId}")]
    public async Task<IActionResult> UpdateChild(int childId, [FromBody] CreateChildRequest request)
    {
        var linked = await _db.ParentChildren.AnyAsync(pc => pc.ChildId == childId && pc.UserId == CurrentUserId);
        if (!linked)
            return NotFound(new { message = "Child not found or access denied." });

        var child = await _db.Children.FindAsync(childId);
        if (child == null)
            return NotFound();

        child.FirstName = request.FirstName;
        child.LastName = request.LastName;
        child.DateOfBirth = request.DateOfBirth;
        child.Allergies = request.Allergies;
        child.MedicalNotes = request.MedicalNotes;
        child.EmergencyContact1Name = request.EmergencyContact1Name;
        child.EmergencyContact1Phone = request.EmergencyContact1Phone;
        child.EmergencyContact2Name = request.EmergencyContact2Name;
        child.EmergencyContact2Phone = request.EmergencyContact2Phone;
        child.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { id = child.Id });
    }

    [HttpGet("{childId}/parents")]
    public async Task<IActionResult> GetParents(int childId)
    {
        var linked = await _db.ParentChildren.AnyAsync(pc => pc.ChildId == childId && pc.UserId == CurrentUserId);
        if (!linked)
            return NotFound(new { message = "Child not found or access denied." });

        var parents = await _db.ParentChildren
            .Where(pc => pc.ChildId == childId)
            .Include(pc => pc.User)
            .Select(pc => new
            {
                id = pc.UserId,
                firstName = pc.User.FirstName,
                lastName = pc.User.LastName,
                role = pc.Role,
                colorHex = pc.ColorHex
            })
            .ToListAsync();

        return Ok(parents);
    }

    [HttpPost("{childId}/invite")]
    public async Task<IActionResult> GenerateInvite(int childId)
    {
        var linked = await _db.ParentChildren.AnyAsync(pc => pc.ChildId == childId && pc.UserId == CurrentUserId);
        if (!linked)
            return NotFound(new { message = "Child not found or access denied." });

        var invite = new InviteLink
        {
            ChildId = childId,
            InvitedByUserId = CurrentUserId,
            Token = Guid.NewGuid().ToString(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        _db.InviteLinks.Add(invite);
        await _db.SaveChangesAsync();

        return Ok(new { token = invite.Token, expiresAt = invite.ExpiresAt });
    }

    [HttpPost("accept-invite")]
    public async Task<IActionResult> AcceptInvite([FromBody] AcceptInviteRequest request)
    {
        var invite = await _db.InviteLinks
            .Include(il => il.Child)
            .FirstOrDefaultAsync(il => il.Token == request.Token);

        if (invite == null)
            return NotFound(new { message = "Invalid invite token." });

        if (invite.ExpiresAt < DateTime.UtcNow)
            return BadRequest(new { message = "Invite link has expired." });

        if (invite.AcceptedByUserId != null)
            return BadRequest(new { message = "Invite link has already been used." });

        var userId = CurrentUserId;

        if (invite.InvitedByUserId == userId)
            return BadRequest(new { message = "You cannot accept your own invite." });

        var alreadyLinked = await _db.ParentChildren.AnyAsync(pc => pc.ChildId == invite.ChildId && pc.UserId == userId);
        if (alreadyLinked)
            return BadRequest(new { message = "You are already linked to this child." });

        invite.AcceptedByUserId = userId;

        var parentChild = new ParentChild
        {
            UserId = userId,
            ChildId = invite.ChildId,
            Role = "ParentB",
            ColorHex = "#8B5CF6"
        };

        _db.ParentChildren.Add(parentChild);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            childId = invite.ChildId,
            childName = $"{invite.Child.FirstName} {invite.Child.LastName}",
            role = "ParentB"
        });
    }
}

public class AcceptInviteRequest
{
    public required string Token { get; set; }
}
