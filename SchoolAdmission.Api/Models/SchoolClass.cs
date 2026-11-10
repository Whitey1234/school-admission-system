namespace SchoolAdmission.Api.Models;

public class SchoolClass
{
    // Unique ID for each class and shift
    public Guid Id { get; set; } = Guid.NewGuid();

    // Example: Class 6 - Morning Shift
    public string Name { get; set; } = string.Empty;

    // Total available seats
    public int TotalSeats { get; set; }

    // All seat holds belonging to this class
    public ICollection<SeatHold> Holds { get; set; }
        = new List<SeatHold>();
}