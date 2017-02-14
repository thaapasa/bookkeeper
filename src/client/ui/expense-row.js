import React from "react"
import * as categories from  "../data/categories";
import * as state from  "../data/state";
import * as apiConnect from "../data/api-connect";
import UserAvatar from "./user-avatar";
import IconButton from 'material-ui/IconButton';
import ActivatableTextField from "./activatable-text-field";
import {ExpandLess,ExpandMore,Delete,Edit} from "./icons"
import * as colors from "./colors";
import {ExpensePropType} from "./expense-helper";
import {ReceiverField} from "./expense-dialog-components";
const moment = require("moment");
const Money = require("../../shared/util/money");

const styles = {
    tool: {
        margin: "3pt",
        padding: "4pt 1pt",
        width: "16pt",
        height: "16pt"
    }
};

function ToolButton(props) {
    return <IconButton
        title={props.title}
        style={styles.tool}
        onClick={props.onClick}>{ React.createElement(props.icon, {color: colors.tool}, null) }</IconButton>
}

function ToolIcon(props) {
    return React.createElement(props.icon, Object.assign({}, props, { color: colors.tool, style: styles.tool, icon: undefined }));
}

function money(v) {
    return v ? Money.from(v).format() : "-";
}

export function ExpenseHeader() {
    return <div className="expense-row header" style={{ color: colors.header }}>
        <div className="expense-detail date">Pvm</div>
        <div className="expense-detail user optional"></div>
        <div className="expense-detail title">Nimi</div>
        <div className="expense-detail receiver optional">Kohde</div>
        <div className="expense-detail category optional">Kategoria</div>
        <div className="expense-detail source optional">Lähde</div>
        <div className="expense-detail sum">Summa</div>
        <div className="expense-detail balance optional">Balanssi</div>
        <div className="expense-detail tools"></div>
    </div>
}

export function ExpenseStatus(props) {
    const style = {};
    if (props.unconfirmedBefore) {
        style.background = colors.unconfirmedStripes;
    }
    return <div className="expense-row status" style={style}>
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
ExpenseStatus.propTypes = {
    name: React.PropTypes.string.isRequired,
    cost: React.PropTypes.string,
    benefit: React.PropTypes.string,
    balance: React.PropTypes.string
};

export default class ExpenseRow extends React.Component {
    constructor(props) {
        super(props);
        this.updateExpense = this.updateExpense.bind(this);
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

    updateExpense(data) {
        apiConnect.getExpense(this.props.expense.id)
            .then(exp => {
                const newData = Object.assign(exp, data);
                apiConnect.updateExpense(this.props.expense.id, newData)
                    .then(s => this.props.onUpdated(newData))
            });
    }

    render() {
        const expense = this.props.expense;
        const className = "expense-row expense-item " + expense.type + (expense.confirmed ? "" : " unconfirmed");
        const style = {};
        if (!expense.confirmed) {
            style.background = colors.unconfirmedStripes;
        } else if (expense.type === "income") {
            style.background = colors.income;
        }
        return <div key={expense.id} className={className} style={style}>
            <div className="expense-detail date">{ moment(expense.date).format("D.M.") }</div>
            <div className="expense-detail user optional">
                <UserAvatar userId={expense.userId} size={25} onClick={
                    () => this.props.addFilter(
                        e => e.userId == expense.userId,
                        state.get("userMap")[expense.userId].firstName,
                        state.get("userMap")[expense.userId].image)
                }/>
            </div>
            <div className="expense-detail title"><ActivatableTextField
                name="title" value={ expense.title }
                onChange={v => this.updateExpense({ title: v })}
            /></div>
            <div className="expense-detail receiver optional"><ActivatableTextField
                name="receiver" value={ expense.receiver }
                editorType={ReceiverField}
                onChange={v => this.updateExpense({ receiver: v })}
            /></div>
            <div className="expense-detail category optional">{ this.fullCategoryLink(expense.categoryId) }</div>
            <div className="expense-detail source optional">{ this.getSource(expense.sourceId) }</div>
            <div className="expense-detail sum">{ Money.from(expense.sum).format() }</div>
            <div className="expense-detail balance optional" style={{ color: colors.forMoney(expense.userBalance) }} onClick={
                () => Money.zero.equals(expense.userBalance) ?
                    this.props.addFilter(e => Money.zero.equals(e.userBalance), "Balanssi == 0") :
                    this.props.addFilter(e => !Money.zero.equals(e.userBalance), "Balanssi != 0")
            }>{ Money.from(expense.userBalance).format() }</div>
            <div className="expense-detail tools">
                <ToolIcon title="Tiedot" onClick={()=>this.props.onToggleDetails(expense, this.props.details)} icon={this.props.details ? ExpandLess : ExpandMore} />
                <ToolIcon title="Muokkaa" onClick={()=>this.props.onModify(expense)} icon={Edit} />
                <ToolIcon className="optional" title="Poista" onClick={()=>this.props.onDelete(expense)} icon={Delete} />
            </div>
        </div>
    }
}

ExpenseRow.propTypes = {
    details: React.PropTypes.shape({ division: React.PropTypes.array }),
    expense: React.PropTypes.shape(ExpensePropType).isRequired,
    onUpdated: React.PropTypes.func.isRequired,
    onToggleDetails: React.PropTypes.func.isRequired,
    onModify: React.PropTypes.func.isRequired,
    onDelete: React.PropTypes.func.isRequired
};
