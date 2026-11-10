using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Models;

namespace SchoolAdmission.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<SchoolClass> Classes => Set<SchoolClass>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<SeatHold> Holds => Set<SeatHold>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // SchoolClass 
        modelBuilder.Entity<SchoolClass>()
            .Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(150);

        modelBuilder.Entity<SchoolClass>()
            .ToTable(t => t.HasCheckConstraint(
                "CK_Classes_TotalSeats",
                "\"TotalSeats\" >= 0"
            ));

        // Student 
        modelBuilder.Entity<Student>()
            .HasKey(s => s.Id);

        modelBuilder.Entity<Student>()
            .Property(s => s.Id)
            .HasMaxLength(36)
            .ValueGeneratedNever();

        modelBuilder.Entity<Student>()
            .HasIndex(s => s.Email)
            .IsUnique();

        // SeatHold -
        modelBuilder.Entity<SeatHold>()
            .HasOne(h => h.Student)
            .WithMany()
            .HasForeignKey(h => h.StudentId);

        modelBuilder.Entity<SeatHold>()
            .Property(h => h.StudentId)
            .HasMaxLength(36);

        // SeatHold - Sip
        modelBuilder.Entity<SeatHold>()
            .HasOne(h => h.SchoolClass)
            .WithMany(c => c.Holds)
            .HasForeignKey(h => h.ClassId);

        // Student and Class index
        modelBuilder.Entity<SeatHold>()
            .HasIndex(h => new { h.StudentId, h.ClassId });
    }
}