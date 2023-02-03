import * as React from 'react';

import { ToolIcon } from '../icons/ToolIcon';

export const ExpanderIcon: React.FC<{
  title: string;
  open: boolean;
  onToggle: (state: boolean) => void;
}> = ({ title, open, onToggle }) => (
  <ToolIcon
    title={title}
    onClick={() => onToggle(!open)}
    icon={open ? 'ExpandLess' : 'ExpandMore'}
  />
);
