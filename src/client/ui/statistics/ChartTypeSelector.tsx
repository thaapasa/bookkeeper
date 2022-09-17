import { IconButton, Tooltip } from '@mui/material';
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
      <Tooltip key={type} title={TypeInfo[type].title} arrow>
        <IconButton onClick={() => onChange(type)} title={TypeInfo[type].title}>
          <RenderIcon
            icon={TypeInfo[type].icon}
            color={selected === type ? 'primary' : 'action'}
          />
        </IconButton>
      </Tooltip>
    ))}
  </>
);
