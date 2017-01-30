import React from "react"
import * as categories from  "../data/categories";
import * as state from  "../data/state";
import UserAvatar from "./user-avatar";
import Avatar from "material-ui/Avatar";
import IconButton from 'material-ui/IconButton';
import * as colors from "./colors";
const moment = require("moment");
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

function money(v) {
    return v ? Money.from(v).format() : "-";
}

export function ExpenseHeader() {
    return <div className="expense-row header" style={{ color: colors.header }}>
        <div className="expense-detail date">Pvm</div>
        <div className="expense-detail user optional"></div>
        <div className="expense-detail description">Selite</div>
        <div className="expense-detail receiver optional">Kohde</div>
        <div className="expense-detail category optional">Kategoria</div>
        <div className="expense-detail source optional">Lähde</div>
        <div className="expense-detail sum">Summa</div>
        <div className="expense-detail balance optional">Balanssi</div>
        <div className="expense-detail tools"></div>
    </div>
}

export function ExpenseStatus(props) {
    return <div className="expense-row status">
        <div className="expense-detail status-description">{props.name}</div>
        { props.status.cost ? [
            <div className="expense-detail status-label optional" key="label">Hinta:</div>,
                <div className="expense-detail status-sum optional" key="sum" style={{ color: colors.forMoney(props.status.cost) }}>{ money(props.status.cost) }</div>
            ] : [] }
        { props.status.benefit ? [
            <div className="expense-detail status-label optional" key="label">Hyöty:</div>,
                <div className="expense-detail status-sum optional" key="sum" style={{ color: colors.forMoney(props.status.benefit) }}>{ money(props.status.benefit) }</div>
            ] : [] }
        { props.status.balance ? [
            <div className="expense-detail status-label optional" key="label">Balanssi:</div>,
                <div className="expense-detail status-sum" key="sum" style={{ color: colors.forMoney(props.status.balance) }}>{ money(props.status.balance) }</div>
            ] : [] }
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
        if (source.image) {
            return <img src={source.image} title={source.name} style={{ maxWidth: "48px", maxHeight: "24px" }} />
        } else {
            return source.abbreviation ? source.abbreviation : source.name;
        }
    }

    render() {
        const expense = this.props.expense;
        return <div key={expense.id} className="expense-row">
            <div className="expense-detail date">{ moment(expense.date).format("D.M.") }</div>
            <div className="expense-detail user optional">
                <UserAvatar userId={expense.userId} size={25} onClick={
                    () => this.props.addFilter(
                        e => e.userId == expense.userId,
                        state.get("userMap")[expense.userId].firstName,
                        state.get("userMap")[expense.userId].image)
                }/>
            </div>
            <div className="expense-detail description">{ expense.description }</div>
            <div className="expense-detail receiver optional">{ expense.receiver }</div>
            <div className="expense-detail category optional">{ this.fullCategoryLink(expense.categoryId) }</div>
            <div className="expense-detail source optional">{ this.getSource(expense.sourceId) }</div>
            <div className="expense-detail sum">{ Money.from(expense.sum).format() }</div>
            <div className="expense-detail balance optional" style={{ color: colors.forMoney(expense.userBalance) }} onClick={
                () => Money.zero.equals(expense.userBalance) ?
                    this.props.addFilter(e => Money.zero.equals(e.userBalance), "Balanssi == 0") :
                    this.props.addFilter(e => !Money.zero.equals(e.userBalance), "Balanssi != 0")
            }>{ Money.from(expense.userBalance).format() }</div>
            <div className="expense-detail tools">
                <IconButton iconClassName="material-icons" title="Tiedot" style={styles.tool} iconStyle={styles.toolIcon}
                            onClick={()=>this.props.onToggleDetails(expense, this.props.details)}>{ this.props.details ? "expand_less" : "expand_more" }</IconButton>
                <IconButton iconClassName="material-icons" title="Muokkaa" style={styles.tool} iconStyle={styles.toolIcon}
                            onClick={()=>this.props.onModify(expense.id)}>edit</IconButton>
                <IconButton className="optional" iconClassName="material-icons" title="Poista" style={styles.tool} iconStyle={styles.toolIcon}
                            onClick={()=>this.props.onDelete(expense)}>delete</IconButton>
            </div>
        </div>
    }
}

