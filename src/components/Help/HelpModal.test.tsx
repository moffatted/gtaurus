import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '../../utils/testUtils';
import { useHelpStore } from '../../stores/helpStore';
import { HelpModal } from './HelpModal';

describe('HelpModal nested navigation', () => {
  beforeEach(() => {
    useHelpStore.setState({ isOpen: true, activeTopic: 'settings-machine-system' });
  });

  it('shows Machine & System child topics when the parent topic is active', () => {
    render(<HelpModal />);

    expect(screen.getByRole('button', { name: 'General' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AI Assistant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add AI Client' })).toBeInTheDocument();
  });

  it('navigates to a specific Machine & System child topic', () => {
    render(<HelpModal />);

    fireEvent.click(screen.getByRole('button', { name: 'AI Assistant' }));

    expect(screen.getByRole('heading', { name: 'Settings: Machine & System / AI Assistant' })).toBeInTheDocument();
    expect(screen.getByText(/control panel visibility, dashboard integration, response style/i)).toBeInTheDocument();
  });

  it('returns child topics in help search results', () => {
    render(<HelpModal />);

    fireEvent.change(screen.getByPlaceholderText(/search help/i), {
      target: { value: 'add ai client' },
    });

    expect(screen.getByRole('button', { name: /add ai client/i })).toBeInTheDocument();
  });

  it('expands multiple parent groups and highlights every matching child topic during search', () => {
    render(<HelpModal />);

    fireEvent.change(screen.getByPlaceholderText(/search help/i), {
      target: { value: 'ai assistant' },
    });

    expect(screen.getByTestId('help-topic-settings-machine-system')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('help-topic-top-menu-panels')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('help-topic-settings-machine-system-ai-assistant')).toHaveAttribute('data-search-match', 'true');
    expect(screen.getByTestId('help-topic-top-menu-panels-ai-assistant')).toHaveAttribute('data-search-match', 'true');
  });

  it('clears the search field with the clear button', () => {
    render(<HelpModal />);

    const searchInput = screen.getByPlaceholderText(/search help/i);
    fireEvent.change(searchInput, {
      target: { value: 'ai assistant' },
    });

    fireEvent.click(screen.getByRole('button', { name: /clear help search/i }));

    expect(searchInput).toHaveValue('');
  });

  it('navigates to a wizard child topic from the sidebar tree', () => {
    useHelpStore.setState({ isOpen: true, activeTopic: 'carve-wizard' });

    render(<HelpModal />);

    fireEvent.click(screen.getByRole('button', { name: 'Step 8: Surface Calibration' }));

    expect(screen.getByRole('heading', { name: 'Carve Wizard / Step 8: Surface Calibration' })).toBeInTheDocument();
    expect(screen.getByText(/auto level mesh mapping/i)).toBeInTheDocument();
  });
});