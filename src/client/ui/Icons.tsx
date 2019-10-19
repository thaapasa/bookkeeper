import * as React from 'react';
import PaymentSVG from '@material-ui/icons/Payment';
import AttachMoneySVG from '@material-ui/icons/AttachMoney';
import ChevronLeftSVG from '@material-ui/icons/ChevronLeft';
import ChevronRightSVG from '@material-ui/icons/ChevronRight';
import ExpandLessSVG from '@material-ui/icons/ExpandLess';
import ExpandMoreSVG from '@material-ui/icons/ExpandMore';
import DeleteSVG from '@material-ui/icons/Delete';
import EditSVG from '@material-ui/icons/Edit';
import RepeatSVG from '@material-ui/icons/Repeat';
import ContentAdd from '@material-ui/icons/Add';
import RedoSVG from '@material-ui/icons/Redo';
import AddCircleSVG from '@material-ui/icons/AddCircle';
import AutoRenewSVG from '@material-ui/icons/Autorenew';
import MenuIconSVG from '@material-ui/icons/Menu';
import * as colors from './Colors';
import { ExpenseType } from '../../shared/types/Expense';
import { SvgIconProps } from '@material-ui/core/SvgIcon';

const styles = {
  tool: {
    padding: '9px 4px',
    width: '22px',
    height: '22px',
  },
};

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
export const Add = ContentAdd;
export const PlusCircle = AddCircleSVG;
export const Recurring = AutoRenewSVG;
export const MenuIcon = MenuIconSVG;

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

export class QuestionBookmark extends React.Component<{ size: number }, {}> {
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
