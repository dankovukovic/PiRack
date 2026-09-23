using PiRackDashboard.Models;

namespace PiRackDashboard.Services;

public sealed class MockTelemetryService : ITelemetryService
{
    public Task<RackTelemetry?> GetLatestAsync(CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        return Task.FromResult<RackTelemetry?>(GenerateSample(now));
    }

    public Task<List<RackTelemetry>> GetHistoryAsync(int hours, CancellationToken ct)
    {
        var end = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var start = end - (hours * 3600L);
        const int intervalSeconds = 300;

        var data = new List<RackTelemetry>();
        for (var ts = start; ts <= end; ts += intervalSeconds)
            data.Add(GenerateSample(ts));

        return Task.FromResult(data);
    }

    private static RackTelemetry GenerateSample(long timestamp)
    {
        var periodA = timestamp / 1800d;
        var periodB = timestamp / 900d;
        var periodC = timestamp / 1200d;

        var rackTop = 34 + (Math.Sin(periodA) * 3.8) + (Math.Cos(periodC) * 1.1);
        var rackBottom = 30 + (Math.Sin(periodA - 0.6) * 3.2);
        var ux7Cpu = 53 + (Math.Sin(periodB) * 7.2);
        var ux7Board = 43 + (Math.Cos(periodA + 0.8) * 3.1);
        var unvrCpu = 51 + (Math.Sin(periodB - 0.4) * 6.4);
        var unvrBoard = 40 + (Math.Cos(periodA - 0.3) * 2.8);

        var fanFtPct = 38 + (Math.Sin(periodB) * 10);
        var fanFbPct = 35 + (Math.Cos(periodB - 0.2) * 9);
        var fanFlPct = 40 + (Math.Sin(periodB - 0.6) * 11);
        var fanFrPct = 39 + (Math.Cos(periodB + 0.4) * 10);
        var fanE1Pct = 33 + (Math.Sin(periodB - 0.9) * 8);
        var fanE4Pct = 31 + (Math.Cos(periodB + 0.7) * 8);

        return new RackTelemetry
        {
            Device = "rack01-dev",
            Timestamp = timestamp,
            RackTop = Round1(rackTop),
            RackBottom = Round1(rackBottom),
            Ux7Cpu = Round1(ux7Cpu),
            Ux7Board = Round1(ux7Board),
            UnvrCpu = Round1(unvrCpu),
            UnvrBoard = Round1(unvrBoard),
            FanFtPct = Round1(Clamp(fanFtPct, 20, 90)),
            FanFtRpm = ToRpm(fanFtPct),
            FanFbPct = Round1(Clamp(fanFbPct, 20, 90)),
            FanFbRpm = ToRpm(fanFbPct),
            FanFlPct = Round1(Clamp(fanFlPct, 20, 90)),
            FanFlRpm = ToRpm(fanFlPct),
            FanFrPct = Round1(Clamp(fanFrPct, 20, 90)),
            FanFrRpm = ToRpm(fanFrPct),
            FanE1Pct = Round1(Clamp(fanE1Pct, 20, 90)),
            FanE1Rpm = ToRpm(fanE1Pct),
            FanE4Pct = Round1(Clamp(fanE4Pct, 20, 90)),
            FanE4Rpm = ToRpm(fanE4Pct),
            Status = ux7Cpu > 70 || unvrCpu > 70 ? "WARNING" : "NORMAL"
            //Status = "OFFLINE"
        };
    }

    private static double Round1(double value) => Math.Round(value, 1);

    private static double Clamp(double value, double min, double max) =>
        Math.Max(min, Math.Min(max, value));

    private static double ToRpm(double percent) =>
        Math.Round(700 + (Clamp(percent, 0, 100) / 100d) * 1800, 0);
}
