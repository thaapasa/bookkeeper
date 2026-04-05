import { ActionIcon, Box, DEFAULT_THEME, Group, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import * as React from 'react';

import { Icons } from '../icons/Icons';
import styles from './ColorPicker.module.css';
import { TextEdit } from './TextEdit';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const colorNames = [
  'gray',
  'red',
  'pink',
  'grape',
  'violet',
  'indigo',
  'blue',
  'cyan',
  'teal',
  'green',
  'lime',
  'yellow',
  'orange',
] as const;

const shadeIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const defaultShadeIdx = 4;

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const [open, { toggle }] = useDisclosure();
  const [shade, setShade] = React.useState<number>(defaultShadeIdx);
  return (
    <>
      <Group align="center" gap="xs">
        <Box
          className={`${styles.colorBall} ${styles.colorBallExample}`}
          style={{ backgroundColor: value }}
          onClick={toggle}
          title={value}
        />
        {open ? <TextEdit value={value} onChange={onChange} /> : value}
      </Group>
      {open ? (
        <Group align="center" gap="xs">
          <Stack gap={0}>
            <ActionIcon size="sm" onClick={() => setShade(shade > 0 ? shade - 1 : shade)}>
              <Icons.SortUp fontSize="small" />
            </ActionIcon>
            <ActionIcon
              size="sm"
              onClick={() => setShade(shade < shadeIndices.length - 1 ? shade + 1 : shade)}
            >
              <Icons.SortDown fontSize="small" />
            </ActionIcon>
          </Stack>
          <Box className={styles.colorOptions}>
            {colorNames.map(name => {
              const col = DEFAULT_THEME.colors[name][shadeIndices[shade]];
              return (
                <Box
                  className={styles.colorBall}
                  style={{ backgroundColor: col }}
                  key={name}
                  onClick={() => onChange(col)}
                />
              );
            })}
          </Box>
        </Group>
      ) : null}
    </>
  );
};
