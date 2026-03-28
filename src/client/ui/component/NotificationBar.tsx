import styled from '@emotion/styled';
import { Notification } from '@mantine/core';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import * as React from 'react';

import { toReadableErrorMessage } from 'shared/types';
import { notificationE } from 'client/data/State';
import { Notification as AppNotification } from 'client/data/StateTypes';
import { logger } from 'client/Logger';

const msgInterval = 5000;

const severityIcon = {
  success: <CheckCircle size={18} />,
  error: <AlertCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const severityColor = {
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'blue',
};

export const NotificationBar: React.FC = () => {
  const [notification, setNotification] = React.useState<AppNotification | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const queueRef = React.useRef<AppNotification[]>([]);

  const scheduleNext = () => {
    timerRef.current = undefined;
    if (queueRef.current.length > 0) {
      const next = queueRef.current.shift()!;
      setNotification(next);
      timerRef.current = setTimeout(scheduleNext, msgInterval);
    } else {
      setNotification(null);
    }
  };

  const dismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    scheduleNext();
  };

  // Subscribe once on mount — scheduleNext uses only refs and setState
  React.useEffect(() => {
    const unsub = notificationE.onValue((n: AppNotification) => {
      if (n.severity === 'error') {
        logger.error(n.cause ?? {}, n.message);
      } else if (n.severity === 'warning') {
        logger.warn(n.cause ?? {}, n.message);
      }
      queueRef.current.push(n);
      if (!timerRef.current || n.immediate) {
        scheduleNext();
      }
    });
    return () => {
      unsub();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!notification) return null;

  const message = notification.cause
    ? notification.message + ', syy: ' + toReadableErrorMessage(notification.cause)
    : notification.message;

  const severity = notification.severity ?? 'success';

  return (
    <SnackbarContainer>
      <Notification
        icon={severityIcon[severity]}
        color={severityColor[severity]}
        onClose={dismiss}
        withCloseButton
      >
        {message}
      </Notification>
    </SnackbarContainer>
  );
};

const SnackbarContainer = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1400;
  min-width: 300px;
  max-width: 560px;
`;
