import * as React from 'react';
import styled from 'styled-components';
import { TypedDateRange, toMoment } from 'shared/util/Time';
import { Button, TextField, IconButton } from '@material-ui/core';
import { NavigateLeft, NavigateRight } from '../Icons';

type RangeType = TypedDateRange['type'];

interface DateRangeSelectorProps {
  dateRange?: TypedDateRange;
  onSelectRange: (range?: TypedDateRange) => void;
}

interface SelectorProps extends DateRangeSelectorProps {
  selected: RangeType | 'none';
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

function isValidYear(year: string | number): boolean {
  const y = Number(year);
  return (
    String(y) === String(year) && y === Math.round(y) && y > 2000 && y < 2100
  );
}

function toYearRange(year: string | number): TypedDateRange {
  const m = toMoment(year, 'YYYY');
  return {
    type: 'year',
    start: m.startOf('year').toDate(),
    end: m.endOf('year').toDate(),
  };
}

export function YearSelector(props: SelectorProps) {
  const { dateRange, selected, onSelectRange } = props;
  const yearP = toMoment(dateRange ? dateRange.start : undefined).year();
  const [year, setYear] = React.useState<string>(String(yearP));
  React.useEffect(() => setYear(String(yearP)), [yearP]);
  React.useEffect(
    () => (selected === 'year' ? onSelectRange(toYearRange(yearP)) : undefined),
    [selected, onSelectRange, yearP]
  );
  const changeYear = React.useCallback(
    (e: number | React.ChangeEvent<{ value: string }>) => {
      const newYear = typeof e === 'object' ? e.target.value : e;
      setYear(String(newYear));
      if (isValidYear(newYear)) {
        onSelectRange(toYearRange(newYear));
      }
    },
    [setYear, onSelectRange]
  );
  const prev = React.useCallback(() => changeYear(Number(year) - 1), [
    year,
    changeYear,
  ]);
  const next = React.useCallback(() => changeYear(Number(year) + 1), [
    year,
    changeYear,
  ]);
  console.log('Render year selector for', yearP, year, selected);
  return (
    <>
      <StyledIconButton onClick={prev} title="Edellinen">
        <NavigateLeft color="primary" />
      </StyledIconButton>
      <NumberInput
        value={year}
        label="Vuosi"
        variant="filled"
        InputLabelProps={{ shrink: true }}
        onChange={changeYear}
      />
      <StyledIconButton onClick={next} title="Seuraava">
        <NavigateRight color="primary" />
      </StyledIconButton>
    </>
  );
}

export function DateRangeSelector(props: DateRangeSelectorProps) {
  const { onSelectRange } = props;
  const [selectedType, changeType] = React.useState<RangeType | 'none'>(
    props.dateRange ? props.dateRange.type : 'none'
  );
  console.log('Value is', selectedType, '- range is', props.dateRange);
  React.useEffect(
    () => (selectedType === 'none' ? onSelectRange() : undefined),
    [selectedType, onSelectRange]
  );
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
        <YearSelector
          selected={selectedType}
          dateRange={props.dateRange}
          onSelectRange={props.onSelectRange}
        />
      </TabPanel>
      <TabPanel selected={selectedType} type="month">
        Kuu kaudesta kesään
      </TabPanel>
      <TabPanel selected={selectedType} type="custom">
        Kiks koks
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
