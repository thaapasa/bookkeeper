import * as React from 'react';
import styled from 'styled-components';
import { Button } from '@material-ui/core';
import { RangeType, DateRangeSelectorProps } from './Common';
import { YearSelector } from './YearSelector';

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
