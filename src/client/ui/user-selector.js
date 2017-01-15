"use strict";

import React from 'react';
import Avatar from 'material-ui/Avatar';
import * as state from "../data/state";
import {
    blueGrey200, blueGrey900,
    cyan500, cyan900
} from 'material-ui/styles/colors';

const styles = {
    container: {
        display: "inline-block"
    },
    avatar: {
        margin: "0 0.2em"
    }
};

const colors = {
    avatar: {
        bg: {
            selected: cyan500,
            notSelected: blueGrey200
        },
        fg: {
            selected: cyan900,
            notSelected: blueGrey900
        }
    }
};

export default class UserSelector extends React.Component {

    constructor(props) {
        super(props);
        this.style = Object.assign({}, styles.container, props.style);
        this.switchSelection = this.switchSelection.bind(this);
    }

    switchSelection(id) {
        const oldS = this.props.selected;
        const foundAt = oldS.indexOf(id);
        const newS = foundAt >= 0 ? oldS.slice().filter(i => i != id) : oldS.slice();
        if (foundAt < 0) newS.push(id);
        newS.sort();
        this.props.onChange && this.props.onChange(newS);
    }

    render() {
        const users = state.get("users");
        return <div style={this.style}>
            { users.map(u =>
                <Avatar key={u.id}
                        style={styles.avatar}
                        color={this.props.selected.includes(u.id) ? colors.avatar.fg.selected : colors.avatar.fg.notSelected}
                        backgroundColor={this.props.selected.includes(u.id) ? colors.avatar.bg.selected : colors.avatar.bg.notSelected}
                        onClick={x => this.switchSelection(u.id)}>{u.firstName.charAt(0)}</Avatar>) }
        </div>
    }
}
