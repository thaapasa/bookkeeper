import * as React from 'react';
import { TypedDateRange, toMoment, getFinnishMonthName } from "../../../shared/util/Time";
import { NavigateLeft, NavigateRight } from "../Icons";
import styled from 'styled-components';

const Container = styled.div`
  width: 100%;
  display: flex;
  height: 40pt;
  align-items: center;
`;

const Icon = styled.div`
  padding: 10pt;
`;

const Label = styled.div`
  text-align: center;
  flex: 1;
`;

export interface RangeProps {
  range: TypedDateRange;
  onNavigate: (date: Date) => void;
}

export class YearSelector extends React.PureComponent<RangeProps, {}> {
  private left = () => this.props.onNavigate(toMoment(this.props.range.start).clone().subtract(1, 'year').toDate());
  private right = () => this.props.onNavigate(toMoment(this.props.range.start).clone().add(1, 'year').toDate());
  public render() {
    return (
      <Container>
        <Icon><NavigateLeft onClick={this.left} /></Icon>
        <Label>Vuosi {toMoment(this.props.range.start).format('YYYY')}</Label>
        <Icon><NavigateRight onClick={this.right} /></Icon>
      </Container>
    );
  }
}

export class MonthSelector extends React.PureComponent<RangeProps, {}> {
  private left = () => this.props.onNavigate(toMoment(this.props.range.start).clone().subtract(1, 'month').toDate());
  private right = () => this.props.onNavigate(toMoment(this.props.range.start).clone().add(1, 'month').toDate());
  public render() {
    const s = toMoment(this.props.range.start);
    return (
      <Container>
        <Icon><NavigateLeft onClick={this.left} /></Icon>
        <Label>{getFinnishMonthName(s)} {s.format('YYYY')}</Label>
        <Icon><NavigateRight onClick={this.right}/></Icon>
      </Container>
    );
  }
}

export function RangeSelector(props: RangeProps) {
  switch (props.range.type) {
    case 'year': return <YearSelector {...props} />;
    case 'month': return <MonthSelector {...props} />;
    default: return null;
  }
}
