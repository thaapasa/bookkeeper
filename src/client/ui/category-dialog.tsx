"use strict";

import * as React from 'react';
import Dialog from "material-ui/Dialog"
import FlatButton from "material-ui/FlatButton"
import TextField from "material-ui/TextField"
import SelectField from "material-ui/SelectField"
import MenuItem from "material-ui/MenuItem"
import * as apiConnect from "../data/api-connect"
import * as state from "../data/state"
import * as categories from  "../data/categories"
const Promise = require("bluebird");

const defaultCategory = [ { id: 0, name: "[Ei yläkategoriaa]" }];

export default class CategoryDialog extends React.Component<any, any> {

    private categories: any[];
    private resolve: any;
    private reject: any;

    constructor(props) {
        super(props);

        this.state = {
            open: false,
            name: "",
            parentId: 0,
            id: 0,
            createNew: false,
            valid: false
        };
        this.categories = [];
        this.resolve = null;
        this.reject = null;

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
        return this.startEditing({ open: true, name: "", parentId: parent && parent.id || 0, createNew: true, id: 0, valid: true });
    }

    editCategory(category) {
        console.log("Edit category", category);
        return this.startEditing({ open: true, name: category.name, parentId: category.parentId || 0, createNew: false, id: category.id, valid: true });
    }

    startEditing(s) {
        this.updateCategories();
        const resolvers = {};
        const promise = new Promise((res, rej) => { this.resolve = res; this.reject = rej; });
        this.setState(Object.assign(s, resolvers));
        return promise;
    }

    update(name) {
        this.setState({
            name: name,
            valid: name && name.length > 0
        });
    }

    closeDialog(data) {
        console.log("Closing dialog");
        this.setState({ open: false });
        this.resolve && this.resolve(data);
        return false;
    }

    requestSave(event) {
        event.preventDefault();
        event.stopPropagation();
        this.setState(s => {
            this.saveCategory(s);
            return s;
        });
    }

    saveCategory(s) {
        const createNew = !s.id;
        const name = s.name;

        const data = {
            name: s.name,
            parentId: s.parentId
        };
        console.log("Save", data);
        (createNew ? apiConnect.storeCategory(data) : apiConnect.updateCategory(s.id, data))
            .then(e => {
                this.closeDialog(e);
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
                onTouchTap={() => this.closeDialog(null)} />,
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
                    onRequestClose={() => this.closeDialog(null)}>
            <form onSubmit={this.requestSave} /*onKeyUp={this.handleKeyPress}*/>
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
                    value={ this.state.parentId }
                    floatingLabelText="Yläkategoria"
                    floatingLabelFixed={true}
                    style={{ width: "100%" }}
                    onChange={(i, j, v) => this.setState({ parentId: v}) }>
                    { this.categories.map((row) => (
                        <MenuItem key={row.id} value={row.id} primaryText={row.name} />
                    ))}
                </SelectField>
            </form>
        </Dialog>
    }
}
