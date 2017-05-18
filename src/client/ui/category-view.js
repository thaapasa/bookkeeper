"use strict";

import React from "react"
import {Add,Edit,ExpandLess,ExpandMore,ToolIcon} from "./icons"
import CategoryDialog from "./category-dialog"
import DatePicker from "material-ui/DatePicker";
import * as state from "../data/state"
import * as colors from "../ui/colors"
import * as apiConnect from "../data/api-connect"
import ExpenseRow from "./expense-row"
const moment = require("moment");

const styles = {
    mainCategory: {
        background: colors.topItem,
        color: "white",
        fontWeight: "bold"
    },
    category: {
        background: colors.subItem
    }
};

const AddCategoryButton = ({ onAdd, parent = null, color = null }) => <ToolIcon title="Lisää" onClick={()=> onAdd(parent)} icon={Add} color={color} />;
const EditCategoryButton = ({ onEdit, category = null, color = null }) => <ToolIcon title="Muokkaa" onClick={()=> onEdit(category)} icon={Edit} color={color} />;
const ToggleButton = ({ state, onToggle, category = null, color = null }) => <ToolIcon title={state ? "Sulje" : "Avaa"} onClick={()=> onToggle(category)} icon={state ? ExpandLess : ExpandMore} color={color} />;

export default class CategoryView extends React.Component {

    constructor(props) {
        super(props);
        const end = moment().endOf("month");
        const start = end.clone().startOf("year");
        this.state = {
            categories: state.get("categories"),
            startDate: start.toDate(),
            endDate: end.toDate(),
            categoryExpenses: {}
        };
        this.createCategory = this.createCategory.bind(this);
        this.editCategory = this.editCategory.bind(this);
        this.toggleCategoryExpenses = this.toggleCategoryExpenses.bind(this);
        this.CategoryTable = this.CategoryTable.bind(this);
        this.CategoryHeader = this.CategoryHeader.bind(this);
        this.CategoryRow = this.CategoryRow.bind(this);
        this.TimeSelector = this.TimeSelector.bind(this);
    }

    reloadCategories() {
        apiConnect.getCategoryList().then(l => this.setState({ categories: l }));
    }

    createCategory(parent) {
        this.categoryDialog.createCategory(parent)
            .then(c => console.log("Created new category", c))
            .then(c => this.reloadCategories());
    }

    editCategory(category) {
        console.log("Editing!");
        this.categoryDialog.editCategory(category)
            .then(c => console.log("Modified category", c))
            .then(c => this.reloadCategories());
    }

    toggleCategoryExpenses(category) {
        console.log("Toggling", category);
        this.setState(s => {
            if (this.isOpen(s.categoryExpenses, category)) {
                // Close category expenses
                delete s.categoryExpenses[category.id];
            } else {
                // Open category expenses
                apiConnect.searchExpenses(s.startDate, s.endDate, { categoryId: category.id })
                    .then(l => this.setState(s2 => {
                        s2.categoryExpenses[category.id] = l;
                        return s2;
                    }));
            }
            return s;
        });
    }

    loadData(startDate, endDate) {
        console.log(`Loading data for ${startDate} - ${endDate}`);
    }

    componentDidMount() {
        this.setState(s => {
            this.loadData(s.startDate, s.endDate);
            return s;
        });
    }

    TimeSelector() {
        return <div className="bk-table-row category-table-time-select no-border">
            <div className="bk-item-half horizontal-padding"><DatePicker
                key="start-date"
                value={this.state.startDate}
                formatDate={d => moment(d).format("D.M.YYYY")}
                display="inline"
                floatingLabelText="Alku"
                floatingLabelFixed={true}
                fullWidth={true}
                autoOk={true}
                onChange={(event, date) => this.setState(s => {
                    s.startDate = date;
                    this.loadData(s.startDate, s.endDate);
                    return s;
                })} />
            </div>
            <div className="bk-item-half horizontal-padding"><DatePicker
                key="end-date"
                value={this.state.endDate}
                floatingLabelText="Loppu"
                floatingLabelFixed={true}
                display="inline"
                formatDate={d => moment(d).format("D.M.YYYY")}
                fullWidth={true}
                autoOk={true}
                onChange={(event, date) => this.setState(s => {
                    s.endDate = date;
                    this.loadData(s.startDate, s.endDate);
                    return s;
                })} />
            </div>
        </div>
    }

    CategoryTable({ categories, categoryExpenses }) {
        return <div className="bk-table category-table">
                <this.TimeSelector />
                <this.CategoryHeader />
                <div className="category-data-area bk-table-data-area">
                    { categories.map(c => [<this.CategoryRow key={c.id} category={c} header={true} categoryExpenses={categoryExpenses} />]
                        .concat(c.children.map(ch => <this.CategoryRow key={ch.id} category={ch} categoryExpenses={categoryExpenses} /> ))) }
                </div>
            </div>
    }

    CategoryHeader() {
        return <div className="bk-table-header bk-table-row category-table-row category-table-header header no-border">
            <div className="category-name">Nimi</div>
            <div className="category-tools">
                <AddCategoryButton onAdd={this.createCategory}/>
            </div>
        </div>
    }

    CategoryRow({ category, categoryExpenses, header = false }) {
        return <div className="category-container">
            <div className="bk-table-row category-table-row" style={ styles[header ? "mainCategory" : "category"]}>
                <div className="category-name">{category.name}</div>
                <div className="category-tools">
                    { header ? <AddCategoryButton parent={category} color={colors.white} onAdd={this.createCategory} /> : null }
                    <EditCategoryButton category={category} color={header ? colors.white : null} onEdit={this.editCategory} />
                    <ToggleButton category={category} color={header ? colors.white : null} onToggle={this.toggleCategoryExpenses} state={this.isOpen(categoryExpenses, category)} />
                </div>
            </div>
            { this.isOpen(categoryExpenses, category) ? this.renderCategoryExpenses(categoryExpenses[category.id]) : null}
        </div>
    }

    renderCategoryExpenses(expenses) {
        return (expenses && expenses.length > 0) ?
            expenses.map(expense => <ExpenseRow
                expense={ expense }
                details={ null }
                key={ "expense-row-" + expense.id }
                addFilter={ this.noop }
                onUpdated={ e => this.noop }
                onToggleDetails={ this.noop }
                onModify={ this.noop }
                onDelete={ this.noop } />) :
            <div className="bk-table-row category-table-row"><div className="category-name">Ei kirjauksia</div></div>
    }

    noop() {}

    isOpen(categoryExpenses, category) {
        return typeof categoryExpenses[category.id] === "object"
    }

    render() {
        return <div className="content">
            <this.CategoryTable
                categories={this.state.categories}
                categoryExpenses={this.state.categoryExpenses} />
            <CategoryDialog ref={r => this.categoryDialog = r}/>
        </div>
    }

}