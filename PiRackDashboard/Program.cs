using Amazon;
using Amazon.DynamoDBv2;
using PiRackDashboard.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddRazorPages();

var useMockTelemetry = builder.Environment.IsDevelopment() &&
    builder.Configuration.GetValue("Telemetry:UseMockData", false);

if (useMockTelemetry)
{
    builder.Services.AddSingleton<ITelemetryService, MockTelemetryService>();
}
else
{
    var region = RegionEndpoint.GetBySystemName(
        builder.Configuration["AWS:Region"] ?? "eu-west-2");

    builder.Services.AddSingleton<IAmazonDynamoDB>(
        _ => new AmazonDynamoDBClient(region));
    builder.Services.AddSingleton<ITelemetryService, TelemetryService>();
}

var app = builder.Build();

if (!app.Environment.IsDevelopment())
    app.UseExceptionHandler("/Error");

app.UseStaticFiles();
app.UseRouting();
app.MapRazorPages();

app.MapGet("/api/telemetry/latest",
    async (ITelemetryService service, CancellationToken ct) =>
        Results.Ok(await service.GetLatestAsync(ct)));

app.MapGet("/api/telemetry/history",
    async (int? hours, ITelemetryService service, CancellationToken ct) =>
        Results.Ok(await service.GetHistoryAsync(
            Math.Clamp(hours ?? 24, 1, 24 * 30), ct)));

app.Run();