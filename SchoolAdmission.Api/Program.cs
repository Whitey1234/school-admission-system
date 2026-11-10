using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Register Controllers
builder.Services.AddControllers();

// its for origin cores 

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://104.207.89.172:5174"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});


// Register PostgreSQL Database
var connectionString =
    builder.Configuration["ConnectionStrings:DefaultConnection"];

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString)
);

var app = builder.Build();


using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();

    await db.Database.MigrateAsync();
}


app.UseCors("FrontendPolicy");

app.MapGet("/", () =>
{
    return "School Admission API is Running!";
});

app.MapControllers();

app.Run();

public partial class Program
{
}