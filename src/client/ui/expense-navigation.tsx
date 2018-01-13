import * as React from 'react';
import IconButton from 'material-ui/IconButton'
import * as time from '../../shared/util/time'
import * as colors from './colors'
import { NavigateLeft, NavigateRight } from './icons'
import * as state from '../data/state'
import { KeyCodes } from '../util/io'
import PropTypes from 'prop-types'
import { Moment } from 'moment';

interface ExpenseNavigationProps {
    readonly date: Moment;    
}

export default class ExpenseNavigation extends React.Component<ExpenseNavigationProps, any> {

    private container: any;

    public static getYearMonthString(date) {
        return time.getFinnishMonthName(date.month() + 1) + ' ' + date.year();
    }

    private navigateMonths = (offset) => {
        state.updateExpenses(this.props.date.clone().add(offset, 'months'));
    }

    public componentDidMount() {
        this.container.focus();
    }

    private handleKeyPress = (event) => {
        switch (event.keyCode) {
            case KeyCodes.right:
                this.navigateMonths(1);
                return false;
            case KeyCodes.left:
                this.navigateMonths(-1);
                return false;
        }
    }

    public render() {
        return <div style={{ display: "flex", alignItems: "center" }}
                    className="expense-navigation fixed-horizontal"
                    onKeyUp={this.handleKeyPress}
                    tabIndex={1}
                    ref={r => this.container = r}>
            <div>
                <IconButton
                    onClick={() => this.navigateMonths(-1)}
                    title="Edellinen"
                    style={{ padding: "0px" }}><NavigateLeft color={colors.navigation} /></IconButton>
            </div>
            <div style={{ textAlign: "center", flexGrow: 1, fontSize: "12pt", color: colors.header }}>
                { ExpenseNavigation.getYearMonthString(this.props.date) }
            </div>
            <div>
                <IconButton
                    onClick={() => this.navigateMonths(1)}
                    title="Seuraava"><NavigateRight color={colors.navigation} /></IconButton>
            </div>
        </div>
    }
}
