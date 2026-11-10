using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SchoolAdmission.Api.Data;

namespace SchoolAdmission.Tests;

public sealed class AdmissionHoldIntegrationTests : IClassFixture<AdmissionApiFactory>
{
    private readonly AdmissionApiFactory _factory;

    public AdmissionHoldIntegrationTests(AdmissionApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreatingHoldOccupiesOneAvailableSeat()
    {
        using var client = _factory.CreateClient();
        await using var testClass = await TestClass.CreateAsync(_factory, client, 1);
        const string studentId = "90000000000000001";
        testClass.TrackStudent(studentId);

        using var response = await CreateHoldAsync(client, testClass.Id, studentId);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var body = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        Assert.True(Guid.TryParse(body.RootElement.GetProperty("holdId").GetString(), out _));
        Assert.Equal(testClass.Id, body.RootElement.GetProperty("classId").GetGuid());
        Assert.Equal("HELD", body.RootElement.GetProperty("status").GetString());

        using var classState = await GetClassAsync(client, testClass.Id);
        Assert.Equal(1, classState.RootElement.GetProperty("heldSeats").GetInt32());
        Assert.Equal(0, classState.RootElement.GetProperty("availableSeats").GetInt32());
    }

    [Fact]
    public async Task CreatingHoldWhenClassIsFullReturnsConflictWithoutOverselling()
    {
        using var client = _factory.CreateClient();
        await using var testClass = await TestClass.CreateAsync(_factory, client, 1);
        const string firstStudentId = "90000000000000002";
        const string secondStudentId = "90000000000000003";
        testClass.TrackStudent(firstStudentId);
        testClass.TrackStudent(secondStudentId);

        using var firstResponse = await CreateHoldAsync(client, testClass.Id, firstStudentId);
        using var secondResponse = await CreateHoldAsync(client, testClass.Id, secondStudentId);

        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, secondResponse.StatusCode);

        using var classState = await GetClassAsync(client, testClass.Id);
        Assert.Equal(1, classState.RootElement.GetProperty("heldSeats").GetInt32());
        Assert.Equal(0, classState.RootElement.GetProperty("availableSeats").GetInt32());
    }

    [Fact]
    public async Task ConcurrentHoldRequestsForOneSeatOnlyCreateOneActiveHold()
    {
        using var client = _factory.CreateClient();
        await using var testClass = await TestClass.CreateAsync(_factory, client, 1);
        const string firstStudentId = "90000000000000004";
        const string secondStudentId = "90000000000000005";
        testClass.TrackStudent(firstStudentId);
        testClass.TrackStudent(secondStudentId);

        var responses = await Task.WhenAll(
            CreateHoldAsync(client, testClass.Id, firstStudentId),
            CreateHoldAsync(client, testClass.Id, secondStudentId)
        );

        try
        {
            Assert.Single(responses, response => response.StatusCode == HttpStatusCode.Created);
            Assert.Single(responses, response => response.StatusCode == HttpStatusCode.Conflict);

            using var classState = await GetClassAsync(client, testClass.Id);
            Assert.Equal(1, classState.RootElement.GetProperty("heldSeats").GetInt32());
            Assert.Equal(0, classState.RootElement.GetProperty("availableSeats").GetInt32());

            using var firstHolds = await GetStudentHoldsAsync(client, firstStudentId);
            using var secondHolds = await GetStudentHoldsAsync(client, secondStudentId);
            Assert.Equal(1, firstHolds.RootElement.GetArrayLength() + secondHolds.RootElement.GetArrayLength());
        }
        finally
        {
            foreach (var response in responses)
            {
                response.Dispose();
            }
        }
    }

    private static async Task<HttpResponseMessage> CreateHoldAsync(
        HttpClient client,
        Guid classId,
        string studentId)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"/classes/{classId}/holds"
        )
        {
            Content = new StringContent("{}", Encoding.UTF8, "application/json")
        };
        request.Headers.Add("X-Student-Id", studentId);

        return await client.SendAsync(request);
    }

    private static async Task<JsonDocument> GetClassAsync(HttpClient client, Guid classId)
    {
        using var response = await client.GetAsync($"/classes/{classId}");
        response.EnsureSuccessStatusCode();
        return await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
    }

    private static async Task<JsonDocument> GetStudentHoldsAsync(
        HttpClient client,
        string studentId)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/me/holds");
        request.Headers.Add("X-Student-Id", studentId);
        using var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
    }

    private sealed class TestClass : IAsyncDisposable
    {
        private readonly AdmissionApiFactory _factory;
        private readonly HashSet<string> _studentIds = [];

        private TestClass(AdmissionApiFactory factory, Guid id)
        {
            _factory = factory;
            Id = id;
        }

        public Guid Id { get; }

        public void TrackStudent(string studentId) => _studentIds.Add(studentId);

        public static async Task<TestClass> CreateAsync(
            AdmissionApiFactory factory,
            HttpClient client,
            int totalSeats)
        {
            using var response = await client.PostAsJsonAsync(
                "/classes",
                new
                {
                    name = $"Integration test class {Guid.NewGuid():N}",
                    totalSeats
                }
            );
            response.EnsureSuccessStatusCode();

            using var body = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
            var id = body.RootElement.GetProperty("id").GetGuid();
            return new TestClass(factory, id);
        }

        public async ValueTask DisposeAsync()
        {
            await using var scope = _factory.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            await db.Database.ExecuteSqlInterpolatedAsync(
                $"""DELETE FROM "Classes" WHERE "Id" = {Id}"""
            );

            foreach (var studentId in _studentIds)
            {
                await db.Database.ExecuteSqlInterpolatedAsync(
                    $"""DELETE FROM "Students" WHERE "Id" = {studentId}"""
                );
            }
        }
    }
}
