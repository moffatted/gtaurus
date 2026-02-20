# Machine Statistics Strategy

Tracking CNC job data is essential for calculating efficiency and profit. This document outlines the core categories of telemetry and management metrics used in Gtaurus.

## 1. Core Time Metrics

The fundamental timestamps for job lifecycle management:

- **First Start / Last End**: Exact moment the "Cycle Start" was first pressed for a batch and when the last part was completed.
- **Cycle Time**: Actual time the machine is running the program for a single part.
- **Rapid vs. Cutting Time**: Time spent moving through the air (Rapids) versus actual material removal.
- **Dwell Time**: Intentional pauses (e.g., chip clearing or cooling).

## 2. Operational Efficiency (OEE)

The gold standard for CNC statistics, combining three key factors:

- **Availability (Uptime vs. Downtime)**:
  - *Planned*: Breaks, meetings, or scheduled maintenance.
  - *Unplanned*: Tool breakage, machine crashes, or material delays.
- **Performance (Actual vs. Standard)**:
  - **Machine Utilization Rate (MUR)**: Percentage of active cutting vs. idle time (Target: 75–85%).
  - **Feed Rate Override**: Logging operator adjustments to speed.
- **Quality (Good vs. Bad)**:
  - **Scrap/Rejection Rate**: Parts thrown away vs. parts passed.
  - **Rework Time**: Time spent fixing sub-standard parts.

## 3. Tooling and Consumables

Tracking "health" across jobs to predict maintenance:

- **Tool Life Remaining**: Accumulated minutes "in the cut" for specific tools.
- **Tool Change Frequency**: How often the machine stops for tool swaps.
- **Vibration/Load Spikes**: Predictive alerts for spindle bearing wear or dull tools.

## 4. Production Metrics

- **Parts Per Hour (PPH)**: The production cadence.
- **Material Removal Rate (MRR)**: Volume of material removed per minute (in³/min).
- **Energy Consumption**: KWh used per part for accurate quoting.

## 5. Labor and Cost Stats

- **Labor Hours per Part**: Total human time divided by part count.
- **Operator Intervention Count**: Frequency of manual stops (chip clearing, dimension checks).
- **Gross Margin Per Part (GMPP)**: Final profitability calculation after time, material, and labor.

## Summary: The Job Report

| Metric | Description |
| :--- | :--- |
| **Scheduled Time** | Estimated time the job should have taken. |
| **Actual Total Time** | From first "Start" to "Finished" (includes setup/teardown). |
| **Actual Run Time** | Time the spindle was actually turning. |
| **Idle Time** | Machine "On" but not "Running" (loading parts). |
| **Alarm Time** | Time lost to machine errors or crashes. |
| **Count** | Total parts attempted vs. total parts passed QC. |
