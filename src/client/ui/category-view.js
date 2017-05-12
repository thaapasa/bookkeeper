import React from "react"
import * as state from "../data/state"

const CategoryRow = ({ category }) => <div className="bk-table-row">
    <div>{category.name}</div>
</div>;

const CategoryHeader = () => <div className="bk-table-header bk-table-row header">
    <div>Nimi</div>
</div>;

const CategoryTable = ({ categories }) => <div className="bk-table">
    <CategoryHeader />
    <div className="category-data-area bk-table-data-area">
        { categories.map(c => <CategoryRow key={c.id} category={c} />) }
    </div>
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
