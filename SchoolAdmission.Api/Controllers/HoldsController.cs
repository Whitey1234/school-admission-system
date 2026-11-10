
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.Models;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
public class HoldsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public HoldsController(
        AppDbContext context,
        IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    private int HoldDurationSeconds =>
        Math.Max(
            1,
            int.TryParse(
                _configuration["HOLD_DURATION_SECONDS"],
                out var seconds
            ) ? seconds : 600
        );

    private bool TryGetStudentId(
        string? header,
        out string studentId)
    {
        studentId = header ?? string.Empty;
        return Regex.IsMatch(studentId, @"\A[0-9]{17}\z", RegexOptions.CultureInvariant);
    }

    
    private async Task EnsureStudentExists(string studentId)
    {
        var hash = Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(studentId))
        ).ToLowerInvariant();
        var email = $"student-{hash}@students.local";

        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"""
            INSERT INTO "Students" ("Id", "Name", "Email", "Phone")
            VALUES (
                {studentId},
                {"Student"},
                {email},
                {string.Empty}
            )
            ON CONFLICT ("Id") DO NOTHING;
            """
        );
    }


    // POST /classes/{classId}/holds
    [HttpPost("/classes/{classId:guid}/holds")]
    public async Task<IActionResult> CreateHold(
        Guid classId,
        [FromHeader(Name = "X-Student-Id")] string? studentHeader)
    {
        if (!TryGetStudentId(studentHeader, out var studentId))
        {
            return BadRequest(new
            {
                message = "X-Student-Id must contain exactly 17 digits."
            });
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        // Lock the class row to prevent simultaneous overbooking.
        var locked = await _context.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE \"Classes\" SET \"TotalSeats\" = \"TotalSeats\" WHERE \"Id\" = {classId}"
        );

        if (locked == 0)
            return NotFound(new { message = "Class not found." });

        var now = DateTime.UtcNow;

        // Expire old holds before checking available seats.
        await _context.Holds
            .Where(h =>
                h.ClassId == classId &&
                h.Status == HoldStatus.HELD &&
                h.ExpiresAt <= now)
            .ExecuteUpdateAsync(setters =>
                setters.SetProperty(
                    h => h.Status,
                    HoldStatus.EXPIRED
                ));

        // One active or confirmed hold per student per class.
        var existing = await _context.Holds.AnyAsync(h =>
            h.ClassId == classId &&
            h.StudentId == studentId &&
            (
                h.Status == HoldStatus.CONFIRMED ||
                (h.Status == HoldStatus.HELD &&
                 h.ExpiresAt > now)
            ));

        if (existing)
        {
            return Conflict(new
            {
                message = "You already have an active hold or confirmed admission for this class."
            });
        }

        var schoolClass = await _context.Classes
            .FirstAsync(c => c.Id == classId);

        var occupiedSeats = await _context.Holds.CountAsync(h =>
            h.ClassId == classId &&
            (
                h.Status == HoldStatus.CONFIRMED ||
                (h.Status == HoldStatus.HELD &&
                 h.ExpiresAt > now)
            ));

        if (occupiedSeats >= schoolClass.TotalSeats)
        {
            return Conflict(new
            {
                message = "No available seats in this class."
            });
        }

        await EnsureStudentExists(studentId);

        var hold = new SeatHold
        {
            StudentId = studentId,
            ClassId = classId,
            Status = HoldStatus.HELD,
            CreatedAt = now,
            ExpiresAt = now.AddSeconds(HoldDurationSeconds)
        };

        _context.Holds.Add(hold);
        await _context.SaveChangesAsync();

        await transaction.CommitAsync();

        return CreatedAtAction(
            nameof(GetHold),
            new { holdId = hold.Id },
            new
            {
                holdId = hold.Id,
                classId = hold.ClassId,
                status = hold.Status.ToString(),
                expiresAt = hold.ExpiresAt
            }
        );
    }

    // GET /holds/{holdId}
    [HttpGet("/holds/{holdId:guid}")]
    public async Task<IActionResult> GetHold(Guid holdId)
    {
        var hold = await _context.Holds
            .Include(h => h.SchoolClass)
            .FirstOrDefaultAsync(h => h.Id == holdId);

        if (hold == null)
            return NotFound(new { message = "Hold not found." });

        if (hold.Status == HoldStatus.HELD &&
            hold.ExpiresAt <= DateTime.UtcNow)
        {
            hold.Status = HoldStatus.EXPIRED;
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            holdId = hold.Id,
            classId = hold.ClassId,
            className = hold.SchoolClass.Name,
            status = hold.Status.ToString(),
            createdAt = hold.CreatedAt,
            expiresAt = hold.ExpiresAt
        });
    }

    // POST /holds/{holdId}/confirm
    [HttpPost("/holds/{holdId:guid}/confirm")]
    public async Task<IActionResult> ConfirmHold(
        Guid holdId,
        [FromHeader(Name = "X-Student-Id")] string? studentHeader)
    {
        if (!TryGetStudentId(studentHeader, out var studentId))
        {
            return BadRequest(new
            {
                message = "X-Student-Id must contain exactly 17 digits."
            });
        }

        var existingHold = await _context.Holds
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == holdId);

        if (existingHold == null)
            return NotFound(new { message = "Hold not found." });

        if (existingHold.StudentId != studentId)
            return Forbid();

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE \"Classes\" SET \"TotalSeats\" = \"TotalSeats\" WHERE \"Id\" = {existingHold.ClassId}"
        );

        var hold = await _context.Holds
            .FirstAsync(h => h.Id == holdId);

        if (hold.Status == HoldStatus.CONFIRMED)
        {
            await transaction.CommitAsync();

            return Ok(new
            {
                message = "Admission already confirmed.",
                holdId = hold.Id,
                status = hold.Status.ToString()
            });
        }

        if (hold.Status != HoldStatus.HELD)
        {
            return Conflict(new
            {
                message = "This hold cannot be confirmed."
            });
        }

        if (hold.ExpiresAt <= DateTime.UtcNow)
        {
            hold.Status = HoldStatus.EXPIRED;
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Conflict(new
            {
                message = "This hold has expired."
            });
        }

        hold.Status = HoldStatus.CONFIRMED;

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new
        {
            message = "Admission confirmed successfully.",
            holdId = hold.Id,
            status = hold.Status.ToString()
        });
    }

    // DELETE /holds/{holdId}
    [HttpDelete("/holds/{holdId:guid}")]
    public async Task<IActionResult> CancelHold(
        Guid holdId,
        [FromHeader(Name = "X-Student-Id")] string? studentHeader)
    {
        if (!TryGetStudentId(studentHeader, out var studentId))
        {
            return BadRequest(new
            {
                message = "X-Student-Id must contain exactly 17 digits."
            });
        }

        var existingHold = await _context.Holds
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == holdId);

        if (existingHold == null)
            return NotFound(new { message = "Hold not found." });

        if (existingHold.StudentId != studentId)
            return Forbid();

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE \"Classes\" SET \"TotalSeats\" = \"TotalSeats\" WHERE \"Id\" = {existingHold.ClassId}"
        );

        var hold = await _context.Holds
            .FirstAsync(h => h.Id == holdId);

        if (hold.Status == HoldStatus.CONFIRMED)
        {
            return Conflict(new
            {
                message = "Confirmed admission cannot be cancelled through this endpoint."
            });
        }

        if (hold.Status == HoldStatus.HELD)
        {
            hold.Status = hold.ExpiresAt <= DateTime.UtcNow
                ? HoldStatus.EXPIRED
                : HoldStatus.CANCELLED;

            await _context.SaveChangesAsync();
        }

        await transaction.CommitAsync();

        return NoContent();
    }

    // GET /me/holds
    [HttpGet("/me/holds")]
    public async Task<IActionResult> GetMyHolds(
        [FromHeader(Name = "X-Student-Id")] string? studentHeader)
    {
        if (!TryGetStudentId(studentHeader, out var studentId))
        {
            return BadRequest(new
            {
                message = "X-Student-Id must contain exactly 17 digits."
            });
        }

        var now = DateTime.UtcNow;

        await _context.Holds
            .Where(h =>
                h.StudentId == studentId &&
                h.Status == HoldStatus.HELD &&
                h.ExpiresAt <= now)
            .ExecuteUpdateAsync(setters =>
                setters.SetProperty(
                    h => h.Status,
                    HoldStatus.EXPIRED
                ));

        var holds = await _context.Holds
            .Where(h => h.StudentId == studentId)
            .OrderByDescending(h => h.CreatedAt)
            .Select(h => new
            {
                holdId = h.Id,
                classId = h.ClassId,
                className = h.SchoolClass.Name,
                status = h.Status.ToString(),
                createdAt = h.CreatedAt,
                expiresAt = h.ExpiresAt
            })
            .ToListAsync();

        return Ok(holds);
    }
}
