import * as React from 'react';
import PaymentSVG from 'material-ui/svg-icons/action/payment';
import AttachMoneySVG from 'material-ui/svg-icons/editor/attach-money';
import ChevronLeftSVG from 'material-ui/svg-icons/navigation/chevron-left';
import ChevronRightSVG from 'material-ui/svg-icons/navigation/chevron-right';
import ExpandLessSVG from 'material-ui/svg-icons/navigation/expand-less';
import ExpandMoreSVG from 'material-ui/svg-icons/navigation/expand-more';
import DeleteSVG from 'material-ui/svg-icons/action/delete';
import EditSVG from 'material-ui/svg-icons/image/edit';
import RepeatSVG from 'material-ui/svg-icons/av/repeat';
import LibraryAdd from 'material-ui/svg-icons/av/library-add';
import IconButton from 'material-ui/IconButton';
import AddCircleSVG from 'material-ui/svg-icons/content/add-circle';
import AutoRenewSVG from 'material-ui/svg-icons/action/autorenew';
import * as colors from './Colors';

const styles = {
  tool: {
    padding: '9px 4px',
    width: '22px',
    height: '22px',
  },
};

export const Income = AttachMoneySVG;
export const Expense = PaymentSVG;
export const NavigateLeft = ChevronLeftSVG;
export const NavigateRight = ChevronRightSVG;
export const Edit = EditSVG;
export const Delete = DeleteSVG;
export const ExpandLess = ExpandLessSVG;
export const ExpandMore = ExpandMoreSVG;
export const Repeat = RepeatSVG;
export const Add = LibraryAdd;
export const PlusCircle = AddCircleSVG;
export const Recurring = AutoRenewSVG;

export function ToolIcon(props: {
  icon: any,
  color?: string | null,
  title: string,
  style?: React.CSSProperties,
  className?: string,
  onClick: () => void,
}) {
  return React.createElement(props.icon, {
    ...props,
    color: props.color || colors.tool,
    style: { ...styles.tool, ...props.style },
    icon: undefined,
  });
}

export function ToolButton(props: {
  title: string,
  onClick?: () => void,
  icon: any,
}) {
  return (
    <IconButton
      title={props.title}
      style={styles.tool}
      onClick={props.onClick}>{React.createElement(props.icon, { color: colors.tool }, null)}</IconButton>
  );
}

export class QuestionBookmark extends React.Component<{ size: number }, {}> {
  public render() {
    const color = colors.colorScheme.secondary.light;
    const questionColor = colors.colorScheme.secondary.dark;
    const height = this.props.size;
    const width = height * 14.0 / 18;
    return (
      <svg width={width + 'px'} height={height + 'px'} viewBox="0 0 14 18">
        <path d="M14,2 L14,18 L7,15 L0,18 L0.006875,7 L0,7 L0,0 L14,0 L14,2 Z" fill={color} />
        <path d="M6.25,12 L7.75,12 L7.75,10.5 L6.25,10.5 L6.25,12 Z M7,3 C5.3425,3 4,4.3425 4,6 L5.5,6 C5.5,5.175 6.175,4.5 7,4.5 C7.825,4.5 8.5,5.175 8.5,6 C8.5,7.5 6.25,7.3125 6.25,9.75 L7.75,9.75 C7.75,8.0625 10,7.875 10,6 C10,4.3425 8.6575,3 7,3 Z" fill={questionColor} />
      </svg>
    );
  }
}
