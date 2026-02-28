/**
 * @file meshStore.ts
 * @purpose Manages the height map data used for auto-leveling and the state of relevant probing routines.
 */
import { create } from 'zustand';

export interface HeightMapData {
  min_x: number;
  min_y: number;
  spacing: number;
  cols: number;
  rows: number;
  grid: number[];
}

interface MeshStore {
  mapData: HeightMapData | null;
  isProbing: boolean;
  setMapData: (data: HeightMapData | null) => void;
  setIsProbing: (probing: boolean) => void;
  reset: () => void;
}

export const useMeshStore = create<MeshStore>((set) => ({
  mapData: null,
  isProbing: false,
  setMapData: (data) => set({ mapData: data }),
  setIsProbing: (probing) => set({ isProbing: probing }),
  reset: () => set({ mapData: null, isProbing: false }),
}));
