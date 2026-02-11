using Microsoft.EntityFrameworkCore;
using SplitWeek.Server.Models;

namespace SplitWeek.Server.Data;

public class SplitWeekDbContext : DbContext
{
    public SplitWeekDbContext(DbContextOptions<SplitWeekDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Child> Children => Set<Child>();
    public DbSet<ParentChild> ParentChildren => Set<ParentChild>();
    public DbSet<InviteLink> InviteLinks => Set<InviteLink>();
    public DbSet<CustodySchedule> CustodySchedules => Set<CustodySchedule>();
    public DbSet<Reminder> Reminders => Set<Reminder>();
    public DbSet<PackingTemplate> PackingTemplates => Set<PackingTemplate>();
    public DbSet<PackingTemplateItem> PackingTemplateItems => Set<PackingTemplateItem>();
    public DbSet<PackingInstance> PackingInstances => Set<PackingInstance>();
    public DbSet<PackingInstanceItem> PackingInstanceItems => Set<PackingInstanceItem>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<ScheduleChangeRequest> ScheduleChangeRequests => Set<ScheduleChangeRequest>();
    public DbSet<DailyRoutine> DailyRoutines => Set<DailyRoutine>();
    public DbSet<Medication> Medications => Set<Medication>();
    public DbSet<MedicationLog> MedicationLogs => Set<MedicationLog>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<ChangeNotification> ChangeNotifications => Set<ChangeNotification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
        });

        // ParentChild
        modelBuilder.Entity<ParentChild>(e =>
        {
            e.HasIndex(pc => new { pc.UserId, pc.ChildId }).IsUnique();
            e.HasOne(pc => pc.User).WithMany(u => u.ParentChildren).HasForeignKey(pc => pc.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(pc => pc.Child).WithMany(c => c.ParentChildren).HasForeignKey(pc => pc.ChildId).OnDelete(DeleteBehavior.Cascade);
        });

        // InviteLink
        modelBuilder.Entity<InviteLink>(e =>
        {
            e.HasIndex(il => il.Token).IsUnique();
            e.HasOne(il => il.InvitedBy).WithMany().HasForeignKey(il => il.InvitedByUserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(il => il.AcceptedBy).WithMany().HasForeignKey(il => il.AcceptedByUserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(il => il.Child).WithMany().HasForeignKey(il => il.ChildId).OnDelete(DeleteBehavior.Cascade);
        });

        // CustodySchedule
        modelBuilder.Entity<CustodySchedule>(e =>
        {
            e.HasIndex(cs => new { cs.ChildId, cs.Date }).IsUnique();
            e.HasOne(cs => cs.Child).WithMany().HasForeignKey(cs => cs.ChildId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(cs => cs.AssignedParent).WithMany().HasForeignKey(cs => cs.AssignedParentId).OnDelete(DeleteBehavior.Restrict);
        });

        // Reminder
        modelBuilder.Entity<Reminder>(e =>
        {
            e.HasOne(r => r.Child).WithMany().HasForeignKey(r => r.ChildId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.Schedule).WithMany().HasForeignKey(r => r.ScheduleId).OnDelete(DeleteBehavior.SetNull);
        });

        // PackingTemplate
        modelBuilder.Entity<PackingTemplate>(e =>
        {
            e.HasOne(pt => pt.Child).WithMany().HasForeignKey(pt => pt.ChildId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PackingTemplateItem>(e =>
        {
            e.HasOne(pti => pti.Template).WithMany(pt => pt.Items).HasForeignKey(pti => pti.TemplateId).OnDelete(DeleteBehavior.Cascade);
        });

        // PackingInstance
        modelBuilder.Entity<PackingInstance>(e =>
        {
            e.HasOne(pi => pi.Child).WithMany().HasForeignKey(pi => pi.ChildId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(pi => pi.Schedule).WithMany().HasForeignKey(pi => pi.ScheduleId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(pi => pi.Template).WithMany().HasForeignKey(pi => pi.TemplateId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(pi => pi.PackedBy).WithMany().HasForeignKey(pi => pi.PackedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PackingInstanceItem>(e =>
        {
            e.HasOne(pii => pii.Instance).WithMany(pi => pi.Items).HasForeignKey(pii => pii.InstanceId).OnDelete(DeleteBehavior.Cascade);
        });

        // Message
        modelBuilder.Entity<Message>(e =>
        {
            e.HasOne(m => m.Child).WithMany().HasForeignKey(m => m.ChildId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(m => m.Sender).WithMany(u => u.SentMessages).HasForeignKey(m => m.SenderId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(m => m.Recipient).WithMany(u => u.ReceivedMessages).HasForeignKey(m => m.RecipientId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(m => m.RelatedSchedule).WithMany().HasForeignKey(m => m.RelatedScheduleId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(m => m.RelatedRequest).WithMany().HasForeignKey(m => m.RelatedRequestId).OnDelete(DeleteBehavior.SetNull);
        });

        // ScheduleChangeRequest
        modelBuilder.Entity<ScheduleChangeRequest>(e =>
        {
            e.HasOne(scr => scr.Child).WithMany().HasForeignKey(scr => scr.ChildId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(scr => scr.RequestedBy).WithMany().HasForeignKey(scr => scr.RequestedByUserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(scr => scr.ParentRequest).WithMany().HasForeignKey(scr => scr.ParentRequestId).OnDelete(DeleteBehavior.Restrict);
        });

        // DailyRoutine
        modelBuilder.Entity<DailyRoutine>(e =>
        {
            e.HasOne(dr => dr.Child).WithMany().HasForeignKey(dr => dr.ChildId).OnDelete(DeleteBehavior.Cascade);
        });

        // Medication
        modelBuilder.Entity<Medication>(e =>
        {
            e.HasOne(med => med.Child).WithMany().HasForeignKey(med => med.ChildId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MedicationLog>(e =>
        {
            e.HasOne(ml => ml.Medication).WithMany(m => m.Logs).HasForeignKey(ml => ml.MedicationId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(ml => ml.AdministeredBy).WithMany().HasForeignKey(ml => ml.AdministeredByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        // Activity
        modelBuilder.Entity<Activity>(e =>
        {
            e.HasOne(a => a.Child).WithMany().HasForeignKey(a => a.ChildId).OnDelete(DeleteBehavior.Cascade);
        });

        // ChangeNotification
        modelBuilder.Entity<ChangeNotification>(e =>
        {
            e.HasOne(cn => cn.User).WithMany().HasForeignKey(cn => cn.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(cn => cn.Child).WithMany().HasForeignKey(cn => cn.ChildId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
