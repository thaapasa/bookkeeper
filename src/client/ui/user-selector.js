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
        this.state = {
            users: state.get("users"),
            selected: {}
        };
        props.selected && props.selected.forEach(p => this.state.selected[p] = true);
        this.switchSelection = this.switchSelection.bind(this);
    }

    switchSelection(id) {
        const s = this.state.selected;
        s[id] = !s[id];
        this.setState({ selected: s });
        this.props.onChange && this.props.onChange(Object.keys(s).filter(id => s[id]).map(i => parseInt(i, 10)));
    }

    render() {
        return <div style={this.style}>
            { this.state.users.map(u =>
                <Avatar key={u.id}
                        style={styles.avatar}
                        color={this.state.selected[u.id] ? colors.avatar.fg.selected : colors.avatar.fg.notSelected}
                        backgroundColor={this.state.selected[u.id] ? colors.avatar.bg.selected : colors.avatar.bg.notSelected}
                        onClick={x => this.switchSelection(u.id)}>{u.firstName.charAt(0)}</Avatar>) }
        </div>
    }
}
