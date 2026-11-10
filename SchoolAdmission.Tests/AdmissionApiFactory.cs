using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Npgsql;

namespace SchoolAdmission.Tests;

public sealed class AdmissionApiFactory : WebApplicationFactory<Program>
{
    private const string ConnectionStringEnvironmentVariable =
        "ConnectionStrings__DefaultConnection";

    private readonly string _testConnectionString;
    private readonly string? _originalConnectionString;

    public AdmissionApiFactory()
    {
        _testConnectionString =
            Environment.GetEnvironmentVariable("SCHOOL_ADMISSION_TEST_CONNECTION_STRING")
            ?? throw new InvalidOperationException(
                "Set SCHOOL_ADMISSION_TEST_CONNECTION_STRING to a dedicated PostgreSQL database whose name ends with '_test'."
            );

        var connectionString = new NpgsqlConnectionStringBuilder(_testConnectionString);
        var databaseName = connectionString.Database ?? string.Empty;
        if (!databaseName.EndsWith("_test", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Integration tests require a dedicated PostgreSQL database whose name ends with '_test'."
            );
        }

        _originalConnectionString =
            Environment.GetEnvironmentVariable(ConnectionStringEnvironmentVariable);
        Environment.SetEnvironmentVariable(
            ConnectionStringEnvironmentVariable,
            _testConnectionString
        );
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            Environment.SetEnvironmentVariable(
                ConnectionStringEnvironmentVariable,
                _originalConnectionString
            );
        }
    }
}
