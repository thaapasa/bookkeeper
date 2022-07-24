import ContentAdd from '@mui/icons-material/Add';
import AddCircleSVG from '@mui/icons-material/AddCircle';
import AttachMoneySVG from '@mui/icons-material/AttachMoney';
import AutoRenewSVG from '@mui/icons-material/Autorenew';
import ChevronLeftSVG from '@mui/icons-material/ChevronLeft';
import ChevronRightSVG from '@mui/icons-material/ChevronRight';
import ClearSVG from '@mui/icons-material/Clear';
import DeleteSVG from '@mui/icons-material/Delete';
import EditSVG from '@mui/icons-material/Edit';
import ExpandLessSVG from '@mui/icons-material/ExpandLess';
import ExpandMoreSVG from '@mui/icons-material/ExpandMore';
import FileCopySVG from '@mui/icons-material/FileCopy';
import MenuIconSVG from '@mui/icons-material/Menu';
import PaymentSVG from '@mui/icons-material/Payment';
import RedoSVG from '@mui/icons-material/Redo';
import RefreshSVG from '@mui/icons-material/Refresh';
import RepeatSVG from '@mui/icons-material/Repeat';
import SearchSVG from '@mui/icons-material/Search';
import TodaySVG from '@mui/icons-material/Today';
import { SvgIconProps } from '@mui/material/SvgIcon';
import * as React from 'react';

import { ExpenseType } from 'shared/types/Expense';

import * as colors from './Colors';

const styles = {
  tool: {
    padding: '9px 4px',
    width: '22px',
    height: '22px',
  },
};

export const Today = TodaySVG;
export const Income = AttachMoneySVG;
export const Expense = PaymentSVG;
export const Transfer = RedoSVG;
export const NavigateLeft = ChevronLeftSVG;
export const NavigateRight = ChevronRightSVG;
export const Edit = EditSVG;
export const Delete = DeleteSVG;
export const ExpandLess = ExpandLessSVG;
export const ExpandMore = ExpandMoreSVG;
export const Repeat = RepeatSVG;
export const Clear = ClearSVG;
export const Add = ContentAdd;
export const Search = SearchSVG;
export const PlusCircle = AddCircleSVG;
export const Refresh = RefreshSVG;
export const Recurring = AutoRenewSVG;
export const MenuIcon = MenuIconSVG;
export const Copy = FileCopySVG;

export function ExpenseTypeIcon(props: {
  type: ExpenseType;
  size?: number;
  color?: string;
}): any {
  const style = { width: props.size, height: props.size, color: props.color };
  switch (props.type) {
    case 'expense':
      return <Expense style={style} />;
    case 'income':
      return <Income style={style} />;
    case 'transfer':
      return <Transfer style={style} />;
    default:
      return null;
  }
}

export function ToolIcon(props: {
  icon: React.ComponentType<SvgIconProps>;
  color?: string | null;
  title: string;
  style?: React.CSSProperties;
  className?: string;
  onClick: () => void;
}) {
  const { icon, ...rest } = props;
  const Type = icon;
  return (
    <Type
      {...rest}
      color="action"
      style={{
        ...styles.tool,
        ...props.style,
        color: props.color || undefined,
      }}
    />
  );
}

export class QuestionBookmark extends React.Component<{ size: number }> {
  public render() {
    const color = colors.colorScheme.secondary.light;
    const questionColor = colors.colorScheme.secondary.dark;
    const height = this.props.size;
    const width = (height * 14.0) / 18;
    return (
      <svg width={width + 'px'} height={height + 'px'} viewBox="0 0 14 18">
        <path
          d="M14,2 L14,18 L7,15 L0,18 L0.006875,7 L0,7 L0,0 L14,0 L14,2 Z"
          fill={color}
        />
        <path
          d="M6.25,12 L7.75,12 L7.75,10.5 L6.25,10.5 L6.25,12 Z M7,3 C5.3425,3 4,4.3425 4,6 L5.5,6 C5.5,5.175 6.175,4.5 7,4.5 C7.825,4.5 8.5,5.175 8.5,6 C8.5,7.5 6.25,7.3125 6.25,9.75 L7.75,9.75 C7.75,8.0625 10,7.875 10,6 C10,4.3425 8.6575,3 7,3 Z"
          fill={questionColor}
        />
      </svg>
    );
  }
}
