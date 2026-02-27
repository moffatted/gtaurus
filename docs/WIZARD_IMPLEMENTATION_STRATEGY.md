# Implementation Strategy

The idea for the 1st Wizard is to have a series of steps that guide the user through the process of setting up their machine. The Wizard will be a modal that will be triggered when the user clicks on the "Wizard" button in the main menu.

The idea for the 2nd Wizard is to guide the user through performing a carve.  The Wizard should include the safety checks and the actual carving process. The Wizard will be a modal that will be triggered when the user clicks the carve button at the top left of the screen.  It should walk them through each step of the process using the same Dockview panels if they did each step manually.  It should also provide feedback on the progress of each step and allow the user to go back to a previous step if they need to make changes. Here are the primary steps:

1. Power on and home the machine
1. Place the workpiece on the bed securely.
2. Set the workpiece height, width, and length.
3. Select the tool to use.
4. Select the material to use.
5. Upload and select the gcode file to carve.
5. Select whether you intend to use a probe or manually set zero for the workpiece.
6. Jog to the appropriate position for either the probe or zero point.
7. Perform the probe or set the zero point.
8. Ask if the user intends to run auto level.  If they do bring up the auto level modal and guide them through the process.  If they do not, continue to the next step.  If the run auto level the mesh shuld be generated and displayed.
9. After auto level, the probe should return to the zero point.
10. Perform the final safety checks.
11. Click the play button to begin the carve.
15. Monitor the carve and allow the user to pause, resume, or cancel the carve.
16. Remind the user to remain present while the machine is running.
17. When the carve is complete, power off the machine and allow the user to remove the workpiece.