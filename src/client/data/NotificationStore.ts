import { notifications } from '@mantine/notifications';

import { toReadableErrorMessage } from 'shared/types';
import { logger } from 'client/Logger';

type AlertColor = 'success' | 'info' | 'warning' | 'error';

export interface AppNotification {
  message: string;
  cause?: unknown;
  severity?: AlertColor;
  immediate?: boolean;
}

const severityColor: Record<AlertColor, string> = {
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'blue',
};

/** Show a notification. */
export function notify(message: string, params?: Partial<AppNotification>): void {
  const severity = params?.severity ?? 'success';
  notifications.show({
    message,
    color: severityColor[severity],
  });
}

/** Show a warning notification with a cause. */
export function notifyError(
  message: string,
  cause: unknown,
  params?: Partial<AppNotification>,
): void {
  const fullMessage = message + ', syy: ' + toReadableErrorMessage(cause);
  logger.warn({ cause }, message);
  notifications.show({
    message: fullMessage,
    color: severityColor[params?.severity ?? 'warning'],
  });
}
