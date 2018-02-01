import * as React from 'react';
import * as Bacon from 'baconjs';
import { Add, Edit, ExpandLess, ExpandMore, ToolIcon } from '../Icons';
import CategoryDialog from './category-dialog';
import DatePicker from 'material-ui/DatePicker';
import * as state from '../../data/State';
import * as colors from '../Colors';
import * as apiConnect from '../../data/ApiConnect';
import ExpenseRow from '../expense/expense-row';
import CategoryChart from './category-chart';
import { unsubscribeAll } from '../../util/ClientUtil';
import { CSSProperties } from 'react';
import * as moment from 'moment';
import { Map } from '../../../shared/util/Util';
const debug = require('debug')('bookkeeper:category-view');

const styles: Map<CSSProperties> = {
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
        this.unsub.push(state.get('expensesUpdatedStream').onValue(date => reloadStream.push(true)));
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

interface CategoryViewState {
    categories: any[];
    startDate: Date;
    endDate: Date;
    categoryExpenses: any;
    categoryTotals: any;
    categoryChartData?: any;
}

export default class CategoryView extends React.Component<any, CategoryViewState> {

    private startDateStr: Bacon.Bus<any, Date>;
    private endDateStr: Bacon.Bus<any, Date>;
    private datesStr: any;
    private categoryDialog: any;
    private unsub: any[];

    public state: CategoryViewState = {
        categories: [],
        startDate: new Date(),
        endDate: new Date(),
        categoryExpenses: {},
        categoryTotals: {},
    };

    private formCategoryChartData() {
        let chartData: any[] = [];
        this.state.categories && this.state.categories.forEach(c => {
            chartData.push({ categoryId: c.id, categoryName: c.name, categoryTotal: this.state.categoryTotals[c.id].totalExpenses})
        })
        this.setState({ categoryChartData: chartData });
    }

    private getCategoryTotals(dates) {
        if (!dates) { return; }
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

    private reloadCategories = async (dates) => {
        const [totals, categories] = await Promise.all([
            this.getCategoryTotals(dates),
            apiConnect.getCategoryList()
        ]);
        this.setState({ categories });
        this.formCategoryChartData();
     }

    private createCategory = (parent) => {
        this.categoryDialog.createCategory(parent)
            .then(c => debug("Created new category", c))
            .then(c => this.reloadCategories(null));
    }

    private editCategory = (category) => {
        this.categoryDialog.editCategory(category)
            .then(c => debug("Modified category", c))
            .then(c => this.reloadCategories(null));
    }

    public componentDidMount() {
        const end = moment().endOf("month");
        const endDate = end.toDate();
        const startDate = end.clone().startOf("year").toDate();

        this.setState({
            startDate,
            endDate,
            categories: state.get("categories"),
            categoryExpenses: {},
            categoryTotals: {},
        });
        this.startDateStr = new Bacon.Bus();
        this.endDateStr = new Bacon.Bus();
        this.datesStr = Bacon.combineTemplate({
            start: this.startDateStr.toProperty(startDate),
            end: this.endDateStr.toProperty(endDate),
            reload: reloadStream.toProperty(true)
        });

        this.unsub = [];
        this.startDateStr.onValue(d => this.setState({ startDate: d }));
        this.endDateStr.onValue(d => this.setState({ endDate: d }));
        this.unsub.push(this.startDateStr, this.endDateStr, this.datesStr);
        this.datesStr.onValue(this.reloadCategories);
        this.reloadCategories(this.datesStr);

        this.startDateStr.push(startDate);
        this.endDateStr.push(endDate);
    }

    public componentWillUnmount() {
        unsubscribeAll(this.unsub);
        this.unsub = [];
    }

    private TimeSelector = () => {
        return (
            <div className="bk-table-row category-table-time-select no-border">
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
        );
    }

    private CategoryTable = ({ categories, categoryTotals, categoryExpenses, categoryChartData }) => {
        return (
            <div className="category-table">
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
        );
    }

    private CategoryHeader = () => {
        return (
            <div className="category-table-row category-table-header header no-border">
                <div className="category-name">Nimi</div>
                <div className="category-totals">Kulut / Tulot</div>
                <div className="category-tools">
                    <AddCategoryButton onAdd={this.createCategory}/>
                </div>
            </div>
        );
    }

    public render() {
        return (
            <div className="content">
                <this.CategoryTable
                    categories={this.state.categories}
                    categoryTotals={this.state.categoryTotals}
                    categoryExpenses={this.state.categoryExpenses}
                    categoryChartData={this.state.categoryChartData}/>
                <CategoryDialog ref={r => this.categoryDialog = r}/>
            </div>
        );
    }

}
