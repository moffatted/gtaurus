import { ask as tauriAsk, message as tauriMessage } from '@tauri-apps/plugin-dialog';
import { isTauriApp } from './platform';

/**
 * Cross-platform confirmation dialog
 * Falls back to window.confirm when running in a web browser
 */
export const ask = async (
  message: string,
  options: { title?: string; kind?: 'info' | 'warning' | 'error'; okLabel?: string; cancelLabel?: string } = {}
): Promise<boolean> => {
  if (isTauriApp()) {
    try {
      return await tauriAsk(message, options);
    } catch (e) {
      console.error('Tauri ask failed, falling back to window.confirm:', e);
      return window.confirm(message);
    }
  }

  // Web Browser Fallback
  return window.confirm(`${options.title ? `[${options.title}]\n\n` : ''}${message}`);
};

/**
 * Cross-platform alert message
 * Falls back to window.alert when running in a web browser
 */
export const message = async (
  text: string,
  options: { title?: string; kind?: 'info' | 'warning' | 'error'; okLabel?: string } = {}
): Promise<void> => {
  if (isTauriApp()) {
    try {
      await tauriMessage(text, options);
      return;
    } catch (e) {
      console.error('Tauri message failed, falling back to window.alert:', e);
      window.alert(text);
      return;
    }
  }

  // Web Browser Fallback
  window.alert(`${options.title ? `[${options.title}]\n\n` : ''}${text}`);
};
