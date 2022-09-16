import AppShortcutIcon from '@mui/icons-material/AppShortcut';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CategoryIcon from '@mui/icons-material/Category';
import ConstructionIcon from '@mui/icons-material/Construction';
import EuroIcon from '@mui/icons-material/Euro';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { SvgIconProps } from '@mui/material';
import React from 'react';

export const Icons = {
  Money: EuroIcon,
  Tools: ConstructionIcon,
  Search: SearchIcon,
  Chart: AutoGraphIcon,
  Category: CategoryIcon,
  Shortcut: AppShortcutIcon,
  Info: InfoIcon,
  Refresh: RefreshIcon,
};

export type Icon = keyof typeof Icons;

export const RenderIcon: React.FC<{ icon?: Icon } & SvgIconProps> = ({
  icon,
  ...props
}) => {
  const Item = icon && Icons[icon];
  return Item ? <Item {...props} /> : null;
};
