import React from "react"
import * as state from  "../data/state";
import * as colors from "./colors";
import * as categories from  "../data/categories";
import UserAvatar from "./user-avatar";
import IconButton from 'material-ui/IconButton';
import {expenseName} from "./expense-helper";
import {Repeat} from "./icons";
import * as apiConnect from "../data/api-connect";
const Money = require("../../shared/util/money");
import {ExpensePropType} from "./expense-helper";

const styles = {
    tool: {
        margin: "0",
        padding: "0",
        width: 36,
        height: 36
    },
    toolIcon: {
        color: colors.tool,
        fontSize: "15pt"
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

export default class ExpenseDivision extends React.Component {

    constructor(props) {
        super(props);
        this.userMap = state.get("userMap");
        this.createRecurring = this.createRecurring.bind(this);
    }

    createRecurring() {
        state.confirm("Muuta toistuvaksi", `Kuinka usein kirjaus ${expenseName(this.props.expense)} toistuu?`, {
            actions: [ ["Kuukausittain", "monthly"], ["Vuosittain", "yearly"], ["Peruuta", false] ]
        })
            .then(a => a ? apiConnect.createRecurring(this.props.expense.id, a)
                    .then(() => state.updateExpenses(this.props.expense.date))
                    .then(() => state.notify("Kirjaus muutettu toistuvaksi")) : false)
            .catch(e => state.notifyError("Virhe muutettaessa kirjausta toistuvaksi", e));
    }

    render() {
        const division = this.props.division;
        const expense = this.props.expense;
        const income = expense.type === "income";
        const user = state.get("userMap")[expense.userId];
        const users = {};
        division.forEach(d => { users[d.userId] = Object.assign({}, users[d.userId], { [d.type]: d.sum }) });
        console.log(users);
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

ExpenseDivision.propTypes = {
    division: React.PropTypes.array.isRequired,
    expense: React.PropTypes.shape(ExpensePropType)
};
