import { Button, Group } from '@mantine/core';
import * as React from 'react';

type DialogFooterProps = {
  onCancel: () => void;
  /** When omitted, the footer renders cancel-only (plus any custom children). */
  onOk?: () => void;
  okLabel?: string;
  okDisabled?: boolean;
  handleKeyPress?: (event: React.KeyboardEvent<any>) => void;
  /** Extra action buttons rendered between Peruuta and OK. */
  children?: React.ReactNode;
};

/**
 * Shared footer for modal dialog contents: right-aligned Peruuta + optional
 * primary action. All dialog content renderers should use this instead of
 * hand-rolling the button row.
 */
export const DialogFooter: React.FC<DialogFooterProps> = ({
  onCancel,
  onOk,
  okLabel = 'OK',
  okDisabled,
  handleKeyPress,
  children,
}) => (
  <Group justify="flex-end" gap="xs" pt="md" wrap="wrap">
    <Button variant="subtle" onKeyUp={handleKeyPress} onClick={onCancel}>
      Peruuta
    </Button>
    {children}
    {onOk ? (
      <Button variant="filled" onKeyUp={handleKeyPress} disabled={okDisabled} onClick={onOk}>
        {okLabel}
      </Button>
    ) : null}
  </Group>
);
