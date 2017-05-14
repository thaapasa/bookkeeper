"use strict";

import React from "react"
import Dialog from "material-ui/Dialog"
import FlatButton from "material-ui/FlatButton"
import TextField from "material-ui/TextField"
import SelectField from "material-ui/SelectField"
import MenuItem from "material-ui/MenuItem"
import * as apiConnect from "../data/api-connect"
import * as state from "../data/state"
import * as categories from  "../data/categories"

const defaultCategory = [ { id: 0, name: "[Ei yläkategoriaa]" }];

export default class CategoryDialog extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            open: false,
            name: "",
            parent: 0,
            createNew: false,
            valid: false
        };
        this.categories = [];

        this.requestSave = this.requestSave.bind(this);
        this.closeDialog = this.closeDialog.bind(this);
        this.createCategory = this.createCategory.bind(this);
        this.editCategory = this.editCategory.bind(this);
        this.update = this.update.bind(this);

        this.updateCategories();
    }

    updateCategories() {
        const cats = state.get("categories");
        this.categories = defaultCategory.concat(cats);
    }

    createCategory(parent) {
        console.log("Create category under", parent);
        this.updateCategories();
        this.setState({ open: true, name: "", parent: parent && parent.id || 0, createNew: true });
    }

    editCategory(category) {
        console.log("Edit category", category);
        this.updateCategories();
        this.setState({ open: true, name: category.name, parent: category.parentId || 0, createNew: false });
    }

    update(name) {
        this.setState({
            name: name,
            valid: name && name.length > 0
        });
    }

    closeDialog() {
        console.log("Closing dialog");
        this.setState({ open: false });
        return false;
    }

    requestSave(event) {
        event.preventDefault();
        event.stopPropagation();
        this.saveExpense({ name: "Miimaa" });
    }

    saveExpense(category) {
        console.log("Save", category);
        const createNew = !category.id;
        const name = category.name;

        const data = {
            name: category.name,
            parent: category.parent
        };
        (createNew ? apiConnect.storeCategory(data) : apiConnect.updateCategory(category.id, data))
            .then(e => {
                this.closeDialog();
                state.notify(`${createNew ? "Tallennettu" : "Päivitetty"} ${name}`);
                return null;
            })
            .catch(e => {
                state.notifyError(`Virhe ${createNew ? "tallennettaessa" : "päivitettäessä"} kirjausta ${name}`, e);
                return null;
            });
    }

    render() {
        const actions = [
            <FlatButton
                label="Peruuta"
                primary={true}
                onTouchTap={this.closeDialog} />,
            <FlatButton
                label="Tallenna"
                primary={true}
                disabled={!this.state.valid}
                keyboardFocused={true}
                onTouchTap={this.requestSave} />
        ];

        return <Dialog
                    contentClassName="category-dialog"
                    title={ this.state.createNew ? "Uusi kategoria" : "Muokkaa kategoriaa" }
                    actions={actions}
                    modal={true}
                    autoDetectWindowHeight={true}
                    autoScrollBodyContent={true}
                    open={this.state.open}
                    onRequestClose={this.closeDialog}>
            <form onSubmit={this.requestSave} onKeyUp={this.handleKeyPress}>
                <TextField
                    key="name"
                    hintText="Nimi"
                    floatingLabelText="Nimi"
                    floatingLabelFixed={true}
                    fullWidth={true}
                    value={this.state.name}
                    onChange={(e, n) => this.update(n)}
                />
                <SelectField
                    key="category"
                    value={ this.state.parent }
                    floatingLabelText="Yläkategoria"
                    floatingLabelFixed={true}
                    style={{ width: "100%" }}
                    onChange={(i, j, v) => this.setState({ parent: v}) }>
                    { this.categories.map((row) => (
                        <MenuItem key={row.id} value={row.id} primaryText={row.name} />
                    ))}
                </SelectField>
            </form>
        </Dialog>
    }
}
