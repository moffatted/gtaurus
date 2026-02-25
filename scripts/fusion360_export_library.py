# ──────────────────────────────────────────────────────────────────────────────
# Fusion 360 → Gtaurus Tool Library Exporter
# ──────────────────────────────────────────────────────────────────────────────
# 
# PURPOSE:
#   Run this script inside Fusion 360 (Utilities > Scripts & Add-Ins > +)
#   to export your entire tool library into a JSON file that Gtaurus can import
#   directly via the ⬆ Import button in the Bit Library panel.
#
# USAGE:
#   1. Open Fusion 360 and switch to the Manufacture workspace.
#   2. Go to Utilities → Scripts and Add-Ins → My Scripts → + (green plus).
#   3. Select "Python" and paste this script.
#   4. Click Run. A file dialog will ask where to save the JSON.
#   5. In Gtaurus, open Bit Library → click the ⬆ Import button → select the file.
#
# OUTPUT FORMAT:
#   {
#     "version": "gtaurus-fusion-export-v1",
#     "exported_at": "2024-01-01T00:00:00",
#     "tools": [
#       {
#         "name": "1/4 Flat Endmill",
#         "type": "flat end mill",
#         "geometry": {
#           "diameter": 6.35,
#           "body-length": 20.0,
#           "overall-length": 50.0,
#           "number-of-flutes": 2,
#           "tip-angle": null,
#           "shoulder-length": 38.0
#         },
#         "post-process": { "number": 1 },
#         "BMC": "carbide",
#         "description": "1/4 Flat Endmill",
#         "comment": ""
#       },
#       ...
#     ]
#   }
# ──────────────────────────────────────────────────────────────────────────────

import adsk.core
import adsk.cam
import json
import os
from datetime import datetime

def run(context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface

        # Access CAM / Manufacturing workspace
        cam = adsk.cam.CAMManager.get()
        if not cam or not cam.camProduct:
            ui.messageBox(
                'Please switch to the Manufacture workspace first.\n'
                '(Design → Manufacture in the top-left dropdown)',
                'Gtaurus Export'
            )
            return

        product = cam.camProduct
        tool_libraries = product.toolLibraries

        if tool_libraries.count == 0:
            ui.messageBox('No tool libraries found.', 'Gtaurus Export')
            return

        # Collect tools from ALL libraries
        all_tools = []

        for lib_idx in range(tool_libraries.count):
            lib = tool_libraries.item(lib_idx)
            lib_url = lib.name if hasattr(lib, 'name') else f'Library {lib_idx}'

            for tool_idx in range(lib.count):
                tool = lib.item(tool_idx)
                tool_data = extract_tool(tool, lib_url)
                if tool_data:
                    all_tools.append(tool_data)

        if not all_tools:
            ui.messageBox('No tools found in any library.', 'Gtaurus Export')
            return

        # Ask user where to save
        file_dialog = ui.createFileDialog()
        file_dialog.title = 'Save Gtaurus Tool Library'
        file_dialog.filter = 'JSON Files (*.json);;All Files (*.*)'
        file_dialog.filterIndex = 0
        file_dialog.initialFilename = 'gtaurus_fusion_tools.json'

        result = file_dialog.showSave()
        if result != adsk.core.DialogResults.DialogOK:
            return

        output_path = file_dialog.filename

        export_data = {
            'version': 'gtaurus-fusion-export-v1',
            'exported_at': datetime.now().isoformat(),
            'source': 'Fusion 360 Desktop API',
            'tools': all_tools
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)

        ui.messageBox(
            f'Exported {len(all_tools)} tools to:\n{output_path}\n\n'
            f'Import this file in Gtaurus via the ⬆ button in the Bit Library.',
            'Gtaurus Export Complete'
        )

    except Exception:
        import traceback
        if ui:
            ui.messageBox(f'Export failed:\n{traceback.format_exc()}', 'Gtaurus Export Error')


def extract_tool(tool, library_name):
    """Extract geometry and metadata from a Fusion 360 Tool object."""
    try:
        # Basic identity
        name = getattr(tool, 'description', '') or getattr(tool, 'name', 'Unknown Tool')
        tool_type = getattr(tool, 'type', 'unknown')

        # Map Fusion's ToolTypes enum to readable strings
        type_str = str(tool_type).split('.')[-1] if tool_type else 'unknown'

        # Geometry
        geom = {}
        for attr, key in [
            ('diameter',        'diameter'),
            ('bodyLength',      'body-length'),
            ('overallLength',   'overall-length'),
            ('shoulderLength',  'shoulder-length'),
            ('numberOfFlutes',  'number-of-flutes'),
            ('fluteLength',     'flute-length'),
            ('tipAngle',        'tip-angle'),
            ('taperAngle',      'taper-angle'),
            ('shaftDiameter',   'shaft-diameter'),
        ]:
            val = getattr(tool, attr, None)
            if val is not None:
                # Convert from cm (Fusion internal) to mm
                if key in ('diameter', 'body-length', 'overall-length',
                           'shoulder-length', 'flute-length', 'shaft-diameter'):
                    val = val * 10.0  # cm → mm
                geom[key] = round(val, 4)

        # Post-process
        post = {}
        tool_number = getattr(tool, 'number', None) or getattr(tool, 'toolNumber', None)
        if tool_number is not None:
            post['number'] = tool_number

        # Material (BMC = Body Material Code in Fusion)
        bmc = getattr(tool, 'BMC', None) or getattr(tool, 'material', 'carbide')
        comment = getattr(tool, 'comment', '') or ''

        return {
            'name': name,
            'description': name,
            'type': type_str,
            'geometry': geom,
            'post-process': post,
            'BMC': str(bmc) if bmc else 'carbide',
            'comment': comment,
            'source_library': library_name,
        }

    except Exception:
        return None
