
using Microsoft.AspNetCore.Mvc;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "Healthy",
            message = "School Admission API is working!"
        });
    }
}
