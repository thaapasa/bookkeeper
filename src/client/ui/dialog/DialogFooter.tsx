import { Button, Group } from '@mantine/core';
import * as React from 'react';

type DialogFooterProps = {
  onCancel: () => void;
  /** When omitted, the footer renders cancel-only (plus any custom children). */
  onOk?: () => void;
  okLabel?: string;
  okDisabled?: boolean;
  /** Render the primary button as a submit button for the given form id, instead of onOk. */
  okSubmitForm?: string;
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
  okSubmitForm,
  handleKeyPress,
  children,
}) => (
  <Group justify="flex-end" gap="xs" pt="md" wrap="wrap">
    <Button type="button" variant="subtle" onKeyUp={handleKeyPress} onClick={onCancel}>
      Peruuta
    </Button>
    {children}
    {onOk || okSubmitForm ? (
      <Button
        type={okSubmitForm ? 'submit' : 'button'}
        form={okSubmitForm}
        variant="filled"
        onKeyUp={handleKeyPress}
        disabled={okDisabled}
        onClick={onOk}
      >
        {okLabel}
      </Button>
    ) : null}
  </Group>
);
