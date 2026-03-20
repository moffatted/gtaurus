/**
 * @file CameraViewerModal.tsx
 * @purpose A non-modal, draggable wrapper for the CameraPanel.
 */
import { Camera } from "lucide-react";
import { useUIStore } from "../stores/uiStore";
import { CameraPanel } from "./CameraPanel";
import { FloatingWindow } from "./ui/FloatingWindow";

export function CameraViewerModal() {
  const { cameraViewerOpen, closeCameraViewer } = useUIStore();

  return (
    <FloatingWindow
      title="Camera Stream"
      icon={<Camera className="w-5 h-5 text-[var(--accent-primary)]" />}
      isOpen={cameraViewerOpen}
      onClose={closeCameraViewer}
      defaultPosition={{ x: 250, y: 150 }}
      defaultSize={{ width: 800, height: 600 }}
      minWidth={400}
      minHeight={300}
      zIndex={useUIStore.getState().zIndexMap.cameraViewer}
      onFocus={() => useUIStore.getState().bringToFront('cameraViewer')}
      helpTopicId="top-menu-panels"
      helpTooltip="Camera Viewer Help"
    >
      <div className="h-full w-full bg-black">
        <CameraPanel hideHeader={true} />
      </div>
    </FloatingWindow>
  );
}
