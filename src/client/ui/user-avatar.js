"use strict";

import React from 'react';
import Avatar from 'material-ui/Avatar';
import * as state from "../data/state";
import {cyan500, cyan900} from 'material-ui/styles/colors';

export default class UserAvatar extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const user = state.get("userMap")[this.props.userId];
        return user && user.id ?
            <Avatar style={this.props.style}
                    color={cyan900}
                    size={this.props.size}
                    backgroundColor={cyan500}
                    className={ "user-avatar" + (this.props.className ? " " + this.props.className : "") }
                    src={ user.image || undefined }
                    title={ `${user.firstName} ${user.lastName}` }
                    onClick={x => this.props.onClick && this.props.onClick(user.id)}>{ user.image ? undefined : user.firstName.charAt(0)}</Avatar>
            : <div />
    }
}
