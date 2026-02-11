using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SplitWeek.Server.Data;
using SplitWeek.Server.DTOs.Packing;
using SplitWeek.Server.Models;
using SplitWeek.Server.Services;

namespace SplitWeek.Server.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class PackingController : ControllerBase
{
    private readonly SplitWeekDbContext _db;
    private readonly NotificationService _notifications;

    public PackingController(SplitWeekDbContext db, NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> HasAccess(int childId)
    {
        return await _db.ParentChildren.AnyAsync(pc => pc.ChildId == childId && pc.UserId == CurrentUserId);
    }

    // ==================== TEMPLATES ====================

    [HttpGet("children/{childId}/packing/templates")]
    public async Task<IActionResult> GetTemplates(int childId)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var templates = await _db.PackingTemplates
            .Where(pt => pt.ChildId == childId)
            .Include(pt => pt.Items)
            .OrderBy(pt => pt.Name)
            .Select(pt => new PackingTemplateDto
            {
                Id = pt.Id,
                ChildId = pt.ChildId,
                Name = pt.Name,
                IsDefault = pt.IsDefault,
                Items = pt.Items.OrderBy(i => i.SortOrder).Select(i => new PackingTemplateItemDto
                {
                    Id = i.Id,
                    ItemName = i.ItemName,
                    IsCritical = i.IsCritical,
                    SortOrder = i.SortOrder
                }).ToList()
            })
            .ToListAsync();

        return Ok(templates);
    }

    [HttpPost("children/{childId}/packing/templates")]
    public async Task<IActionResult> CreateTemplate(int childId, [FromBody] CreateTemplateRequest request)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var template = new PackingTemplate
        {
            ChildId = childId,
            Name = request.Name,
            IsDefault = request.IsDefault ?? false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.PackingTemplates.Add(template);
        await _db.SaveChangesAsync();

        foreach (var item in request.Items)
        {
            _db.PackingTemplateItems.Add(new PackingTemplateItem
            {
                TemplateId = template.Id,
                ItemName = item.ItemName,
                IsCritical = item.IsCritical,
                SortOrder = item.SortOrder
            });
        }

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTemplates), new { childId }, new { id = template.Id });
    }

    [HttpPut("packing/templates/{templateId}")]
    public async Task<IActionResult> UpdateTemplate(int templateId, [FromBody] CreateTemplateRequest request)
    {
        var template = await _db.PackingTemplates
            .Include(pt => pt.Items)
            .FirstOrDefaultAsync(pt => pt.Id == templateId);

        if (template == null)
            return NotFound(new { message = "Template not found." });

        if (!await HasAccess(template.ChildId))
            return NotFound(new { message = "Access denied." });

        template.Name = request.Name;
        template.IsDefault = request.IsDefault ?? template.IsDefault;
        template.UpdatedAt = DateTime.UtcNow;

        // Replace items
        _db.PackingTemplateItems.RemoveRange(template.Items);

        foreach (var item in request.Items)
        {
            _db.PackingTemplateItems.Add(new PackingTemplateItem
            {
                TemplateId = template.Id,
                ItemName = item.ItemName,
                IsCritical = item.IsCritical,
                SortOrder = item.SortOrder
            });
        }

        await _db.SaveChangesAsync();
        return Ok(new { id = template.Id });
    }

    [HttpDelete("packing/templates/{templateId}")]
    public async Task<IActionResult> DeleteTemplate(int templateId)
    {
        var template = await _db.PackingTemplates.FindAsync(templateId);
        if (template == null)
            return NotFound(new { message = "Template not found." });

        if (!await HasAccess(template.ChildId))
            return NotFound(new { message = "Access denied." });

        _db.PackingTemplates.Remove(template);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // ==================== INSTANCES ====================

    [HttpGet("children/{childId}/packing/instances")]
    public async Task<IActionResult> GetInstances(int childId, [FromQuery] int? scheduleId)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var query = _db.PackingInstances
            .Where(pi => pi.ChildId == childId)
            .Include(pi => pi.Items)
            .Include(pi => pi.Template)
            .Include(pi => pi.PackedBy)
            .AsQueryable();

        if (scheduleId.HasValue)
        {
            query = query.Where(pi => pi.ScheduleId == scheduleId.Value);
        }

        var instances = await query
            .OrderByDescending(pi => pi.CreatedAt)
            .Select(pi => new PackingInstanceDto
            {
                Id = pi.Id,
                ChildId = pi.ChildId,
                ScheduleId = pi.ScheduleId,
                TemplateName = pi.Template != null ? pi.Template.Name : null,
                PackedByName = pi.PackedBy.FirstName + " " + pi.PackedBy.LastName,
                Status = pi.Status,
                ReadyAt = pi.ReadyAt,
                ConfirmedAt = pi.ConfirmedAt,
                Items = pi.Items.OrderBy(i => i.SortOrder).Select(i => new PackingInstanceItemDto
                {
                    Id = i.Id,
                    ItemName = i.ItemName,
                    IsCritical = i.IsCritical,
                    IsChecked = i.IsChecked,
                    IsOneTime = i.IsOneTime,
                    CheckedAt = i.CheckedAt,
                    SortOrder = i.SortOrder
                }).ToList(),
                CheckedCount = pi.Items.Count(i => i.IsChecked),
                TotalCount = pi.Items.Count
            })
            .ToListAsync();

        return Ok(instances);
    }

    [HttpPost("children/{childId}/packing/instances")]
    public async Task<IActionResult> CreateInstance(int childId, [FromBody] CreateInstanceRequest request)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var instance = new PackingInstance
        {
            ChildId = childId,
            ScheduleId = request.ScheduleId,
            TemplateId = request.TemplateId,
            PackedByUserId = CurrentUserId,
            Status = "InProgress",
            CreatedAt = DateTime.UtcNow
        };

        _db.PackingInstances.Add(instance);
        await _db.SaveChangesAsync();

        // Copy items from template if provided
        if (request.TemplateId.HasValue)
        {
            var templateItems = await _db.PackingTemplateItems
                .Where(pti => pti.TemplateId == request.TemplateId.Value)
                .OrderBy(pti => pti.SortOrder)
                .ToListAsync();

            foreach (var ti in templateItems)
            {
                _db.PackingInstanceItems.Add(new PackingInstanceItem
                {
                    InstanceId = instance.Id,
                    ItemName = ti.ItemName,
                    IsCritical = ti.IsCritical,
                    IsChecked = false,
                    IsOneTime = false,
                    SortOrder = ti.SortOrder
                });
            }

            await _db.SaveChangesAsync();
        }

        return CreatedAtAction(nameof(GetInstances), new { childId }, new { id = instance.Id });
    }

    [HttpPost("packing/instances/{instanceId}/items")]
    public async Task<IActionResult> AddOneTimeItem(int instanceId, [FromBody] AddOneTimeItemRequest request)
    {
        var instance = await _db.PackingInstances.FindAsync(instanceId);
        if (instance == null)
            return NotFound(new { message = "Instance not found." });

        if (!await HasAccess(instance.ChildId))
            return NotFound(new { message = "Access denied." });

        var maxSort = await _db.PackingInstanceItems
            .Where(pii => pii.InstanceId == instanceId)
            .MaxAsync(pii => (int?)pii.SortOrder) ?? 0;

        var item = new PackingInstanceItem
        {
            InstanceId = instanceId,
            ItemName = request.ItemName,
            IsCritical = request.IsCritical,
            IsChecked = false,
            IsOneTime = true,
            SortOrder = maxSort + 1
        };

        _db.PackingInstanceItems.Add(item);
        await _db.SaveChangesAsync();

        return Ok(new { id = item.Id });
    }

    [HttpPut("packing/instances/{instanceId}/items/{itemId}/check")]
    public async Task<IActionResult> CheckItem(int instanceId, int itemId, [FromBody] CheckItemRequest request)
    {
        var item = await _db.PackingInstanceItems
            .FirstOrDefaultAsync(pii => pii.Id == itemId && pii.InstanceId == instanceId);

        if (item == null)
            return NotFound(new { message = "Item not found." });

        var instance = await _db.PackingInstances.FindAsync(instanceId);
        if (instance == null || !await HasAccess(instance.ChildId))
            return NotFound(new { message = "Access denied." });

        item.IsChecked = request.IsChecked;
        item.CheckedAt = request.IsChecked ? DateTime.UtcNow : null;

        await _db.SaveChangesAsync();

        return Ok(new { id = item.Id, isChecked = item.IsChecked, checkedAt = item.CheckedAt });
    }

    [HttpPost("packing/instances/{instanceId}/ready")]
    public async Task<IActionResult> MarkReady(int instanceId)
    {
        var instance = await _db.PackingInstances.FindAsync(instanceId);
        if (instance == null)
            return NotFound(new { message = "Instance not found." });

        if (!await HasAccess(instance.ChildId))
            return NotFound(new { message = "Access denied." });

        instance.Status = "Ready";
        instance.ReadyAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _notifications.NotifyOtherParent(
            CurrentUserId, instance.ChildId, "Packing",
            "Packing list marked as ready",
            "A packing list has been completed and marked as ready.",
            "PackingInstance", instance.Id);

        return Ok(new { id = instance.Id, status = instance.Status, readyAt = instance.ReadyAt });
    }

    // ==================== HISTORY ====================

    [HttpGet("children/{childId}/packing/history")]
    public async Task<IActionResult> GetHistory(int childId)
    {
        if (!await HasAccess(childId))
            return NotFound(new { message = "Child not found or access denied." });

        var history = await _db.PackingInstances
            .Where(pi => pi.ChildId == childId && (pi.Status == "Ready" || pi.Status == "Confirmed"))
            .Include(pi => pi.Items)
            .Include(pi => pi.Template)
            .Include(pi => pi.PackedBy)
            .OrderByDescending(pi => pi.ReadyAt)
            .Select(pi => new PackingInstanceDto
            {
                Id = pi.Id,
                ChildId = pi.ChildId,
                ScheduleId = pi.ScheduleId,
                TemplateName = pi.Template != null ? pi.Template.Name : null,
                PackedByName = pi.PackedBy.FirstName + " " + pi.PackedBy.LastName,
                Status = pi.Status,
                ReadyAt = pi.ReadyAt,
                ConfirmedAt = pi.ConfirmedAt,
                Items = pi.Items.OrderBy(i => i.SortOrder).Select(i => new PackingInstanceItemDto
                {
                    Id = i.Id,
                    ItemName = i.ItemName,
                    IsCritical = i.IsCritical,
                    IsChecked = i.IsChecked,
                    IsOneTime = i.IsOneTime,
                    CheckedAt = i.CheckedAt,
                    SortOrder = i.SortOrder
                }).ToList(),
                CheckedCount = pi.Items.Count(i => i.IsChecked),
                TotalCount = pi.Items.Count
            })
            .ToListAsync();

        return Ok(history);
    }
}

public class CreateInstanceRequest
{
    public int ScheduleId { get; set; }
    public int? TemplateId { get; set; }
}

public class AddOneTimeItemRequest
{
    public required string ItemName { get; set; }
    public bool IsCritical { get; set; }
}
