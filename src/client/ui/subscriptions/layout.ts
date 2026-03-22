import styled from '@emotion/styled';

import { neutral, primary, text } from '../Colors';
import { Row } from '../component/Row';
import { media } from '../layout/Styles.ts';

export const RowElement = styled(Row)`
  column-gap: 4px;
  padding: 0 16px;
  &.root-category {
    background-color: ${neutral[4]};
    color: ${text};
    font-weight: bold;
  }
  &.child-category {
    background-color: ${neutral[2]};
    color: ${primary[7]};
  }

  &.inactive {
    background: ${neutral[1]};
    color: ${neutral[7]};
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

  &.large {
    width: 64px;
  }
`;
