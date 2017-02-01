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
                    <div className="expense-detail-mobile user">
                        <span className="detail-label">Kirjaaja:</span> { user && user.firstName } </div>
                    <div className="expense-detail-mobile receiver">
                        <span className="detail-label">Kohde:</span> { expense.receiver }</div>
                    <div className="expense-detail-mobile category">
                        <span className="detail-label">Kategoria:</span> { categories.getFullName(expense.categoryId) }</div>
                    <div className="expense-detail-mobile source">
                        <span className="detail-label">Lähde:</span> {
                        state.get("sourceMap")[expense.sourceId].name
                     }</div>
                 </div>
                 <div className="tools-mobile">
                    <IconButton iconClassName="material-icons" title="Muokkaa" style={styles.tool} iconStyle={styles.toolIcon}
                                onClick={()=>this.props.onModify(expense)}>edit</IconButton>
                    <IconButton iconClassName="material-icons" title="Poista" style={styles.tool} iconStyle={styles.toolIcon}
                                onClick={()=>this.props.onDelete(expense)}>delete</IconButton>
                 </div>
            </div>
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
