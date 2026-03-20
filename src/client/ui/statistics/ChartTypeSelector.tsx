import { Tooltip } from '@mantine/core';
import { ActionIcon } from '@mantine/core';
import * as React from 'react';

import { Icon, RenderIcon } from '../icons/Icons';
import { StatisticsChartType } from './types';

type TypeInfo = {
  title: string;
  icon: Icon;
};

const TypeInfo: Record<StatisticsChartType, TypeInfo> = {
  years: { title: 'Vuodet', icon: 'CalendarEmpty' },
  seasons: { title: 'Vuodenajat', icon: 'Sun' },
  quarters: { title: 'Kvartaalit', icon: 'PieChart' },
  months: { title: 'Kuukaudet', icon: 'Calendar' },
  recurring: { title: 'Vuositoisto', icon: 'CalendarRepeat' },
};

export const StatisticsChartTypeSelector: React.FC<{
  selected: StatisticsChartType;
  onChange: (type: StatisticsChartType) => void;
  row?: boolean;
}> = ({ selected, onChange }) => (
  <>
    {StatisticsChartType.options.map(type => (
      <Tooltip key={type} label={TypeInfo[type].title}>
        <ActionIcon variant="subtle" onClick={() => onChange(type)}>
          <RenderIcon icon={TypeInfo[type].icon} color={selected === type ? 'primary' : 'action'} />
        </ActionIcon>
      </Tooltip>
    ))}
  </>
);
