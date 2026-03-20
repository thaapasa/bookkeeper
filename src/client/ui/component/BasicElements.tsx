import styled from '@emotion/styled';

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  box-sizing: border-box;

  &.vcenter {
    align-items: center;
  }
`;

export const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
`;
