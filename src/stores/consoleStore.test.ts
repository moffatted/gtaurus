import { describe, it, expect, beforeEach } from 'vitest';
import { useConsoleStore } from './consoleStore';

describe('consoleStore', () => {
    beforeEach(() => {
        useConsoleStore.getState().clearLines();
    });

    it('should initialize with no lines', () => {
        expect(useConsoleStore.getState().lines.length).toBe(0);
    });

    it('should append a line and classify it', () => {
        const store = useConsoleStore.getState();
        store.appendLine('ok');
        const lines = useConsoleStore.getState().lines;
        expect(lines.length).toBe(1);
        expect(lines[0].text).toBe('ok');
        expect(lines[0].type).toBe('ok');
    });

    it('should classify error lines', () => {
        useConsoleStore.getState().appendLine('error: Invalid G-code');
        const line = useConsoleStore.getState().lines[0];
        expect(line.type).toBe('error');
    });

    it('should classify system lines', () => {
        useConsoleStore.getState().appendLine('[GTaurus] Connected');
        const line = useConsoleStore.getState().lines[0];
        expect(line.type).toBe('sys');
    });

    it('should classify status lines', () => {
        useConsoleStore.getState().appendLine('<Idle|MPos:0.000,0.000,0.000|FS:0,0>');
        const line = useConsoleStore.getState().lines[0];
        expect(line.type).toBe('status');
    });

    it('should clear lines', () => {
        useConsoleStore.getState().appendLine('test');
        useConsoleStore.getState().clearLines();
        expect(useConsoleStore.getState().lines.length).toBe(0);
    });

    it('should cap lines at 1000', () => {
        const store = useConsoleStore.getState();
        for (let i = 0; i < 1100; i++) {
            store.appendLine(`line ${i}`);
        }
        expect(useConsoleStore.getState().lines.length).toBe(1000);
    });
});
