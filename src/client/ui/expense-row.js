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
    }
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

export default class ExpenseRow extends React.Component {
    constructor(props) {
        super(props);
    }

    categoryLink(id) {
        const cat = categories.get(id);
        return <a href="#" key={cat.id} onClick={
            () => this.props.addFilter(e => e.categoryId == cat.id || categories.get(e.categoryId).parentId == cat.id, categories.getFullName(cat.id))
        } style={{ color: colors.action }}>{ cat.name }</a>
    }

    fullCategoryLink(id) {
        const cat = categories.get(id);
        return cat.parentId ?
            [this.categoryLink(cat.parentId), " - ", this.categoryLink(id)] :
            this.categoryLink(id);
    }

    getSource(sourceId) {
        const source = state.get("sourceMap")[sourceId];
        return source.abbreviation ? source.abbreviation : source.name;
    }

    render() {
        const expense = this.props.expense;
        return <div key={expense.id} className="expense-row">
            <div className="expense-detail date">{ moment(expense.date).format("D.M.") }</div>
            <div className="expense-detail user">
                <UserAvatar userId={expense.userId} size={25} onClick={
                    () => this.props.addFilter(
                        e => e.userId == expense.userId,
                        state.get("userMap")[expense.userId].firstName,
                        state.get("userMap")[expense.userId].image)
                }/>
            </div>
            <div className="expense-detail description">{ expense.description }</div>
            <div className="expense-detail receiver">{ expense.receiver }</div>
            <div className="expense-detail category">{ this.fullCategoryLink(expense.categoryId) }</div>
            <div className="expense-detail source">{ this.getSource(expense.sourceId) }</div>
            <div className="expense-detail sum">{ Money.from(expense.sum).format() }</div>
            <div className="expense-detail balance" style={{ color: colors.forMoney(expense.userBalance) }} onClick={
                () => Money.zero.equals(expense.userBalance) ?
                    this.props.addFilter(e => Money.zero.equals(e.userBalance), "Balanssi == 0") :
                    this.props.addFilter(e => !Money.zero.equals(e.userBalance), "Balanssi != 0")
            }>{ Money.from(expense.userBalance).format() }</div>
            <div className="expense-detail tools">
                <IconButton iconClassName="material-icons" title="Tiedot" style={styles.tool} iconStyle={styles.toolIcon}
                            onClick={()=>this.props.onToggleDetails(expense, this.props.details)}>{ this.props.details ? "expand_less" : "expand_more" }</IconButton>
                <IconButton iconClassName="material-icons" title="Muokkaa" style={styles.tool} iconStyle={styles.toolIcon}
                            onClick={()=>this.props.onModify(expense.id)}>edit</IconButton>
                <IconButton iconClassName="material-icons" title="Poista" style={styles.tool} iconStyle={styles.toolIcon}
                            onClick={()=>this.props.onDelete(expense)}>delete</IconButton>
            </div>
        </div>
    }
}

