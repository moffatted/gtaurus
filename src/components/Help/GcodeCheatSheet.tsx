/**
 * @file GcodeCheatSheet.tsx
 * @purpose Searchable G-code reference list for the help center.
 */
import { useState } from 'react';
import { Search, Info } from 'lucide-react';

const GCODES = [
  // Motion
  { code: 'G0', desc: 'Rapid Move' },
  { code: 'G1', desc: 'Linear Move' },
  { code: 'G2', desc: 'Clockwise Circular Arc' },
  { code: 'G3', desc: 'Counter-Clockwise Circular Arc' },
  { code: 'G4', desc: 'Dwell (Pause)' },
  { code: 'G5', desc: 'Cubic Spline' },
  { code: 'G5.1', desc: 'Quadratic Spline' },
  
  // Plane Selection
  { code: 'G17', desc: 'XY Plane Selection' },
  { code: 'G18', desc: 'ZX Plane Selection' },
  { code: 'G19', desc: 'YZ Plane Selection' },
  
  // Units & Distance
  { code: 'G20', desc: 'Inch Units' },
  { code: 'G21', desc: 'Millimeter Units' },
  { code: 'G90', desc: 'Absolute Positioning' },
  { code: 'G91', desc: 'Incremental Positioning' },

  // Referencing & Homing
  { code: 'G28', desc: 'Return to Home' },
  { code: 'G28.1', desc: 'Return to Home (specific axes)' },
  { code: 'G29', desc: 'Return from Reference Point' },
  { code: 'G30', desc: 'Return to 2nd, 3rd, or 4th Reference Point' },

  // Probing (FluidNC / GRBL)
  { code: 'G38.2', desc: 'Probe towards workpiece (stop on contact, error on fail)' },
  { code: 'G38.3', desc: 'Probe towards workpiece (stop on contact)' },
  { code: 'G38.4', desc: 'Probe away from workpiece (stop on loss of contact, error on fail)' },
  { code: 'G38.5', desc: 'Probe away from workpiece (stop on loss of contact)' },
  { code: 'G38.6', desc: 'Probe towards workpiece (fast feed)', fluidnc: true },
  
  // Offsets & Coordinates
  { code: 'G10 L2', desc: 'Set Coordinate System Offset' },
  { code: 'G10 L20', desc: 'Set Work Coordinate Offset (Zeroing)' },
  { code: 'G52', desc: 'Local Coordinate System Setting' },
  { code: 'G53', desc: 'Machine Coordinate System Setting' },
  { code: 'G54', desc: 'Work Coordinate System #1 (Default)' },
  { code: 'G55', desc: 'Work Coordinate System #2' },
  { code: 'G56', desc: 'Work Coordinate System #3' },
  { code: 'G57', desc: 'Work Coordinate System #4' },
  { code: 'G58', desc: 'Work Coordinate System #5' },
  { code: 'G59', desc: 'Work Coordinate System #6' },
  { code: 'G92', desc: 'Set Position (Temporary Offset)' },
  { code: 'G92.1', desc: 'Cancel G92 Offsets' },

  // Compensations
  { code: 'G40', desc: 'Cutter Compensation Cancel' },
  { code: 'G43', desc: 'Tool Length Compensation Positive' },
  { code: 'G43.1', desc: 'Dynamic Tool Length Compensation', fluidnc: true },
  { code: 'G49', desc: 'Tool Length Compensation Cancel' },

  // Modes
  { code: 'G61', desc: 'Exact Stop Mode' },
  { code: 'G64', desc: 'Path Blending Mode' },
  { code: 'G93', desc: 'Inverse Time Mode' },
  { code: 'G94', desc: 'Feed per Minute Mode (Default)' },
  { code: 'G97', desc: 'Fixed RPM Mode' },

  // Cycles
  { code: 'G80', desc: 'Cancel Motion Mode' },
  { code: 'G81', desc: 'Drilling Cycle' },
  { code: 'G82', desc: 'Counterboring' },
  { code: 'G83', desc: 'Deep Hole Drilling Cycle' },

  // M-Codes (Program Control)
  { code: 'M0', desc: 'Program Stop' },
  { code: 'M1', desc: 'Optional Program Stop' },
  { code: 'M2', desc: 'Program End' },
  { code: 'M30', desc: 'Program End and Rewind' },

  // M-Codes (Spindle & Coolant)
  { code: 'M3', desc: 'Spindle On (Clockwise)' },
  { code: 'M4', desc: 'Spindle On (Counter-Clockwise)' },
  { code: 'M5', desc: 'Spindle Stop' },
  { code: 'M7', desc: 'Mist Coolant On' },
  { code: 'M8', desc: 'Flood Coolant On' },
  { code: 'M9', desc: 'Coolant Off (Turns off M7 and M8)' },
  { code: 'M7.1', desc: 'Mist Coolant Off', fluidnc: true },
];

export function GcodeCheatSheet() {
  const [search, setSearch] = useState('');

  const filtered = GCODES.filter(item => 
    item.code.toLowerCase().includes(search.toLowerCase()) || 
    item.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search G-codes (e.g. 'G0' or 'Linear')..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors shadow-sm"
        />
      </div>

      <div className="bg-[var(--bg-tertiary)]/30 border border-[var(--border-color)] rounded-xl overflow-hidden shadow-inner">
        <div className="max-h-[50vh] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[var(--bg-secondary)] z-10 border-b border-[var(--border-color)] shadow-sm">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] w-24">Command</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/50">
              {filtered.length > 0 ? (
                filtered.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[var(--accent-primary)]/5 transition-colors group">
                    <td className="px-4 py-2.5 flex items-center gap-2 font-mono text-sm font-bold text-[var(--accent-primary)] group-hover:translate-x-1 transition-transform origin-left">
                      {item.code}
                      {item.fluidnc && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[9px] font-bold uppercase tracking-tight border border-[var(--accent-primary)]/20 shadow-sm whitespace-nowrap">
                          FluidNC
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-[var(--text-secondary)]">{item.desc}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-[var(--text-tertiary)] italic">
                    No G-codes matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
        <div className="flex items-center gap-3">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <p className="text-[11px] text-[var(--text-secondary)] leading-tight italic">
            <strong>Note:</strong> This is a quick reference for common G-codes.
          </p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[9px] font-bold uppercase border border-[var(--accent-primary)]/20 shadow-sm">
            FluidNC
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)] italic">= Platform extension</span>
        </div>
      </div>
    </div>
  );
}
