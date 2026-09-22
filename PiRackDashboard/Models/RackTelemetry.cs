namespace PiRackDashboard.Models;

public sealed class RackTelemetry
{
    public string Device { get; set; } = "";
    public long Timestamp { get; set; }

    public double? RackTop { get; set; }
    public double? RackBottom { get; set; }
    public double? Ux7Cpu { get; set; }
    public double? Ux7Board { get; set; }
    public double? UnvrCpu { get; set; }
    public double? UnvrBoard { get; set; }
    public double? FanFtPct { get; set; }
    public double? FanFtRpm { get; set; }
    public double? FanFbPct { get; set; }
    public double? FanFbRpm { get; set; }
    public double? FanFlPct { get; set; }
    public double? FanFlRpm { get; set; }
    public double? FanFrPct { get; set; }
    public double? FanFrRpm { get; set; }
    public double? FanE1Pct { get; set; }
    public double? FanE1Rpm { get; set; }
    public double? FanE4Pct { get; set; }
    public double? FanE4Rpm { get; set; }

    public string Status { get; set; } = "UNKNOWN";
}