import * as React from 'react';
import styled from 'styled-components';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip';
import { UserExpense } from '../../../shared/types/Expense';
import { ExpenseRowContainer } from './ExpenseHelper';
import { colorScheme } from '../Colors';

export type ExpenseFilterFunction = (expense: UserExpense) => boolean;

export interface ExpenseFilter {
  filter: ExpenseFilterFunction;
  name: string;
  avatar?: string;
}

interface ExpenseFilterRowProps {
  filters: ExpenseFilter[];
  onRemoveFilter: (index: number) => void;
}

export default class ExpenseFilterRow extends React.Component<ExpenseFilterRowProps, {}> {
  public render() {
    if (this.props.filters.length === 0) { return null; }
    return (
      <ExpenseRowContainer>
        <FilterArea>{
          this.props.filters.map((f, index) => (
            <ExpenseFilterItem filter={f} index={index} key={index} onRemove={this.props.onRemoveFilter} />
          ))}
        </FilterArea>
      </ExpenseRowContainer>
    );
  }
}

class ExpenseFilterItem extends React.Component<{ filter: ExpenseFilter, index: number, onRemove: (index: number) => void }, {}> {
  private onRemove = () => {
    this.props.onRemove(this.props.index);
  }
  public render() {
    const f = this.props.filter;
    return (
      <Chip
        style={chipStyle}
        backgroundColor={colorScheme.primary.standard}
        labelColor={colorScheme.secondary.dark}
        onRequestDelete={this.onRemove}>
        {f.avatar ? <Avatar src={f.avatar} /> : null}
        {f.name}
      </Chip>
    );
  }
}

const FilterArea = styled.div`
  text-align: center;
  flex-grow: 1;
  align-items: center;

  & > div {
    display: inline-flex !important;
    vertical-align: middle;
  }
`;

const chipStyle: React.CSSProperties = {
  margin: '0.3em',
  padding: 0,
};
