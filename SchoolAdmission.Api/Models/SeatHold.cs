namespace SchoolAdmission.Api.Models;

public class SeatHold
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid StudentId { get; set; }

    public Student Student { get; set; } = null!;

    public Guid ClassId { get; set; }

    public SchoolClass SchoolClass { get; set; } = null!;

    public HoldStatus Status { get; set; } = HoldStatus.HELD;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAt { get; set; }
}