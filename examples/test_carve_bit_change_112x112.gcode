%
(Test Carve with Bit Changes for 112mm x 112mm x 6mm Stock)
(Stock Size: 112mm x 112mm x 6mm)
(Zero Point: Center of stock, Top surface)
(Purpose: multi-operation test with tool changes for visualizer)

(---Safety/Startup---)
G21 (Metric)
G17 (XY Plane)
G90 (Absolute)
G54 (Workspace 1)
G00 Z8.000

(============================================================)
(OP 1 - T1 FLAT ENDMILL 6MM: ROUGH BORDER POCKET @ Z-2.0)
(============================================================)
T1 M6 (Tool change to 6mm flat endmill)
S12000 M03
G04 P1.0

(Outer square: 100 x 100)
G00 X-50.000 Y-50.000
G01 Z-2.000 F400
G01 X50.000 Y-50.000 F1200
G01 X50.000 Y50.000
G01 X-50.000 Y50.000
G01 X-50.000 Y-50.000
G00 Z8.000

(Inner square: 92 x 92 to suggest rough pocket wall)
G00 X-46.000 Y-46.000
G01 Z-2.000 F400
G01 X46.000 Y-46.000 F1200
G01 X46.000 Y46.000
G01 X-46.000 Y46.000
G01 X-46.000 Y-46.000
G00 Z8.000

M05

(============================================================)
(OP 2 - T2 CHAMFER BIT 90DEG: OUTER EDGE BREAK @ Z-0.6)
(============================================================)
T2 M6 (Tool change to chamfer bit)
S10000 M03
G04 P1.0

(Chamfer path slightly inset from stock edge)
G00 X-55.500 Y-55.500
G01 Z-0.600 F250
G01 X55.500 Y-55.500 F1000
G01 X55.500 Y55.500
G01 X-55.500 Y55.500
G01 X-55.500 Y-55.500
G00 Z8.000

M05

(============================================================)
(OP 3 - T3 V-BIT 60DEG: ENGRAVE TEXT "TEST" @ Z-1.2)
(============================================================)
T3 M6 (Tool change to 60deg V-bit)
S14000 M03
G04 P1.0

(Text baseline near center: y from 8 to 24, x from -34 to 34)
(T)
G00 X-34.000 Y24.000
G01 Z-1.200 F220
G01 X-22.000 Y24.000 F700
G00 Z8.000
G00 X-28.000 Y24.000
G01 Z-1.200 F220
G01 X-28.000 Y8.000 F700
G00 Z8.000

(E)
G00 X-16.000 Y24.000
G01 Z-1.200 F220
G01 X-16.000 Y8.000 F700
G00 Z8.000
G00 X-16.000 Y24.000
G01 Z-1.200 F220
G01 X-6.000 Y24.000 F700
G00 Z8.000
G00 X-16.000 Y16.000
G01 Z-1.200 F220
G01 X-8.000 Y16.000 F700
G00 Z8.000
G00 X-16.000 Y8.000
G01 Z-1.200 F220
G01 X-6.000 Y8.000 F700
G00 Z8.000

(S)
G00 X0.000 Y8.000
G01 Z-1.200 F220
G01 X10.000 Y8.000 F700
G01 X10.000 Y16.000
G01 X0.000 Y16.000
G01 X0.000 Y24.000
G01 X10.000 Y24.000
G00 Z8.000

(T)
G00 X18.000 Y24.000
G01 Z-1.200 F220
G01 X30.000 Y24.000 F700
G00 Z8.000
G00 X24.000 Y24.000
G01 Z-1.200 F220
G01 X24.000 Y8.000 F700
G00 Z8.000

(Optional center marker)
G00 X0.000 Y0.000
G01 Z-0.500 F300
G00 Z8.000

(---Shutdown/End---)
M05
G00 X0.000 Y0.000
M30
%
