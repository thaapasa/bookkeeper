import React from "react"
const moment = require("moment");
const Money = require("../../shared/util/money");
import * as categories from  "../data/categories";
import * as state from  "../data/state";
import UserAvatar from "./user-avatar";
import IconButton from 'material-ui/IconButton';
import * as colors from "./colors";

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
    },
    balanceColor: (b) => b.gt(0) ? colors.positive : ( b.lt(0) ? colors.negative : colors.unimportant)
};

export function ExpenseHeader(props) {
    return <div className="expense-row header" style={{ color: colors.header }}>
        <div className="expense-detail date">Pvm.</div>
        <div className="expense-detail user"></div>
        <div className="expense-detail description">Selite</div>
        <div className="expense-detail receiver">Kohde</div>
        <div className="expense-detail category">Kategoria</div>
        <div className="expense-detail source">Lähde</div>
        <div className="expense-detail sum">Summa</div>
        <div className="expense-detail balance">Balanssi</div>
        <div className="expense-detail tools"></div>
    </div>
}

export default function ExpenseRow(props) {
    const expense = props.expense;
    return <div key={expense.id} className="expense-row">
        <div className="expense-detail date">{ moment(expense.date).format("D.M.") }</div>
        <div className="expense-detail user">
            <UserAvatar userId={expense.userId} size={25} onClick={
                () => props.addFilter(
                    e => e.userId == expense.userId,
                    state.get("userMap")[expense.userId].firstName,
                    state.get("userMap")[expense.userId].image)
            }/>
        </div>
        <div className="expense-detail description">{ expense.description }</div>
        <div className="expense-detail receiver">{ expense.receiver }</div>
        <div className="expense-detail category"><a href="#" onClick={
            () => props.addFilter(e => e.categoryId == expense.categoryId, categories.getFullName(expense.categoryId))
        } style={{ color: colors.action }}>{categories.getFullName(expense.categoryId)}</a></div>
        <div className="expense-detail source">{ state.get("sourceMap")[expense.sourceId].name }</div>
        <div className="expense-detail sum">{ Money.from(expense.sum).format() }</div>
        <div className="expense-detail balance" style={{ color: styles.balanceColor(expense.userBalance) }} onClick={
            () => Money.zero.equals(expense.userBalance) ?
                props.addFilter(e => Money.zero.equals(e.userBalance), "Balanssi == 0") :
                props.addFilter(e => !Money.zero.equals(e.userBalance), "Balanssi != 0")
        }>{ Money.from(expense.userBalance).format() }</div>
        <div className="expense-detail tools">
            <IconButton iconClassName="material-icons" title="Tiedot" style={styles.tool} iconStyle={styles.toolIcon}
                        onClick={()=>props.onToggleDetails(expense, props.details)}>{ props.details ? "expand_less" : "expand_more" }</IconButton>
            <IconButton iconClassName="material-icons" title="Muokkaa" style={styles.tool} iconStyle={styles.toolIcon}
                        onClick={()=>props.onModify(expense.id)}>edit</IconButton>
            <IconButton iconClassName="material-icons" title="Poista" style={styles.tool} iconStyle={styles.toolIcon}
                        onClick={()=>props.onDelete(expense)}>delete</IconButton>
        </div>
    </div>
}

