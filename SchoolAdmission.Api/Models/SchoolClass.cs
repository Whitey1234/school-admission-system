namespace SchoolAdmission.Api.Models;

public class SchoolClass
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public int TotalSeats { get; set; }
}