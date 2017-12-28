"use strict";

import * as React from 'react';
import PaymentSVG from "material-ui/svg-icons/action/payment"
import AttachMoneySVG from "material-ui/svg-icons/editor/attach-money"
import ChevronLeftSVG from "material-ui/svg-icons/navigation/chevron-left"
import ChevronRightSVG from "material-ui/svg-icons/navigation/chevron-right"
import ExpandLessSVG from "material-ui/svg-icons/navigation/expand-less"
import ExpandMoreSVG from "material-ui/svg-icons/navigation/expand-more"
import DeleteSVG from "material-ui/svg-icons/action/delete"
import EditSVG from "material-ui/svg-icons/image/edit"
import RepeatSVG from "material-ui/svg-icons/av/repeat"
import LibraryAdd from "material-ui/svg-icons/av/library-add"
import IconButton from "material-ui/IconButton"
import * as colors from "./colors"

const styles = {
    tool: {
        margin: "3pt",
        padding: "4pt 1pt",
        width: "16pt",
        height: "16pt"
    }
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

export function ToolIcon(props) {
    return React.createElement(props.icon, Object.assign({}, props, {
        color: props.color || colors.tool,
        style: Object.assign({}, styles.tool, props.style || {}),
        icon: undefined
    }));
}

function ToolButton(props) {
    return <IconButton
        title={props.title}
        style={styles.tool}
        onClick={props.onClick}>{ React.createElement(props.icon, {color: colors.tool}, null) }</IconButton>
}
