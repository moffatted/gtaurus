/*
 * @file probe_runner.rs
 * @purpose Core engine for orchestrating bed probing sequences, interacting with the CNC driver to generate a height map.
 */
use glam::DVec3;
use regex::Regex;
use std::sync::LazyLock;

// Example GRBL & GrblHAL format: [PRB:100.000,50.000,-5.200:1]
// First 3 groups are X, Y, Z. The last group is success flag (1 = success, 0 = fail).
static PRB_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"\[PRB:([\d\.-]+),([\d\.-]+),([\d\.-]+):([01])\]").unwrap());

#[derive(Debug, PartialEq)]
pub enum ProbeResult {
    /// Probe successfully triggered and recorded location
    Success(DVec3),
    /// Probe failed (did not trigger within distance)
    Failed,
    /// String was not a probe report
    NotAProbeReport,
}

/// Parses the GRBL output stream to identify probe coordinate reports
pub fn parse_probe_report(line: &str) -> ProbeResult {
    if let Some(caps) = PRB_REGEX.captures(line) {
        let success_flag = caps.get(4).map_or("0", |m| m.as_str());

        if success_flag == "1" {
            let x = caps.get(1).unwrap().as_str().parse::<f64>().unwrap_or(0.0);
            let y = caps.get(2).unwrap().as_str().parse::<f64>().unwrap_or(0.0);
            let z = caps.get(3).unwrap().as_str().parse::<f64>().unwrap_or(0.0);
            return ProbeResult::Success(DVec3::new(x, y, z));
        } else {
            return ProbeResult::Failed;
        }
    }

    ProbeResult::NotAProbeReport
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_grbl_probe() {
        let report = "[PRB:120.000,80.000,-12.450:1]";
        if let ProbeResult::Success(pos) = parse_probe_report(report) {
            assert_eq!(pos.x, 120.0);
            assert_eq!(pos.y, 80.0);
            assert_eq!(pos.z, -12.450);
        } else {
            panic!("Failed to parse valid PRB string");
        }
    }

    #[test]
    fn test_failed_grbl_probe() {
        let report = "[PRB:120.000,80.000,-12.450:0]";
        assert_eq!(parse_probe_report(report), ProbeResult::Failed);
    }

    #[test]
    fn test_grblhal_variation() {
        // GrblHAL format is identical to standard Grbl per strategy notes
        let report = "[PRB:0.000,0.000,-0.125:1]";
        if let ProbeResult::Success(pos) = parse_probe_report(report) {
            assert_eq!(pos.x, 0.0);
            assert_eq!(pos.y, 0.0);
            assert_eq!(pos.z, -0.125);
        } else {
            panic!("Failed to parse GrblHAL PRB string");
        }
    }

    #[test]
    fn test_not_a_probe() {
        let report = "<Idle|WPos:0.000,0.000,0.000|FS:0,0>";
        assert_eq!(parse_probe_report(report), ProbeResult::NotAProbeReport);
    }
}
