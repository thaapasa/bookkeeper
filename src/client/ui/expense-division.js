import React from "react"
import * as state from  "../data/state";
import * as colors from "./colors";
import UserAvatar from "./user-avatar";
const Money = require("../../shared/util/Money");

function divisionItem(label, sum) {
    const s = Money.orZero(sum);
    return <div className="expense-division-item">
        <div className="label">{ label }</div>
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
        const users = {};
        division.forEach(d => { users[d.userId] = Object.assign({}, users[d.userId], { [d.type]: d.sum }) });
        console.log(users);
        return <div className="expense-division">
            { Object.keys(users).map(userId =>
                <div key={userId} className="expense-user">
                    <UserAvatar userId={userId} size={25} style={{ verticalAlign: "middle" }} />
                    { divisionItem("Kulut", users[userId].cost) }
                    { divisionItem("Hyöty", users[userId].benefit) }
                    { divisionItem("Balanssi", getBalance(users[userId])) }
                </div>
            )}
        </div>
    }
}
