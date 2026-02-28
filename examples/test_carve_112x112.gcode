%
(Test Carve for 112mm x 112mm x 6mm Stock)
(Stock Size: 112mm x 112mm x 6mm)
(Zero Point: Center of stock, Top surface)

(---Safety/Startup---)
G21 (Metric)
G17 (XY Plane)
G90 (Absolute)
G54 (Workspace 1)

(---Spindle---)
S12000 M03 (Start Spindle at 12000 RPM)
G00 Z5.000 (Move to safe height)

(---Square Border - 100mm x 100mm---)
G00 X-50.000 Y-50.000
G01 Z-1.000 F500 (Plunge to 1mm depth)
G01 X50.000 Y-50.000 F1000 (Bottom edge)
G01 X50.000 Y50.000 (Right edge)
G01 X-50.000 Y50.000 (Top edge)
G01 X-50.000 Y-50.000 (Left edge)
G00 Z5.000 (Retract to safe height)

(---Circle Pattern - 80mm Diameter---)
G00 X40.000 Y0.000 (Position at 3 o'clock)
G01 Z-1.000 F500 (Plunge to 1mm depth)
G03 X40.000 Y0.000 I-40.000 J0.000 F1000 (Full Counter-Clockwise Circle)
G00 Z5.000 (Retract to safe height)

(---Crosshair/Center Test---)
G00 X-10.000 Y0.000
G01 Z-1.000 F500
G01 X10.000 Y0.000
G00 Z5.000
G00 X0.000 Y-10.000
G01 Z-1.000 F500
G01 X0.000 Y10.000
G00 Z5.000

(---Shutdown/End---)
G00 X0.000 Y0.000 (Return to center)
M05 (Spindle Stop)
M30 (End Program)
%
