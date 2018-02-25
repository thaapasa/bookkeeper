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
