%
O1000 (Small Square Pocket)
(Tool: 0.25in Endmill)

(---Safety/Startup---)
G20 (Inches)
G17 (XY plane)
G90 (Absolute programming)
G40 (Cancel cutter compensation)
G49 (Cancel tool length offset)
G54 (Use Coordinate System 1)

(---Tool Change---)
T1 M06 (Load tool 1)
S1500 M03 (Spindle 1500 RPM, CW)
G00 G54 X0 Y0 (Rapid to center)
G43 H01 Z0.1 (Activate tool offset, Z 0.1 above surface)

(---Cutting---)
M08 (Coolant ON)
G01 Z-0.1 F10. (Plunge to 0.1 depth)

(---Profile Path---)
G01 X-0.375 Y-0.375 F15. (Move to bottom-left corner)
G01 Y0.375 (Move to top-left)
G01 X0.375 (Move to top-right)
G01 Y-0.375 (Move to bottom-right)
G01 X-0.375 (Move back to bottom-left)

(---Retract/Shutdown---)
G00 Z0.1 (Rapid retract)
G00 X0 Y0 (Move to center)
M09 (Coolant OFF)
M05 (Spindle Stop)
G28 G91 Z0 (Go to machine home)
M30 (End Program)
%
