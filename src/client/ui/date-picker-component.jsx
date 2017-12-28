"use strict";

import * as React from 'react';
import * as state from "../data/state"
import DatePicker from "material-ui/DatePicker"
const moment = require("moment")

export default class DatePickerComponent extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            open: false,
            date: null,
            resolve: undefined,
            reject: undefined
        }
    }

    componentDidMount() {
        this.unsub = state.get("pickDateStream").onValue(v => {
            this.setState(v, () => this.datePicker.openDialog());
        });
    }

    componentWillUnmount() {
        this.unsub && this.unsub();
        this.unsub = undefined;
    }

    render() {
        return <DatePicker
            textFieldStyle={{ display: "none" }}
            formatDate={d => moment(d).format("D.M.YYYY")}
            name="date-picker"
            defaultDate={this.state.date}
            value={this.state.date}
            container="dialog"
            ref={r => this.datePicker = r}
            autoOk={true}
            onChange={(n, d) => this.state.resolve && this.state.resolve(d)}
            onDismiss={() => this.state.resolve && this.state.resolve()}
        />

    }
}
