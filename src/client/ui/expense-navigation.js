import React from 'react';
import IconButton from 'material-ui/IconButton';
import * as state from  "../data/state";
import * as time from "../../shared/util/time"
import * as colors from "./colors";
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
                    iconStyle={{color: colors.navigation}}>chevron_left</IconButton>
            </div>
            <div style={{ textAlign: "center", flexGrow: "1", fontSize: "12pt", color: colors.header }}>
                { ExpenseNavigation.getYearMonthString(this.state.date) }
            </div>
            <div>
                <IconButton
                    onClick={() => {
                        this.setState(this.state.date.add(1, 'months'));
                        state.get("expensesUpdatedStream").push(this.state.date.clone());
                    }}
                    iconClassName="material-icons" title="Seuraava"
                    iconStyle={{color: colors.navigation}}>chevron_right</IconButton>
            </div>
        </div>
    }
}
