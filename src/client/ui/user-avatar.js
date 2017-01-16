"use strict";

import React from 'react';
import Avatar from 'material-ui/Avatar';
import * as state from "../data/state";

export default class UserAvatar extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const user = state.get("userMap")[this.props.userId];
        return user && user.id ?
            <Avatar key={user.id} style={this.props.style}
                    color={this.props.color}
                    backgroundColor={this.props.backgroundColor}
                    src={ user.image || undefined }
                    title={ `${user.firstName} ${user.lastName}` }
                    onClick={x => this.props.onClick && this.props.onClick(user.id)}>{ user.image ? undefined : user.firstName.charAt(0)}</Avatar>
            : <div />
    }
}
