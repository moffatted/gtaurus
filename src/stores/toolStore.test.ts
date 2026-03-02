import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useToolStore } from './toolStore';

// Mock platform check to test localStorage path
vi.mock('../utils/platform', () => ({
  isTauriApp: () => false
}));

describe('toolStore', () => {
    beforeEach(() => {
        // Reset to default tools
        useToolStore.setState({
            tools: [
                {
                    id: 'test-tool',
                    name: 'Test Tool',
                    type: 'endmill',
                    diameter: 3.175,
                    number: 1,
                    fluteCount: 2,
                    usageTimeSec: 0,
                    usageDistanceMm: 0,
                    material: 'Carbide',
                    lastMaintenanceDate: new Date().toISOString(),
                }
            ],
            activeToolId: 'test-tool'
        });
    });

    it('should add a tool', () => {
        const store = useToolStore.getState();
        store.addTool({
            name: 'New Tool',
            type: 'v-bit',
            diameter: 6.35,
            number: 2,
            fluteCount: 1,
            material: 'HSS'
        });
        
        const tools = useToolStore.getState().tools;
        expect(tools.length).toBe(2);
        expect(tools[1].name).toBe('New Tool');
        expect(tools[1].id).toBeDefined();
    });

    it('should update a tool', () => {
        const store = useToolStore.getState();
        store.updateTool('test-tool', { name: 'Updated Name' });
        
        const tool = useToolStore.getState().tools.find(t => t.id === 'test-tool');
        expect(tool?.name).toBe('Updated Name');
    });

    it('should delete a tool and clear activeToolId if it was active', () => {
        const store = useToolStore.getState();
        store.deleteTool('test-tool');
        
        expect(useToolStore.getState().tools.length).toBe(0);
        expect(useToolStore.getState().activeToolId).toBeNull();
    });

    it('should set active tool', () => {
        const store = useToolStore.getState();
        store.setActiveTool('null');
        expect(useToolStore.getState().activeToolId).toBe('null');
    });

    it('should record usage', () => {
        const store = useToolStore.getState();
        store.recordUsage('test-tool', 3600, 1000);
        
        const tool = useToolStore.getState().tools.find(t => t.id === 'test-tool');
        expect(tool?.usageTimeSec).toBe(3600);
        expect(tool?.usageDistanceMm).toBe(1000);
    });
});
