%
O2000 (Complex 3D Relief Test)
(Generated for Gtaurus Spindle/Path Testing)
(Bounds: X0 to X100, Y0 to Y100, Z-5 to Z0)

(---Setup---)
G21 (Metric)
G90 (Absolute)
G17 (XY plane)
G54 (WCS 1)

(---Start---)
G00 Z5 (Rapid to safe height)
G00 X0 Y0 (Rapid to start)
S15000 M03 (Spindle ON)
M08 (Coolant ON)

(---Outer Border---)
G01 Z-2 F200 (Slow plunge)
G01 X100 F1500
G01 Y100
G01 X0
G01 Y0
G00 Z2

(---Complex 3D Spiral---)
(Moving from center outward with varying depth)
G00 X50 Y50
G01 Z-1 F500
G01 X55 Y50 Z-1.2 F2000
G01 X55 Y55 Z-1.4
G01 X45 Y55 Z-1.6
G01 X45 Y45 Z-1.8
G01 X60 Y45 Z-2.0
G01 X60 Y60 Z-2.2
G01 X40 Y60 Z-2.4
G01 X40 Y40 Z-2.6
G01 X65 Y40 Z-2.8
G01 X65 Y65 Z-3.0
G01 X35 Y65 Z-3.2
G01 X35 Y35 Z-3.4
G01 X70 Y35 Z-3.6
G01 X70 Y70 Z-3.8
G01 X30 Y70 Z-4.0
G01 X30 Y30 Z-4.2
G01 X75 Y30 Z-4.4
G01 X75 Y75 Z-4.6
G01 X25 Y75 Z-4.8
G01 X25 Y25 Z-5.0

(---Diagonal Slashes---)
G00 Z5
G00 X0 Y0
G01 Z-2 F1000
G01 X100 Y100 Z-4
G00 Z5
G00 X0 Y100
G01 Z-2
G01 X100 Y0 Z-4

(---Finish---)
G00 Z10 (Final retract)
G00 X0 Y0 (Home XY)
M09 (Coolant OFF)
M05 (Spindle Stop)
M30 (Program End)
%
