import { Avatar, Chip, styled } from '@mui/material';
import * as React from 'react';

import { colorScheme } from 'client/ui/Colors';

import { ExpenseFilter } from './ExpenseFilters';
import { AllColumns, Row } from './ExpenseTableLayout';

interface ExpenseFilterRowProps {
  filters: ExpenseFilter[];
  onRemoveFilter: (index: number) => void;
}

export class ExpenseFilterRow extends React.Component<ExpenseFilterRowProps> {
  public render() {
    if (this.props.filters.length === 0) {
      return null;
    }
    return (
      <Row>
        <FilterArea>
          {this.props.filters.map((f, index) => (
            <ExpenseFilterItem
              filter={f}
              index={index}
              key={`filter-${index}`}
              onRemove={this.props.onRemoveFilter}
            />
          ))}
        </FilterArea>
      </Row>
    );
  }
}

const chipStyle: React.CSSProperties = {
  margin: '0.3em',
  padding: 0,
  backgroundColor: colorScheme.primary.standard,
  color: colorScheme.secondary.dark,
};

class ExpenseFilterItem extends React.Component<{
  filter: ExpenseFilter;
  index: number;
  onRemove: (index: number) => void;
}> {
  private onRemove = () => {
    this.props.onRemove(this.props.index);
  };
  public render() {
    const f = this.props.filter;
    return (
      <Chip
        style={chipStyle}
        onDelete={this.onRemove}
        label={f.name}
        avatar={f.avatar ? <Avatar src={f.avatar} /> : undefined}
      />
    );
  }
}

const FilterArea = styled(AllColumns)`
  text-align: center;
  flex-grow: 1;
  align-items: center;

  & > div {
    display: inline-flex !important;
    vertical-align: middle;
  }
`;
