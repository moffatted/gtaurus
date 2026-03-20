import { ReactNode } from 'react';
import {
  Bot,
  Palette,
  SlidersHorizontal,
  Cable,
  Crosshair,
  Cpu,
  Box,
  History,
  BarChart2,
  Wrench,
  RotateCw,
  LayoutDashboard,
  LayoutGrid,
  Activity,
  Folder,
  FileCode,
  Camera,
} from 'lucide-react';
import { ThemeContent } from './ThemeContent';
import { GeneralContent } from './GeneralContent';
import { DashboardContent } from './DashboardContent';
import { ConnectionContent as SettingsConnectionContent } from './ConnectionContent';
import { FileManagerContent as SettingsFileManagerContent } from './FileManagerContent';
import { VisualizerContent as SettingsVisualizerContent } from './VisualizerContent';
import { AIAssistantContent } from './AIAssistantContent';
import { NavigationContent } from './NavigationContent';
import { ProbeContent } from './ProbeContent';
import { SpindleContent } from './SpindleContent';
import AtcContent from './AtcContent';
import MacrosContent from './MacrosContent';
import RotaryContent from './RotaryContent';
import CameraContent from './CameraContent';

export const SETTINGS_SECTIONS = [
  { id: 'dashboard', title: 'Dashboard', icon: <LayoutGrid className="w-4 h-4" />, tab: 'dashboard' },
  { id: 'widgets', title: 'Widgets', icon: <LayoutDashboard className="w-4 h-4" />, tab: 'dashboard' },
  { id: 'theme', title: 'Theme & UX', icon: <Palette className="w-4 h-4" />, tab: 'ui' },
  { id: 'navigation', title: 'Top Menu', icon: <Activity className="w-4 h-4" />, tab: 'ui' },
  { id: 'visualizer', title: 'Bed Visualizer', icon: <Box className="w-4 h-4" />, tab: 'ui' },
  { id: 'stats', title: 'Stats Display', icon: <BarChart2 className="w-4 h-4" />, tab: 'ui' },
  { id: 'camera', title: 'Camera', icon: <Camera className="w-4 h-4" />, tab: 'ui' },
  { id: 'general', title: 'General', icon: <SlidersHorizontal className="w-4 h-4" />, tab: 'machine' },
  { id: 'connection', title: 'Connection', icon: <Cable className="w-4 h-4" />, tab: 'machine' },
  { id: 'file-manager', title: 'File Manager', icon: <Folder className="w-4 h-4" />, tab: 'machine' },
  { id: 'probe', title: 'Probe', icon: <Crosshair className="w-4 h-4" />, tab: 'machine' },
  { id: 'spindle', title: 'Spindle', icon: <Cpu className="w-4 h-4" />, tab: 'machine' },
  { id: 'macros', title: 'Macros', icon: <FileCode className="w-4 h-4" />, tab: 'machine' },
  { id: 'atc', title: 'Tool Changer', icon: <Wrench className="w-4 h-4" />, tab: 'machine' },
  { id: 'rotary', title: 'Rotary Config', icon: <RotateCw className="w-4 h-4" />, tab: 'machine' },
  { id: 'ai', title: 'AI Assistant', icon: <Bot className="w-4 h-4" />, tab: 'machine' },
  { id: 'history', title: 'History', icon: <History className="w-4 h-4" />, tab: 'machine' },
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]['id'];

export function getSectionContent(id: SettingsSectionId): ReactNode | undefined {
  if (id === 'dashboard') return <DashboardContent />;
  if (id === 'theme') return <ThemeContent />;
  if (id === 'general') return <GeneralContent />;
  if (id === 'connection') return <SettingsConnectionContent />;
  if (id === 'file-manager') return <SettingsFileManagerContent />;
  if (id === 'probe') return <ProbeContent />;
  if (id === 'spindle') return <SpindleContent />;
  if (id === 'atc') return <AtcContent />;
  if (id === 'rotary') return <RotaryContent />;
  if (id === 'camera') return <CameraContent />;
  if (id === 'ai') return <AIAssistantContent />;
  if (id === 'navigation') return <NavigationContent />;
  if (id === 'visualizer') return <SettingsVisualizerContent />;
  if (id === 'macros') return <MacrosContent />;
  return undefined;
}