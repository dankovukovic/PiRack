# PiRackDashboard

ASP.NET Core 8 Razor Pages dashboard for the `RackTelemetry` DynamoDB table.

## DynamoDB schema
- Partition key: `device` (String)
- Sort key: `timestamp` (Number, Unix seconds)
- Default device: `rack01`
- Default AWS region: `eu-west-2`

Expected attributes include `rack_top`, `rack_bottom`, `ux7_cpu`, `unvr_cpu`,
`unvr_board`, `status`, `fan_*_pct`, and `fan_*_rpm`.
Earlier `fan_ft`, `fan_fb`, etc. percentage names are also accepted.

## AWS credentials
Do not place access keys in source code.
For local development use an AWS profile or environment credentials.
When hosted on AWS, use an IAM role with `dynamodb:Query` permission
for the `RackTelemetry` table.

## Run
```bash
dotnet restore
dotnet run
```

Open the localhost URL printed by ASP.NET Core.

## Configuration
Edit `appsettings.json` to change the AWS region, DynamoDB table, or device.
