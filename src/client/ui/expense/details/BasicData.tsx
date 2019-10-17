import * as React from 'react';
import styled from 'styled-components';
import { UserExpense } from '../../../../shared/types/Expense';
import { media } from '../../Styles';
import { Source } from '../../../../shared/types/Session';

interface BasicDataProps {
  expense: UserExpense;
  source: Source;
  fullCategoryName: string;
}

export default class BasicData extends React.Component<BasicDataProps, {}> {
  public render() {
    return (
      <SmallDeviceContainer>
        <DetailRow name="Kohde" value={this.props.expense.receiver} />
        <DetailRow name="Kategoria" value={this.props.fullCategoryName} />
        <DetailRow name="Lähde" value={this.props.source.name} />
      </SmallDeviceContainer>
    );
  }
}

function DetailRow(props: { name: string; value: string }) {
  return (
    <DetailRowContainer>
      <DetailLabel>{props.name + ':'}</DetailLabel>
      {props.value}
    </DetailRowContainer>
  );
}

const SmallDeviceContainer = styled.div`
  display: none;
  padding: 8px 16px;

  ${media.mobilePortrait`
    display: block;
  `}
`;

const DetailRowContainer = styled.div`
  padding: 4px 0;
`;

const DetailLabel = styled.div`
  display: inline-block;
  width: 80px;
`;
