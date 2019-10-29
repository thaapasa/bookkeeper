import * as React from 'react';
import styled from 'styled-components';
import {
  TypedDateRange,
  toMoment,
  displayDatePattern,
  toMonthName,
} from 'shared/util/Time';
import { Button, TextField, IconButton } from '@material-ui/core';
import { NavigateLeft, NavigateRight } from '../Icons';
import { noop } from '../../../shared/util/Util';

type RangeType = TypedDateRange['type'];

interface DateRangeSelectorProps {
  dateRange?: TypedDateRange;
  onSelectRange: (range: TypedDateRange) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  type: RangeType;
  selected: RangeType | 'none';
}

function TabPanel(props: TabPanelProps) {
  const { children, type, selected, ...other } = props;

  return (
    <Panel className={type !== selected ? 'hidden' : ''} {...other}>
      {children}
    </Panel>
  );
}

export function DateRangeSelector(props: DateRangeSelectorProps) {
  const [selectedType, changeType] = React.useState<RangeType | 'none'>(
    props.dateRange ? props.dateRange.type : 'none'
  );
  const defRange = selectedType === 'year' ? 'year' : 'month';
  const start = props.dateRange
    ? toMoment(props.dateRange.start)
    : toMoment().startOf(defRange);
  const end = props.dateRange
    ? toMoment(props.dateRange.end)
    : toMoment().endOf(defRange);
  console.log('Value is', selectedType);
  return (
    <Container>
      <Tabs>
        <Tab>
          <TabButton onClick={() => changeType('none')}>Kaikki</TabButton>
          <TabButton onClick={() => changeType('year')}>Vuosi</TabButton>
          <TabButton onClick={() => changeType('month')}>Kuukausi</TabButton>
          <TabButton onClick={() => changeType('custom')}>Muokattu</TabButton>
        </Tab>
      </Tabs>
      <TabPanel selected={selectedType} type="year">
        <StyledIconButton onClick={noop} title="Edellinen">
          <NavigateLeft color="primary" />
        </StyledIconButton>
        <NumberInput
          value={start.year()}
          label="Vuosi"
          variant="filled"
          InputLabelProps={{ shrink: true }}
        />
        <StyledIconButton onClick={noop} title="Seuraava">
          <NavigateRight color="primary" />
        </StyledIconButton>
      </TabPanel>
      <TabPanel selected={selectedType} type="month">
        {toMonthName(start)}
      </TabPanel>
      <TabPanel selected={selectedType} type="custom">
        {start.format(displayDatePattern)} - {end.format(displayDatePattern)}
      </TabPanel>
    </Container>
  );
}

const Container = styled.div`
  display: block;
`;

const Panel = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
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

const NumberInput = styled(TextField)`
  width: 80px;
`;

const StyledIconButton = styled(IconButton)`
  padding: 0;
  margin: 0 4px;
`;
