import React from 'react';
import IconButton from 'material-ui/IconButton';
import * as time from "../../shared/util/time"
import * as colors from "./colors";
import ChevronLeft from "material-ui/svg-icons/navigation/chevron-left"
import ChevronRight from "material-ui/svg-icons/navigation/chevron-right"
import * as state from "../data/state"
const Moment = require("moment")

export default class ExpenseNavigation extends React.Component {

    constructor(props) {
        super(props);
    }

    static getYearMonthString(date) {
        return time.getFinnishMonthName(date.month() + 1) + " " + date.year();
    }

    render() {
        return <div style={{ display: "flex", alignItems: "center" }}>
            <div>
                <IconButton
                    onClick={() => state.updateExpenses(this.props.date.clone().subtract(1, 'months')) }
                    title="Edellinen"
                    style={{ padding: "0px" }}><ChevronLeft color={colors.navigation} /></IconButton>
            </div>
            <div style={{ textAlign: "center", flexGrow: "1", fontSize: "12pt", color: colors.header }}>
                { ExpenseNavigation.getYearMonthString(this.props.date) }
            </div>
            <div>
                <IconButton
                    onClick={() => state.updateExpenses(this.props.date.clone().add(1, 'months')) }
                    title="Seuraava"><ChevronRight color={colors.navigation} /></IconButton>
            </div>
        </div>
    }
}

ExpenseNavigation.propTypes = {
    date: React.PropTypes.instanceOf(Moment).isRequired
};
