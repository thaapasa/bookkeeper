import { styled } from '@mui/system';

import { colorScheme } from '../Colors';
import { FlexRow } from './BasicElements';

export const rowHeight = 40;

export const Row = styled(FlexRow)`
  width: 100%;
  min-height: ${rowHeight}px;
  align-items: center;
  flex-wrap: nowrap;

  &.clickable {
    cursor: pointer;
  }
`;

export const HeaderRow = styled(Row)`
  background-color: ${colorScheme.gray.light};
`;
