import { create } from 'zustand';

type AlertColor = 'success' | 'info' | 'warning' | 'error';

export interface AppNotification {
  message: string;
  cause?: unknown;
  severity?: AlertColor;
  immediate?: boolean;
}

interface NotificationState {
  /** Currently displayed notification (null = nothing showing). */
  current: AppNotification | null;
  /** Queued notifications waiting to be shown. */
  queue: AppNotification[];
  /** Add a notification to the queue. Shows immediately if nothing is displayed. */
  push: (notification: AppNotification) => void;
  /** Dismiss current notification and show the next one (or clear). */
  dismiss: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  current: null,
  queue: [],

  push: notification => {
    const { current } = get();
    if (!current || notification.immediate) {
      // Show immediately
      set(s => ({
        current: notification,
        queue: current && notification.immediate ? [...s.queue, current] : s.queue,
      }));
    } else {
      set(s => ({ queue: [...s.queue, notification] }));
    }
  },

  dismiss: () => {
    const { queue } = get();
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({ current: next, queue: rest });
    } else {
      set({ current: null });
    }
  },
}));

/** Show a notification. */
export function notify(message: string, params?: Partial<AppNotification>): void {
  useNotificationStore.getState().push({ message, ...params });
}

/** Show a warning notification with a cause. */
export function notifyError(
  message: string,
  cause: unknown,
  params?: Partial<AppNotification>,
): void {
  useNotificationStore.getState().push({ message, cause, severity: 'warning', ...params });
}
