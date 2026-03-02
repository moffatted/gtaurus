import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../utils/testUtils';
import { EStopButton } from './EStopButton';

describe('EStopButton Component', () => {
  let mockInvoke: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockInvoke = vi.fn().mockResolvedValue(null);
    vi.stubGlobal('__TAURI_INTERNALS__', { invoke: mockInvoke });
  });

  it('renders correctly with STOP text', () => {
    render(<EStopButton />);
    expect(screen.getByText('STOP')).toBeInTheDocument();
  });

  it('calls send_realtime with 0x18 when clicked', async () => {
    render(<EStopButton />);
    const button = screen.getByLabelText('Emergency Stop');
    
    fireEvent.click(button);
    
    expect(mockInvoke).toHaveBeenCalledWith('send_realtime', { byte: 0x18 });
  });

  it('changes style to active when clicked', async () => {
    render(<EStopButton />);
    const button = screen.getByLabelText('Emergency Stop');
    
    fireEvent.click(button);
    
    // Class should contain red-700 when active (as per the timeout in EStopButton)
    expect(button.className).toContain('bg-red-700');
  });
});
