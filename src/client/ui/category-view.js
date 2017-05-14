import React from "react"
import * as state from "../data/state"

const styles = {
    mainCategory: {
        background: "rgb(75,154,173)",
        color: "white",
        fontWeight: "bold"
    },
    category: {
        background: "#eeeeee"
    }
};

const CategoryTable = ({ categories }) => <div className="bk-table category-table">
    <CategoryHeader />
    <div className="category-data-area bk-table-data-area">
        { categories.map(c => [<CategoryRow key={c.id} category={c} header={true} />].concat(c.children.map(ch => <CategoryRow key={ch.id} category={ch} /> ))) }
    </div>
</div>;

const CategoryHeader = () => <div className="bk-table-header bk-table-row category-table-row header">
    <div className="category-name">Nimi</div>
    <div className="category-tools">Toiminnot</div>
</div>;

const CategoryRow = ({ category, header = false }) => <div className="bk-table-row category-table-row" style={ styles[header ? "mainCategory" : "category"]}>
    <div className="category-name">{category.name}</div>
    <div className="category-tools">O</div>
</div>;

export default class CategoryView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            categories: state.get("categories")
        };
    }

    render() {
        return <div className="content">
            <CategoryTable categories={this.state.categories} />
        </div>
    }
}
