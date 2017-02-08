import React from "react"
import * as state from  "../data/state";
import * as colors from "./colors";
import * as categories from  "../data/categories";
import UserAvatar from "./user-avatar";
import IconButton from 'material-ui/IconButton';
const Money = require("../../shared/util/money");

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

function getBalance(data) {
    const cost = Money.orZero(data.cost);
    const benefit = Money.orZero(data.benefit);
    return cost.plus(benefit).negate();
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
    }

    render() {
        const division = this.props.division;
        const expense = this.props.expense;
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
            <div key="header" className="expense-user">
                <div className="avatar-placeholder">Jako:</div>
                <div className="expense-division-item"><div className="label">Kulut</div></div>
                <div className="expense-division-item"><div className="label">Hyöty</div></div>
                <div className="expense-division-item"><div className="label">Balanssi</div></div>
            </div>
            { Object.keys(users).map(userId =>
                <div key={userId} className="expense-user">
                    <UserAvatar userId={userId} size={25} style={{ verticalAlign: "middle" }} />
                    { divisionItem(users[userId].cost) }
                    { divisionItem(users[userId].benefit) }
                    { divisionItem(getBalance(users[userId])) }
                </div>
            )}
        </div>
    }
}
