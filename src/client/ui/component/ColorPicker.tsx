import styled from '@emotion/styled';
import { colors, IconButton } from '@mui/material';
import * as React from 'react';

import { typedKeys } from 'shared/util';

import { colorScheme } from '../Colors';
import { useToggle } from '../hooks/useToggle';
import { Icons } from '../icons/Icons';
import { FlexColumn, FlexRow } from './BasicElements';
import { TextEdit } from './TextEdit';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const allColors = typedKeys(colors);
const colorPalette = typedKeys(colors.amber);

const defaultPaletteIdx = 4;

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const [open, toggle] = useToggle();
  const [palette, setPalette] = React.useState<number>(defaultPaletteIdx);
  return (
    <>
      <FlexRow className="vcenter">
        <ColorBall color={value} onClick={toggle} title={value} className="example" />
        {open ? <TextEdit value={value} onChange={onChange} /> : value}
      </FlexRow>
      {open ? (
        <FlexRow className="vcenter">
          <FlexColumn>
            <IconButton
              size="small"
              onClick={() => setPalette(palette > 0 ? palette - 1 : palette)}
            >
              <Icons.SortUp fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setPalette(palette < colorPalette.length - 1 ? palette + 1 : palette)}
            >
              <Icons.SortDown fontSize="small" />
            </IconButton>
          </FlexColumn>
          <ColorOptions>
            {allColors.map(c => {
              const col = (colors as any)[c][colorPalette[palette]];
              return <ColorBall color={col} key={c} onClick={() => onChange(col)} />;
            })}
          </ColorOptions>
        </FlexRow>
      ) : null}
    </>
  );
};

const ColorBall = styled('div')`
  display: inline-flex;
  border: 1px solid ${colorScheme.gray.standard};
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

const ColorOptions = styled('div')`
  display: inline-grid;
  flex: 1;
  grid-template-columns: repeat(auto-fill, 28px);
  row-gap: 4px;
  column-gap: 4px;
  margin: 16px 0;
`;
