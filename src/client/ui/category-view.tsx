import * as React from 'react';
import { Add, Edit, ExpandLess, ExpandMore, ToolIcon } from "./icons"
import CategoryDialog from "./category-dialog"
import DatePicker from "material-ui/DatePicker"
import * as state from "../data/state"
import * as colors from "../ui/colors"
import * as apiConnect from "../data/api-connect"
import * as categories from "../data/categories"
import * as Bacon from "baconjs"
import ExpenseRow from "./expense-row"
import CategoryChart from "./category-chart"
import { unsubscribeAll } from "../util/client-util";
import PropTypes from "prop-types";
import { CSSProperties } from 'react';

const moment = require("moment");

const styles: { [key:string]: CSSProperties } = {
    mainCategory: {
        background: colors.topItem,
        color: "white",
        fontWeight: "bold"
    },
    category: {
        background: colors.subItem
    }
};

function AddCategoryButton({ onAdd, parent, color }: {
    onAdd: (p: any) => void,
    parent?: any,
    color?: any,
}) {
    return <ToolIcon title="Lisää" onClick={()=> onAdd(parent)} icon={Add} color={color} />;
}

function EditCategoryButton({ onEdit, category, color }: {
    onEdit: (p: any) => void,
    category?: any,
    color?: any,
}) {
    return <ToolIcon title="Muokkaa" onClick={()=> onEdit(category)} icon={Edit} color={color} />;
}

function ToggleButton({ state, onToggle, category, color }: {
    state: any,
    onToggle: (c: any) => void,
    category?: any,
    color?: any,
}) {
    return <ToolIcon title={state ? "Sulje" : "Avaa"} onClick={()=> onToggle(category)} icon={state ? ExpandLess : ExpandMore} color={color} />;
}

const reloadStream = new Bacon.Bus();

interface CategoryRowProps {
    category: any;
    header: boolean;
    createCategory: (p: any) => void;
    editCategory: (p: any) => void;
    datesStr: any;
    categoryTotals: any;
    categoryExpenses?: any[];
}

interface CategoryRowState {
    expenses: any[];
    open: boolean;
}


class CategoryRow extends React.Component<CategoryRowProps, CategoryRowState> {

    private openStr: any = new Bacon.Bus();
    private unsub: any[];
    private expenseStream: any;
    
    public state: CategoryRowState = {
        expenses: [],
        open: false
    };

    constructor(props: CategoryRowProps) {
        super(props);
        this.openStr.push(false);
    }

    public componentDidMount() {
        this.expenseStream = Bacon.combineTemplate({ dates: this.props.datesStr, open: this.openStr });
        this.openStr.onValue(o => this.setState({ open: o }));
        this.unsub = [this.expenseStream, this.openStr];
        this.expenseStream
            .flatMap(d => d.open ? Bacon.fromPromise(apiConnect.searchExpenses(d.dates.start, d.dates.end, { categoryId: this.props.category.id })) : Bacon.constant([]))
            .flatMapLatest(f => f)
            .onValue(o => this.setState({ expenses: o }));
        this.unsub.push(state.get("expensesUpdatedStream").onValue(date => reloadStream.push(true)));
    }
    public componentWillUnmount() {
        unsubscribeAll(this.unsub);
    }

    private renderCategoryExpenses = (expenses) => {
        return expenses && expenses.length > 0 ? expenses.map(expense => <ExpenseRow
                expense={ expense }
                key={ "expense-row-" + expense.id }
                addFilter={() => {}}
                onUpdated={e => reloadStream.push(true)} />) :
            <div className="bk-table-row category-table-row"><div className="category-name">Ei kirjauksia</div></div>;
    }
    /*{this.props.categoryTotals[category.id].expenses} / {this.props.categoryTotals[category.id].income}*/
    public render() {
        const category = this.props.category;
        const header = this.props.header;
        return <div className="category-container">
            <div className="bk-table-row category-table-row" style={ styles[header ? "mainCategory" : "category"]}>
                <div className="category-name">{category.name}</div>
                <div className="category-sum">{ header && (this.props.categoryTotals['' + category.id]) ? this.props.categoryTotals['' + category.id].totalExpenses + " / " + this.props.categoryTotals['' + category.id].totalIncome : ""}</div>
                <div className="category-totals">{(this.props.categoryTotals['' + category.id]) ? this.props.categoryTotals['' + category.id].expenses + " / " + this.props.categoryTotals['' + category.id].income : "0 / 0"}</div>
                <div className="category-tools">
                    { header ?
                        <AddCategoryButton parent={category} color={colors.white} onAdd={this.props.createCategory}/> : null }
                    <EditCategoryButton category={category} color={header ? colors.white : null}
                                        onEdit={this.props.editCategory}/>
                    <ToggleButton category={category} color={header ? colors.white : null}
                                  onToggle={() => this.openStr.push(!this.state.open)}
                                  state={this.state.open}/>
                </div>
            </div>
            { this.state.open ? this.renderCategoryExpenses(this.state.expenses) : null }
        </div>
    }
}

function MyDatePicker({ value, onChange, label }) {
    return <DatePicker
        value={value}
        formatDate={d => moment(d).format("D.M.YYYY")}
        //display="inline"
        floatingLabelText={label}
        //floatingLabelFixed={true}
        fullWidth={true}
        autoOk={true}
        onChange={(event, date) => onChange(date)} />;
}

export default class CategoryView extends React.Component<any, any> {

    private startDateStr: any;
    private endDateStr: any;
    private datesStr: any;
    private categoryDialog: any;
    private unsub: any[];

    constructor(props) {
        super(props);
        const end = moment().endOf("month");
        const start = end.clone().startOf("year");
        this.state = {
            categories: state.get("categories"),
            startDate: start.toDate(),
            endDate: end.toDate(),
            categoryExpenses: {},
            categoryTotals: {}
        };
        this.startDateStr = new Bacon.Bus();
        this.endDateStr = new Bacon.Bus();
        this.datesStr = Bacon.combineTemplate({
            start: this.startDateStr.toProperty(start.toDate()),
            end: this.endDateStr.toProperty(end.toDate()),
            reload: reloadStream.toProperty(true)
        });

        this.createCategory = this.createCategory.bind(this);
        this.reloadCategories = this.reloadCategories.bind(this);
        this.editCategory = this.editCategory.bind(this);
        this.CategoryTable = this.CategoryTable.bind(this);
        this.CategoryHeader = this.CategoryHeader.bind(this);
        this.TimeSelector = this.TimeSelector.bind(this);


    }

    /*setTotalsToCategory(category, ) {

    }*/
    formCategoryChartData() {
        let chartData: any[] = [];
        this.state.categories && this.state.categories.forEach(c => {
            chartData.push({ categoryId: c.id, categoryName: c.name, categoryTotal: this.state.categoryTotals[c.id].totalExpenses})
        })
        this.setState({ categoryChartData: chartData });
    }

    getCategoryTotals(dates) {
        if (!dates) {
            return;
        }
        return apiConnect.getCategoryTotals(dates.start, dates.end).then(t => {
            let totalsMap = {};
            t && t.forEach(t => {
                totalsMap['' + t.id] = t;
                if (t.children && t.children.length > 0) {
                    t.children.forEach(ch => totalsMap['' + ch.id] = ch);
                }
            });
            this.setState({ categoryTotals : totalsMap });
        })
    }

    reloadCategories(dates) {
        Promise.all([
            this.getCategoryTotals(dates),
            apiConnect.getCategoryList()
        ]).then(a => {
            this.setState({ categories: a[1] });
            this.formCategoryChartData();
        });
     }

    createCategory(parent) {
        this.categoryDialog.createCategory(parent)
            .then(c => console.log("Created new category", c))
            .then(c => this.reloadCategories(null));
    }

    editCategory(category) {
        this.categoryDialog.editCategory(category)
            .then(c => console.log("Modified category", c))
            .then(c => this.reloadCategories(null));
    }

    componentDidMount() {
        this.unsub = [];
        this.startDateStr.onValue(d => this.setState({ startDate: d }));
        this.endDateStr.onValue(d => this.setState({ endDate: d }));
        this.unsub.push(this.startDateStr, this.endDateStr, this.datesStr);
        this.datesStr.onValue(this.reloadCategories);
        this.reloadCategories(this.datesStr);
        this.setState(s => {
            this.startDateStr.push(s.startDate);
            this.endDateStr.push(s.endDate);
            return {};
        });
    }

    componentWillUnmount() {
        unsubscribeAll(this.unsub);
        this.unsub = [];
    }

    TimeSelector() {
        return <div className="bk-table-row category-table-time-select no-border">
            <div className="bk-item-half horizontal-padding"><MyDatePicker
                key="start-date"
                value={this.state.startDate}
                label="Alku"
                onChange={d => this.startDateStr.push(d)} />
            </div>
            <div className="bk-item-half horizontal-padding"><MyDatePicker
                key="end-date"
                value={this.state.endDate}
                label="Loppu"
                onChange={d => this.endDateStr.push(d)} />
            </div>
        </div>
    }

    CategoryTable({ categories, categoryTotals, categoryExpenses, categoryChartData }) {
        return <div className="category-table">
                <this.TimeSelector />
                <CategoryChart
                    chartData={categoryChartData}/>
                <this.CategoryHeader />
                <div className="category-data-area">
                    { categories.map(c => [<CategoryRow key={c.id} category={c} header={true} categoryExpenses={categoryExpenses} categoryTotals={categoryTotals}
                                                        createCategory={this.createCategory} editCategory={this.editCategory} datesStr={this.datesStr} />]
                        .concat(c.children.map(ch => <CategoryRow key={ch.id} header={false} category={ch} categoryExpenses={categoryExpenses} categoryTotals={categoryTotals}
                                                                  createCategory={this.createCategory} editCategory={this.editCategory} datesStr={this.datesStr} /> ))) }
                </div>
            </div>
    }

    CategoryHeader() {
        return <div className="category-table-row category-table-header header no-border">
            <div className="category-name">Nimi</div>
            <div className="category-totals">Kulut / Tulot</div>
            <div className="category-tools">
                <AddCategoryButton onAdd={this.createCategory}/>
            </div>
        </div>
    }

    render() {
        return <div className="content">
            <this.CategoryTable
                categories={this.state.categories}
                categoryTotals={this.state.categoryTotals}
                categoryExpenses={this.state.categoryExpenses}
                categoryChartData={this.state.categoryChartData}/>
            <CategoryDialog ref={r => this.categoryDialog = r}/>
        </div>
    }

}
