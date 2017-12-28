import * as React from 'react';
import * as categories from  "../data/categories";
import * as state from  "../data/state";
import * as apiConnect from "../data/api-connect";
import UserAvatar from "./user-avatar";
import ActivatableTextField from "./activatable-text-field";
import {PlainTextField} from "./plain-text-field";
import {ExpandLess,ExpandMore,Delete,Edit,Repeat,ToolIcon} from "./icons"
import * as colors from "./colors";
import {ExpensePropType} from "./expense-helper";
import {PlainReceiverField} from "./expense-dialog-components";
import {combineClassNames} from "../util/client-util";
import * as arrays from "../../shared/util/arrays";
import * as time from "../../shared/util/time";
import PropTypes from "prop-types";
import ExpenseDivision from "./expense-division"
import {expenseName} from "./expense-helper";
const Money = require("../../shared/util/money");
const moment = require("moment");

// Just a special reference for determining if details are loading
const LoadingDetails = {};

function money(v) {
    return v ? Money.from(v).format() : "-";
}

export function ExpenseHeader(props) {
    return <div className={combineClassNames("expense-row bk-table-row header", props.className)} style={{ color: colors.header }}>
        <div className="expense-detail date">Pvm</div>
        <div className="expense-detail user optional"/>
        <div className="expense-detail title">Nimi</div>
        <div className="expense-detail receiver optional">Kohde</div>
        <div className="expense-detail category optional">Kategoria</div>
        <div className="expense-detail source optional">Lähde</div>
        <div className="expense-detail sum">Summa</div>
        <div className="expense-detail balance optional">Balanssi</div>
        <div className="expense-detail tools"/>
    </div>
}

const statusTypeNames = {
    income: "Tulot",
    split: "Tulojako",
    cost: "Menot",
    benefit: "Hyöty",
    balance: "Balanssi"
};
const statusTypeKeys = Object.keys(statusTypeNames);

export function ExpenseStatus(props) {
    const style = {};
    if (props.unconfirmedBefore) {
        style.background = colors.unconfirmedStripes;
    }
    return <div className={combineClassNames("expense-row bk-table-row status", props.className)} style={style}>
        <div className="expense-detail status-description">{props.name}</div>
        {
            arrays.flatten(statusTypeKeys.map(type =>
                props.status[type] ? [
                    <div className={ combineClassNames("expense-detail status-label", type !== "balance" ? "optional" : "")}
                         key={`label-${type}`}>{ statusTypeNames[type] }:</div>,
                    <div className={ combineClassNames("expense-detail status-sum", type !== "balance" ? "optional" : "")}
                         key={`sum-${type}`}
                         style={{ color: colors.forMoney(props.status[type]) }}>{ money(props.status[type]) }</div>
                ] : []
            ))
        }
    </div>
}
ExpenseStatus.propTypes = {
    name: PropTypes.string.isRequired,
    cost: PropTypes.string,
    benefit: PropTypes.string,
    balance: PropTypes.string
};

export function ExpenseTotal(props) {
    return <div className="expense-row bk-table-row">
        <div className="expense-detail total-label">Menot yhteensä</div>
        <div className="expense-detail total-sum">{ money(props.expense) }</div>
        <div className="expense-detail total-label">Tulot yhteensä</div>
        <div className="expense-detail total-sum">{ money(props.income) }</div>
    </div>;
}
ExpenseTotal.propTypes = {
    expense: PropTypes.object.isRequired,
    income: PropTypes.object.isRequired
};

export default class ExpenseRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            details: null
        };
        this.updateExpense = this.updateExpense.bind(this);
        this.toggleDetails = this.toggleDetails.bind(this);
        this.editDate = this.editDate.bind(this);
        this.deleteExpense = this.deleteExpense.bind(this);
        this.modifyExpense = this.modifyExpense.bind(this);
    }

    categoryLink(id) {
        const cat = categories.get(id);
        return <a key={cat.id} onClick={
            () => this.props.addFilter(e => e.categoryId === cat.id || categories.get(e.categoryId).parentId === cat.id, categories.getFullName(cat.id))
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
        const content = source.image ?
            <img src={source.image} title={source.name} style={{ maxWidth: "48px", maxHeight: "24px" }} /> :
            (source.abbreviation ? source.abbreviation : source.name);
        const avatar = source.image ? source.image : undefined;
        return <a key={source.id} onClick={
            () => this.props.addFilter(e => e.sourceId === sourceId, source.name, avatar)}>{ content }</a>
    }

    updateExpense(data) {
        apiConnect.getExpense(this.props.expense.id)
            .then(exp => {
                const newData = Object.assign(exp, data);
                apiConnect.updateExpense(this.props.expense.id, newData)
                    .then(s => this.props.onUpdated(newData))
            });
    }

    editDate(expense) {
        state.pickDate(moment(expense.date).toDate())
            .then(d => { if (d) this.updateExpense({ date: time.date(d) }); return true })
            .catch(e => state.notifyError("Virhe muutettaessa päivämäärää", e))
    }

    toggleDetails(expense, details) {
        if (details) {
            this.setState({ details: null });
        } else {
            this.setState({ details: LoadingDetails });
            apiConnect.getExpense(expense.id)
                .then(e => this.setState({ details: e }))
                .catch(e => {
                    state.notifyError("Ei voitu ladata tietoja kirjaukselle", e);
                    this.setState({ details: null });
                });
        }
    }

    deleteExpense(e) {
        const name = expenseName(e);
        state.confirm("Poista kirjaus",
            `Haluatko varmasti poistaa kirjauksen ${name}?`,
            { okText : "Poista" })
            .then(b => b ? apiConnect.deleteExpense(e.id)
                .then(x => state.notify(`Poistettu kirjaus ${name}`))
                .then(x => state.updateExpenses(e.date))
                : false)
            .catch(e => state.notifyError(`Virhe poistettaessa kirjausta ${name}`, e));
    }

    modifyExpense(expense) {
        apiConnect.getExpense(expense.id).then(e => state.editExpense(e))
    }

    renderDetails(expense, details) {
        return (details === LoadingDetails) || details ? [
            <ExpenseDivision
                loading={details === LoadingDetails}
                key={ "expense-division-" + expense.id }
                expense={ expense }
                onDelete={this.deleteExpense}
                onModify={this.modifyExpense}
                division={details.division} />
        ] : [];
    }

    render() {
        const expense = this.props.expense;
        const className = "bk-table-row expense-row expense-item " + expense.type + (expense.confirmed ? "" : " unconfirmed");
        const style = {};
        if (!expense.confirmed) {
            style.background = colors.unconfirmedStripes;
        } else if (expense.type === "income") {
            style.background = colors.income;
        }
        return <div>
            <div key={expense.id} className={className} style={style}>
                <div className="expense-detail date" onClick={() => this.editDate(expense)}>{ moment(expense.date).format("D.M.") }</div>
                <div className="expense-detail user optional">
                    <UserAvatar userId={expense.userId} size={25} onClick={
                        () => this.props.addFilter(
                            e => e.userId === expense.userId,
                            state.get("userMap")[expense.userId].firstName,
                            state.get("userMap")[expense.userId].image)
                    }/>
                </div>
                <div className="expense-detail title" style={{ whiteSpace: "nowrap" }}>
                    { expense.recurringExpenseId ?
                        <div style={{ display: "inline-block", width: "14pt", verticalAlign: "top" }}><Repeat style={{ width: "12pt", height: "12pt", position: "absolute" }} /></div> : "" }
                    <ActivatableTextField
                        editorType={PlainTextField}
                        name="title" value={ expense.title }
                        style={{ display: "inline-block", verticalAlign: "middle" }}
                        onChange={v => this.updateExpense({ title: v })}
                    />
                </div>
                <div className="expense-detail receiver optional"><ActivatableTextField
                    name="receiver" value={ expense.receiver }
                    editorType={PlainReceiverField}
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
                    <ToolIcon title="Tiedot" onClick={()=>this.toggleDetails(expense, this.state.details)} icon={this.state.details ? ExpandLess : ExpandMore} />
                    <ToolIcon title="Muokkaa" onClick={()=>this.modifyExpense(expense)} icon={Edit} />
                    <ToolIcon className="optional" title="Poista" onClick={()=>this.deleteExpense(expense)} icon={Delete} />
                </div>
            </div>
            { this.renderDetails(expense, this.state.details) }
        </div>
    }
}

ExpenseRow.propTypes = {
    expense: PropTypes.shape(ExpensePropType).isRequired,
    onUpdated: PropTypes.func.isRequired
};
