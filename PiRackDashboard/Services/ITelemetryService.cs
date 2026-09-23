using PiRackDashboard.Models;

namespace PiRackDashboard.Services;

public interface ITelemetryService
{
    Task<RackTelemetry?> GetLatestAsync(CancellationToken ct);
    Task<List<RackTelemetry>> GetHistoryAsync(int hours, CancellationToken ct);
}
