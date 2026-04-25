import { Chip, ChipProps } from '@mantine/core';
import React, { forwardRef } from 'react';

import { Icons } from '../icons/Icons';

export type TagVariant = 'primary' | 'default';

type BaseProps = Omit<
  ChipProps,
  'variant' | 'color' | 'checked' | 'onChange' | 'children' | 'icon'
>;

export type TagProps = BaseProps & {
  /** Color treatment for non-selectable tags. `primary` = filled accent (cyan),
   *  `default` = neutral surface. Selectable tags always use the accent color. */
  variant?: TagVariant;
  /** Renders as a toggleable chip: outlined when unselected, filled accent when selected. */
  selectable?: boolean;
  /** Current selection state when `selectable`. */
  selected?: boolean;
  /** Called when an unselected selectable tag is clicked. */
  onSelect?: () => void;
  /** Called when a selectable tag is toggled off, or when a non-selectable removable tag
   *  is clicked. Omit to render a read-only label. */
  onRemove?: () => void;
  children: React.ReactNode;
};

export const Tag = forwardRef<HTMLInputElement, TagProps>(function Tag(
  {
    variant = 'default',
    selectable = false,
    selected = false,
    onSelect,
    onRemove,
    children,
    ...props
  },
  ref,
) {
  if (selectable) {
    return (
      <Chip
        ref={ref}
        checked={selected}
        onChange={checked => (checked ? onSelect?.() : onRemove?.())}
        variant={selected ? 'filled' : 'outline'}
        color="primary"
        {...props}
      >
        {children}
      </Chip>
    );
  }

  const removable = !!onRemove;
  return (
    <Chip
      ref={ref}
      checked
      readOnly={!removable}
      onChange={removable ? () => onRemove?.() : undefined}
      icon={removable ? <Icons.Clear size={12} /> : null}
      variant="filled"
      color={variant === 'primary' ? 'primary' : 'neutral'}
      style={removable ? undefined : { cursor: 'default' }}
      {...props}
    >
      {children}
    </Chip>
  );
});
