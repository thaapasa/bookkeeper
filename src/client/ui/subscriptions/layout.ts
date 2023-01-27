import styled from 'styled-components';

import { colorScheme } from '../Colors';
import { Row } from '../component/Row';

export const RowElement = styled(Row)`
  column-gap: 4px;
  padding: 8px;
  &.root-category {
    background-color: ${colorScheme.primary.dark};
    color: ${colorScheme.primary.text};
    font-weight: bold;
  }
  &.child-category {
    background-color: ${colorScheme.primary.standard};
    color: ${colorScheme.secondary.dark};
  }
`;

export const Label = styled.div`
  flex: 1;
`;

export const Period = styled.div`
  width: 64px;
  white-space: nowrap;
`;

export const Sum = styled.div`
  width: 128px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;
