import { styled } from '@mui/material';

export const FlexRow = styled('div')`
  display: flex;
  flex-direction: row;
  box-sizing: border-box;

  &.vcenter {
    align-items: center;
  }
`;

export const FlexColumn = styled('div')`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
`;
