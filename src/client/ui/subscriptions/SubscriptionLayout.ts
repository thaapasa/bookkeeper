import styled from 'styled-components';

import { colorScheme } from '../Colors';
import { Row } from '../component/Row';

export const RowElement = styled(Row)`
  padding: 0 8px;
  &.root-category {
    background-color: ${colorScheme.primary.dark};
    color: ${colorScheme.primary.text};
    font-weight: bold;
  }
  &.child-category {
    background-color: ${colorScheme.primary.standard};
    color: ${colorScheme.secondary.dark};
  }
  &.sub-category {
    background-color: ${colorScheme.primary.standard};
  }
`;
