"use strict";

import * as React from 'react';
import Avatar from 'material-ui/Avatar';
import * as state from "../data/state";
import {cyan500, cyan900} from 'material-ui/styles/colors';

export default function UserAvatar(props) {
    const user = state.get("userMap")[props.userId];
    return user && user.id ?
        <Avatar style={props.style}
                color={cyan900}
                size={props.size}
                backgroundColor={cyan500}
                className={ "user-avatar" + (props.className ? " " + props.className : "") }
                src={ user.image || undefined }
                title={ `${user.firstName} ${user.lastName}` }
                onClick={x => props.onClick && props.onClick(user.id)}>{ user.image ? undefined : user.firstName.charAt(0)}</Avatar>
        : null
}
