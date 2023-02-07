import styled from 'styled-components';

import { colorScheme } from '../Colors';
import { Row } from '../component/Row';
import { media } from '../Styles';

export const RowElement = styled(Row)`
  column-gap: 4px;
  padding: 0 16px;
  &.root-category {
    background-color: ${colorScheme.primary.dark};
    color: ${colorScheme.primary.text};
    font-weight: bold;
  }
  &.child-category {
    background-color: ${colorScheme.primary.standard};
    color: ${colorScheme.secondary.dark};
  }

  &.inactive {
    background: ${colorScheme.gray.light};
    color: ${colorScheme.gray.veryDark};
  }
`;

export const TextContainer = styled.div`
  &.optional {
    ${media.mobile`
    display: none;
    `}
  }
`;

export const Label = styled(TextContainer)`
  flex: 1;
`;

export const Dates = styled(TextContainer)`
  width: 144px;
  text-align: right;
`;

export const Period = styled(TextContainer)`
  width: 32px;
  white-space: nowrap;
`;

export const Sum = styled(TextContainer)`
  width: 104px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export const Tools = styled(TextContainer)`
  width: 32px;
  text-align: right;
`;
