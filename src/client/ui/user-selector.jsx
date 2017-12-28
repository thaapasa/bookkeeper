"use strict";

import * as React from 'react';
import UserAvatar from './user-avatar';
import * as state from "../data/state";

const styles = {
    container: {
        display: "inline-block"
    },
    avatar: {
        margin: "0 0.2em",
        verticalAlign: "top"
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
                <UserAvatar
                    key={u.id}
                    userId={u.id}
                    style={styles.avatar}
                    className={this.props.selected.includes(u.id) ? "selected" : "unselected" }
                    onClick={x => this.switchSelection(u.id)}>{u.firstName.charAt(0)}</UserAvatar>) }
        </div>
    }
}
