"use strict";

import React from "react"
import {Add,Edit,ToolIcon} from "./icons"
import CategoryDialog from "./category-dialog"
import * as state from "../data/state"
import * as colors from "../ui/colors"
import * as apiConnect from "../data/api-connect"

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

const CategoryTable = ({ categories, onAdd, onEdit }) => <div className="bk-table category-table">
    <CategoryHeader onAdd={onAdd}/>
    <div className="category-data-area bk-table-data-area">
        { categories.map(c => [<CategoryRow key={c.id} category={c} header={true} onAdd={onAdd} onEdit={onEdit} />]
            .concat(c.children.map(ch => <CategoryRow key={ch.id} category={ch} onAdd={onAdd} onEdit={onEdit} /> ))) }
    </div>
</div>;

const CategoryHeader = ({onAdd }) => <div className="bk-table-header bk-table-row category-table-row header">
    <div className="category-name">Nimi</div>
    <div className="category-tools">
        <AddCategoryButton onAdd={onAdd} />
    </div>
</div>;

const CategoryRow = ({ category, onAdd, onEdit, header = false }) => <div className="bk-table-row category-table-row" style={ styles[header ? "mainCategory" : "category"]}>
    <div className="category-name">{category.name}</div>
    <div className="category-tools">
        { header ? <AddCategoryButton parent={category} color={colors.white} onAdd={onAdd} /> : null }
        <EditCategoryButton category={category} color={header ? colors.white : null} onEdit={onEdit} />
    </div>
</div>;

export default class CategoryView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            categories: state.get("categories")
        };
        this.createCategory = this.createCategory.bind(this);
        this.editCategory = this.editCategory.bind(this);
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

    render() {
        return <div className="content">
            <CategoryTable
                categories={this.state.categories}
                onAdd={this.createCategory}
                onEdit={this.editCategory} />
            <CategoryDialog ref={r => this.categoryDialog = r}/>
        </div>
    }

}
