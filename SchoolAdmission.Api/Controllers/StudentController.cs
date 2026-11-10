using Microsoft.AspNetCore.Mvc;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentController : ControllerBase
{
    // GET: api/student
    [HttpGet]
    public IActionResult GetStudents()
    {
        var students = new[]
        {
            new { id = 1, name = "Rahim", age = 15 },
            new { id = 2, name = "Karim", age = 16 }
        };

        return Ok(students);
    }

    // GET: api/student/1
    [HttpGet("{id}")]
    public IActionResult GetStudentById(int id)
    {
        var student = new
        {
            id = id,
            name = "Rahim",
            age = 15
        };

        return Ok(student);
    }

    // POST: api/student
    [HttpPost]
    public IActionResult CreateStudent()
    {
        return Ok(new
        {
            message = "Student created successfully!"
        });
    }
}