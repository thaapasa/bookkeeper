import * as React from 'react';
import styled from 'styled-components';
import { Button } from '@material-ui/core';
import {
  RangeType,
  DateRangeSelectorProps,
  RangeTypeOrNone,
  toYearRange,
  toMonthRange,
} from './Common';
import { YearSelector } from './YearSelector';
import { TypedDateRange, toMoment, compareDates } from 'shared/util/Time';
import { useCompare } from 'client/ui/utils/Hooks';
import { MonthSelector } from './MonthSelector';

interface TabPanelProps {
  children?: React.ReactNode;
  type: RangeType;
  selected: RangeTypeOrNone;
}

function TabPanel(props: TabPanelProps) {
  const { children, type, selected, ...other } = props;

  return (
    <Panel className={type !== selected ? 'hidden' : ''} {...other}>
      {children}
    </Panel>
  );
}

function getRangeDefault(
  type: RangeTypeOrNone,
  current?: TypedDateRange
): TypedDateRange | undefined {
  switch (type) {
    case 'none':
      return;
    case 'year':
      return toYearRange(toMoment(current && current.start).year());
    case 'month': {
      const cur = toMoment(current && current.start);
      return toMonthRange(cur.year(), cur.month() + 1);
    }
    default:
      return;
  }
}

const DateRangeSelectorImpl = (props: DateRangeSelectorProps) => {
  const { onSelectRange, dateRange } = props;
  const [selectedType, changeType] = React.useState<RangeType | 'none'>(
    props.dateRange ? props.dateRange.type : 'none'
  );
  const selectedChanged = useCompare(selectedType);
  React.useEffect(
    () =>
      selectedChanged
        ? onSelectRange(getRangeDefault(selectedType, dateRange))
        : undefined,
    [selectedChanged, selectedType, onSelectRange, dateRange]
  );
  return (
    <Container>
      <Tabs>
        <Tab>
          <TabButton onClick={() => changeType('none')}>Kaikki</TabButton>
          <TabButton onClick={() => changeType('year')}>Vuosi</TabButton>
          <TabButton onClick={() => changeType('month')}>Kuukausi</TabButton>
        </Tab>
      </Tabs>
      <TabPanel selected={selectedType} type="year">
        <YearSelector {...props} />
      </TabPanel>
      <TabPanel selected={selectedType} type="month">
        <MonthSelector {...props} />
      </TabPanel>
    </Container>
  );
};

export const DateRangeSelector = React.memo(
  DateRangeSelectorImpl,
  (prev, next) =>
    (prev.dateRange && prev.dateRange.type) ===
      (next.dateRange && next.dateRange.type) &&
    compareDates(
      prev.dateRange && prev.dateRange.start,
      next.dateRange && next.dateRange.start
    ) === 0 &&
    compareDates(
      prev.dateRange && prev.dateRange.end,
      next.dateRange && next.dateRange.end
    ) === 0
);

const Container = styled.div`
  display: block;
`;

const Panel = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 4px;
  &.hidden {
    display: none;
  }
`;

const Tabs = styled.div`
  display: flex;
  flex-direction: row;
`;

const Tab = styled.div``;

const TabButton = styled(Button)`
  text-transform: none;
  padding: 4px 6px;
`;
