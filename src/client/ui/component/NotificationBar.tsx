import { Box, Notification } from '@mantine/core';
import { CircleAlert, CircleCheckBig, Info, TriangleAlert } from 'lucide-react';
import * as React from 'react';

import { toReadableErrorMessage } from 'shared/types';
import { AppNotification, useNotificationStore } from 'client/data/NotificationStore';
import { logger } from 'client/Logger';

const msgInterval = 5000;

const severityIcon = {
  success: <CircleCheckBig size={18} />,
  error: <CircleAlert size={18} />,
  warning: <TriangleAlert size={18} />,
  info: <Info size={18} />,
};

const severityColor = {
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'blue',
};

export const NotificationBar: React.FC = () => {
  const notification = useNotificationStore(s => s.current);
  const dismiss = useNotificationStore(s => s.dismiss);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Log warnings/errors when a new notification appears
  React.useEffect(() => {
    if (!notification) return;
    logNotification(notification);
  }, [notification]);

  // Auto-dismiss after interval
  React.useEffect(() => {
    if (!notification) return;
    timerRef.current = setTimeout(dismiss, msgInterval);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification, dismiss]);

  if (!notification) return null;

  const message = notification.cause
    ? notification.message + ', syy: ' + toReadableErrorMessage(notification.cause)
    : notification.message;

  const severity = notification.severity ?? 'success';

  return (
    <Box
      pos="fixed"
      bottom="lg"
      left="50%"
      style={{ transform: 'translateX(-50%)', zIndex: 1400, minWidth: 300, maxWidth: 560 }}
    >
      <Notification
        icon={severityIcon[severity]}
        color={severityColor[severity]}
        onClose={dismiss}
        withCloseButton
      >
        {message}
      </Notification>
    </Box>
  );
};

function logNotification(n: AppNotification) {
  if (n.severity === 'error') {
    logger.error(n.cause ?? {}, n.message);
  } else if (n.severity === 'warning') {
    logger.warn(n.cause ?? {}, n.message);
  }
}
