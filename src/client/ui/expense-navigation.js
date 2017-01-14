import React from 'react';
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow}
    from 'material-ui/Table';
import FontIcon from 'material-ui/FontIcon';
import IconButton from 'material-ui/IconButton';

import * as apiConnect from "../data/api-connect";
import * as state from  "../data/state";
import * as time from "../../shared/util/time"
const moment = require("moment");

export default class ExpenseNavigation extends React.Component {

    constructor(props) {
        super(props);
        this.state = { date : moment() };
    }

    static getYearMonthString(date) {
        return time.getFinnishMonthName(date.month() + 1) + " " + date.year();
    }

    render() {
        return <div style={{ display: "flex", alignItems: "center" }}>
            <div>
                <IconButton
                    onClick={() => {
                        this.setState(this.state.date.subtract(1, 'months'));
                        state.get("expensesUpdatedStream").push(this.state.date.clone());

                     }}
                    iconClassName="material-icons" title="Edellinen"
                    style={{ padding: "0px" }}
                    iconStyle={{color: "rgb(0, 188, 212)"}}>chevron_left
                </IconButton>
            </div>
            <div style={{ textAlign: "center", flexGrow: "1", fontSize: "12pt", color: "grey" }}>
                { ExpenseNavigation.getYearMonthString(this.state.date) }
            </div>
            <div>
                <IconButton
                    onClick={() => {
                        this.setState(this.state.date.add(1, 'months'));
                        state.get("expensesUpdatedStream").push(this.state.date.clone());
                    }}
                    iconClassName="material-icons" title="Seuraava"
                    iconStyle={{color: "rgb(0, 188, 212)"}}>chevron_right
                </IconButton>
            </div>
        </div>
    }
}
