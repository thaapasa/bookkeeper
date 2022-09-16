import { Button } from '@mui/material';
import * as React from 'react';
import styled from 'styled-components';

import {
  AllPeriods,
  Period,
  periodToYearAndMonth,
  PeriodType,
} from 'shared/time';
import { colorScheme } from 'client/ui/Colors';

import { Column } from '../BasicElements';
import { MonthSelector } from './MonthSelector';
import { YearSelector } from './YearSelector';

export interface PeriodSelectorProps<P extends Period> {
  period: P;
  onSelect: (period: P) => void;
  allowed?: P['type'][];
}

export const PeriodSelector: React.FC<PeriodSelectorProps<any>> = <
  P extends Period
>({
  period,
  onSelect,
  allowed,
}: PeriodSelectorProps<P>) => {
  const validPeriods: P['type'][] = allowed ?? AllPeriods;

  const [initialYear, initialMonth] = periodToYearAndMonth(period);
  const [year, setYear] = React.useState(initialYear);
  const [month, setMonth] = React.useState(initialMonth);
  const [type, changeType] = React.useState<PeriodType>(period.type);

  const setYearMonth = React.useCallback(
    (year: number, month: number) => {
      setYear(year);
      setMonth(month);
    },
    [setYear, setMonth]
  );

  React.useEffect(
    () => onSelect(valuesToPeriod<P>(type, year, month)),
    [onSelect, type, year, month]
  );

  return (
    <Container>
      <Column>
        <Tab>
          {validPeriods.map(v => (
            <TabButton
              key={v}
              onClick={() => changeType(v)}
              selected={type === v}
            >
              {PeriodTitles[v]}
            </TabButton>
          ))}
        </Tab>
      </Column>
      {type === 'year' ? (
        <TabPanel type="year">
          <YearSelector year={year} onSelect={setYear} />
        </TabPanel>
      ) : null}
      {type === 'month' ? (
        <TabPanel type="month">
          <MonthSelector year={year} month={month} onSelect={setYearMonth} />
        </TabPanel>
      ) : null}
    </Container>
  );
};

function valuesToPeriod<P extends Period>(
  type: P['type'],
  year: number,
  month: number
): P {
  switch (type) {
    case 'month':
      return { type, year, month } as P;
    case 'year':
      return { type, year } as P;
    default:
      return { type } as P;
  }
}

const PeriodTitles: Record<PeriodType, string> = {
  all: 'Kaikki',
  now: 'Nyt',
  year: 'Vuosi',
  month: 'Kuu',
};

interface TabPanelProps {
  type: PeriodType;
  className?: string;
}

const TabPanel: React.FC<React.PropsWithChildren<TabPanelProps>> = ({
  children,
  type,
  className,
  ...other
}) => (
  <Panel className={className} {...other}>
    {children}
  </Panel>
);

const Container = styled(Column)`
  display: flex;
  min-width: 188px;
  white-space: nowrap;
`;

const Panel = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 4px;
`;

const Tab = styled.div``;

const TabButton = styled(Button)`
  text-transform: none;
  padding: 4px 6px;
  ${(props: { selected?: boolean }) =>
    props.selected
      ? `border: 1px dotted ${colorScheme.secondary.light};
         background-color: ${colorScheme.secondary.light}77;
         color: ${colorScheme.secondary.text}`
      : ''};
`;
