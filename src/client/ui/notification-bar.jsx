"use strict";

import React from "react";
import Snackbar from "material-ui/Snackbar";
import * as state from "../data/state"

const msgInterval = 5000;

export default class NotificationBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {open: false, message: ""};
        this.timer = undefined;
        this.queue = [];
        this.scheduleNext = this.scheduleNext.bind(this);
        this.dismissCurrent = this.dismissCurrent.bind(this);
        this.showMessage = this.showMessage.bind(this);
    }

    componentDidMount() {
        state.get("notificationStream").onValue(msg => this.showMessage(msg));
    }

    componentWillUnmount() {
        clearTimeout(this.timer);
        this.timer = undefined;
    }

    showMessage(msg) {
        this.queue.push({ text: msg });
        if (this.timer === undefined) {
            this.scheduleNext();
        }
    }

    scheduleNext() {
        this.timer = undefined;
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            this.setState({ open: true, message: next.text });
            this.timer = setTimeout(this.scheduleNext, msgInterval);
        } else {
            this.setState({ open: false });
        }
    }

    dismissCurrent() {
        clearTimeout(this.timer);
        this.scheduleNext();
    }

    render() {
        return <Snackbar
            open={this.state.open}
            message={this.state.message}
            onRequestClose={this.dismissCurrent}
        />
    }
}

