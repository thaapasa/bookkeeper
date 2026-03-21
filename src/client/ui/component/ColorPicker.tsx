import styled from '@emotion/styled';
import { ActionIcon, DEFAULT_THEME } from '@mantine/core';
import * as React from 'react';

import { neutral } from '../Colors';
import { useToggle } from '../hooks/useToggle';
import { Icons } from '../icons/Icons';
import { FlexColumn, FlexRow } from './BasicElements';
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
  const [open, toggle] = useToggle();
  const [shade, setShade] = React.useState<number>(defaultShadeIdx);
  return (
    <>
      <FlexRow className="vcenter">
        <ColorBall color={value} onClick={toggle} title={value} className="example" />
        {open ? <TextEdit value={value} onChange={onChange} /> : value}
      </FlexRow>
      {open ? (
        <FlexRow className="vcenter">
          <FlexColumn>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => setShade(shade > 0 ? shade - 1 : shade)}
            >
              <Icons.SortUp fontSize="small" />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => setShade(shade < shadeIndices.length - 1 ? shade + 1 : shade)}
            >
              <Icons.SortDown fontSize="small" />
            </ActionIcon>
          </FlexColumn>
          <ColorOptions>
            {colorNames.map(name => {
              const col = DEFAULT_THEME.colors[name][shadeIndices[shade]];
              return <ColorBall color={col} key={name} onClick={() => onChange(col)} />;
            })}
          </ColorOptions>
        </FlexRow>
      ) : null}
    </>
  );
};

const ColorBall = styled.div`
  display: inline-flex;
  border: 1px solid ${neutral[3]};
  border-radius: 50%;
  width: 24px;
  height: 24px;

  &.example {
    width: 32px;
    height: 32px;
    margin-right: 8px;
  }
  ${({ color }: { color: string }) => `
    background-color: ${color};
  `};
`;

const ColorOptions = styled.div`
  display: inline-grid;
  flex: 1;
  grid-template-columns: repeat(auto-fill, 28px);
  row-gap: 4px;
  column-gap: 4px;
  margin: 16px 0;
`;
