
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.Models;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("classes")]
public class ClassesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ClassesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreateClass(
        [FromBody] CreateClassRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                message = "Class name cannot be empty."
            });
        }

        var schoolClass = new SchoolClass
        {
            Name = request.Name.Trim(),
            TotalSeats = request.TotalSeats
        };

        _context.Classes.Add(schoolClass);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetClassById),
            new { classId = schoolClass.Id },
            new
            {
                id = schoolClass.Id,
                name = schoolClass.Name,
                totalSeats = schoolClass.TotalSeats,
                heldSeats = 0,
                confirmedSeats = 0,
                availableSeats = schoolClass.TotalSeats
            }
        );
    }

    [HttpGet]
    public async Task<IActionResult> GetClasses()
    {
        var now = DateTime.UtcNow;

        var classes = await _context.Classes
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                id = c.Id,
                name = c.Name,
                totalSeats = c.TotalSeats,

                heldSeats = c.Holds.Count(h =>
                    h.Status == HoldStatus.HELD &&
                    h.ExpiresAt > now),

                confirmedSeats = c.Holds.Count(h =>
                    h.Status == HoldStatus.CONFIRMED),

                availableSeats = c.TotalSeats -
                    c.Holds.Count(h =>
                        h.Status == HoldStatus.CONFIRMED ||
                        (h.Status == HoldStatus.HELD &&
                         h.ExpiresAt > now))
            })
            .ToListAsync();

        return Ok(classes);
    }

    [HttpGet("{classId:guid}")]
    public async Task<IActionResult> GetClassById(Guid classId)
    {
        var now = DateTime.UtcNow;

        var schoolClass = await _context.Classes
            .AsNoTracking()
            .Where(c => c.Id == classId)
            .Select(c => new
            {
                id = c.Id,
                name = c.Name,
                totalSeats = c.TotalSeats,

                heldSeats = c.Holds.Count(h =>
                    h.Status == HoldStatus.HELD &&
                    h.ExpiresAt > now),

                confirmedSeats = c.Holds.Count(h =>
                    h.Status == HoldStatus.CONFIRMED),

                availableSeats = c.TotalSeats -
                    c.Holds.Count(h =>
                        h.Status == HoldStatus.CONFIRMED ||
                        (h.Status == HoldStatus.HELD &&
                         h.ExpiresAt > now))
            })
            .FirstOrDefaultAsync();

        if (schoolClass == null)
        {
            return NotFound(new
            {
                message = "Class not found."
            });
        }

        return Ok(schoolClass);
    }
}

public class CreateClassRequest
{
    [Required]
    [StringLength(150, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int TotalSeats { get; set; }
}
