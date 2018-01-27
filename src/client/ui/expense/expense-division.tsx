import * as React from 'react';
import * as state from  '../../data/state';
import * as colors from '../colors';
import * as categories from  '../../data/categories';
import UserAvatar from '../component/user-avatar';
import IconButton from 'material-ui/IconButton';
import {expenseName} from './expense-helper';
import {Repeat} from '../icons';
import * as apiConnect from '../../data/api-connect';
import RefreshIndicator from 'material-ui/RefreshIndicator';
import PropTypes from 'prop-types';
import Money from '../../../shared/util/money';
import { RecurringExpensePeriod } from '../../../shared/types/expense';
import { ConfirmationAction } from '../../data/state-types';

const styles = {
    tool: {
        margin: '0',
        padding: '0',
        width: 36,
        height: 36
    },
    toolIcon: {
        color: colors.tool,
        fontSize: '15pt'
    }
};

function divisionItem(sum) {
    const s = Money.orZero(sum);
    return <div className="expense-division-item">
        <div className="sum" style={{ color: colors.forMoney(s) }}>{ s.format() }</div>
    </div>
}

const divisionTypes = ["cost", "benefit", "income", "split"];
function getBalance(data) {
    return divisionTypes.map(t => Money.orZero(data[t])).reduce((a, b) => a.plus(b), Money.zero).negate();
}


function DetailRow(props) {
    return <div className="expense-detail-mobile">
        <span className="detail-label">{props.name + ":"}</span>
        { props.value }
    </div>
}


interface ExpenseDivisionProps {
    division: any[];
    loading: boolean;
    expense: any;
    onModify: (e: any) => void;
    onDelete: (e: any) => void;
};

export default class ExpenseDivision extends React.Component<ExpenseDivisionProps, any> {

    private userMap: any;

    constructor(props) {
        super(props);
        this.userMap = state.get("userMap");
        this.createRecurring = this.createRecurring.bind(this);
    }

    private async createRecurring() {
        try {
            const period = await state.confirm<RecurringExpensePeriod | undefined>('Muuta toistuvaksi', 
                `Kuinka usein kirjaus ${expenseName(this.props.expense)} toistuu?`, {
                actions: [
                    { label: 'Kuukausittain', value: 'monthly' },
                    { label: 'Vuosittain', value: 'yearly' },
                    { label: 'Peruuta', value: undefined },
                ]});
            if (period) {
                await apiConnect.createRecurring(this.props.expense.id, period);
                await state.updateExpenses(this.props.expense.date);
                state.notify('Kirjaus muutettu toistuvaksi');
            }
        } catch(e) {
            state.notifyError('Virhe muutettaessa kirjausta toistuvaksi', e);
        } 
    }

    render() {
        if (this.props.loading) {
            return <div className="expense-division">
                <div className="details-loading-indicator"><RefreshIndicator left={-20} top={20} status="loading" size={40} /></div>
            </div>
        }
        const division = this.props.division;
        const expense = this.props.expense;
        const income = expense.type === "income";
        const user = state.get("userMap")[expense.userId];
        const users = {};
        division.forEach(d => { users[d.userId] = Object.assign({}, users[d.userId], { [d.type]: d.sum }) });
        return <div className="expense-division">
            <div className="mobile">
                <div className="expense-details">
                    <DetailRow name="Kirjaaja" value={ user && user.firstName }/>
                    <DetailRow name="Kohde" value={ expense && expense.receiver }/>
                    <DetailRow name="Kategoria" value={ categories.getFullName(expense.categoryId) }/>
                    <DetailRow name="Lähde" value={ state.get("sourceMap")[expense.sourceId].name }/>
                 </div>
                 <div className="tools-mobile">
                    <IconButton iconClassName="material-icons" title="Muokkaa" style={styles.tool} iconStyle={styles.toolIcon}
                                onClick={()=>this.props.onModify(expense)}>edit</IconButton>
                    <IconButton iconClassName="material-icons" title="Poista" style={styles.tool} iconStyle={styles.toolIcon}
                                onClick={()=>this.props.onDelete(expense)}>delete</IconButton>
                 </div>
            </div>
            { this.props.expense.description ? <div className="expense-description">{ this.props.expense.description }</div> : [] }
            <div className="expense-recurrence">
                { this.props.expense.recurringExpenseId ? "Tämä on toistuva tapahtuma" : <IconButton onClick={this.createRecurring}><Repeat /></IconButton> }
            </div>
            <div key="header" className="expense-user">
                <div className="avatar-placeholder">Jako:</div>
                <div className="expense-division-item"><div className="label">{ income ? "Tulo" : "Kulu" }</div></div>
                <div className="expense-division-item"><div className="label">{ income ? "Jako" : "Hyöty" }</div></div>
                <div className="expense-division-item"><div className="label">Balanssi</div></div>
            </div>
            { Object.keys(users).map(userId =>
                <div key={userId} className="expense-user">
                    <UserAvatar userId={userId} size={25} style={{ verticalAlign: "middle" }} />
                    { divisionItem(income ? users[userId].income : users[userId].cost) }
                    { divisionItem(income ? users[userId].split : users[userId].benefit) }
                    { divisionItem(getBalance(users[userId])) }
                </div>
            )}
        </div>
    }
}
