/**
 * @file dialogs.ts
 * @purpose Cross-platform dialog utilities that avoid browser-native dialog APIs.
 */
import { ask as tauriAsk, message as tauriMessage } from '@tauri-apps/plugin-dialog';
import { isTauriApp } from './platform';

/**
 * Cross-platform confirmation dialog
 * In browser mode, this returns false and logs a warning so callers can use in-app modal flows.
 */
export const ask = async (
  message: string,
  options: { title?: string; kind?: 'info' | 'warning' | 'error'; okLabel?: string; cancelLabel?: string } = {}
): Promise<boolean> => {
  if (isTauriApp()) {
    try {
      return await tauriAsk(message, options);
    } catch (e) {
      console.error('Tauri ask failed. Avoiding browser-native fallback:', e);
      return false;
    }
  }

  console.warn('ask() called outside Tauri. Use an in-app confirmation modal instead.', {
    title: options.title,
    message,
  });
  return false;
};

/**
 * Cross-platform alert message
 * In browser mode, logs a warning so callers can use in-app notifications.
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
      console.error('Tauri message failed. Avoiding browser-native fallback:', e);
      return;
    }
  }

  console.warn('message() called outside Tauri. Use an in-app notification/modal instead.', {
    title: options.title,
    text,
  });
};
