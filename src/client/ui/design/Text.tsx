import {
  createPolymorphicComponent,
  Text,
  TextProps,
  Title as MantineTitle,
  TitleProps as MantineTitleProps,
} from '@mantine/core';
import React, { forwardRef } from 'react';

type ElementProps = React.PropsWithChildren<TextProps>;

export type TitleProps = MantineTitleProps & { noBorder?: boolean };

export const Title: React.FC<TitleProps> = ({ order = 1, noBorder, ...props }) => (
  <MantineTitle
    order={order}
    mb={noBorder ? undefined : 'md'}
    pb={noBorder ? undefined : 4}
    style={noBorder ? undefined : { borderBottom: '1px solid var(--mantine-color-neutral-3)' }}
    {...props}
  />
);

export const Subtitle: React.FC<TitleProps> = ({ order = 2, noBorder, ...props }) => (
  <MantineTitle
    order={order}
    mb={noBorder ? undefined : 'xs'}
    pb={noBorder ? undefined : 2}
    style={noBorder ? undefined : { borderBottom: '1px solid var(--mantine-color-neutral-1)' }}
    {...props}
  />
);

/** Accent-colored label for data sections and summary blocks */
export const SectionLabel = createPolymorphicComponent<'p', ElementProps>(
  forwardRef<HTMLParagraphElement, ElementProps>(function SectionLabel(props, ref) {
    return <Text fz="sm" fw={600} c="primary.7" {...props} ref={ref} />;
  }),
);

/** Inline bold numeric/money value, typically right-aligned with fixed width */
export const DataValue = createPolymorphicComponent<'p', ElementProps>(
  forwardRef<HTMLParagraphElement, ElementProps>(function DataValue(props, ref) {
    return <Text fw="bold" ta="right" display="inline-block" {...props} ref={ref} />;
  }),
);

/** Heading for modal dialog content (replaces raw h3 tags) */
export const DialogHeading: React.FC<TitleProps> = ({ order = 3, ...props }) => (
  <MantineTitle order={order} mb="md" fw={500} {...props} />
);

/** Small, dimmed secondary text for descriptions and captions */
export const Caption = createPolymorphicComponent<'p', ElementProps>(
  forwardRef<HTMLParagraphElement, ElementProps>(function Caption(props, ref) {
    return <Text fz="sm" c="dimmed" {...props} ref={ref} />;
  }),
);
