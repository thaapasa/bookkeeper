import styled from '@emotion/styled';
import { Avatar, Pill } from '@mantine/core';
import * as React from 'react';

import { neutral, primary } from 'client/ui/Colors';

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
  padding: '4px 8px',
  backgroundColor: neutral[2],
  color: primary[7],
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
      <Pill
        style={chipStyle}
        withRemoveButton
        onRemove={this.onRemove}
      >
        {f.avatar ? <Avatar src={f.avatar} size="xs" /> : null}
        {f.name}
      </Pill>
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
