"use strict";
import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import DatePicker from 'material-ui/DatePicker';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';

import * as apiConnect from "../data/api-connect";
import * as state from "../data/state"
import * as time from "../../shared/util/time"

const fields = ["description", "source", "category", "subcategory", "receiver", "sum"];

const categories = {
    "Ruoka": ["Työpaikkalounas", "Ravintola"],
    "Viihde": ["Lehtitilaukset", "Elokuvat ja sarjat", "Kirjat" ],
    "Asuminen" : [ "Lainanhoito", "Pakolliset", "Sisustus", "Rakentaminen", "Piha" ],
    "Auto" : [ "Polttoaine", "Huollot", "Vakuutukset", "Tarvikkeet" ],
    "Liikkuminen" : [ "Matkakortin lataus", "Polkupyöräily", "Taksi" ],
    "Lomat" : [ "Majoitus", "Matkaliput", "Autonvuokra", "Ruoka", "Nähtävyydet", "Ostokset" ],
    "Muuta" : [ "Lahjat", "Hyväntekeväisyys" ]
};
const categoryList = Object.keys(categories);

const labelStyle = { width : "30px"}

const formFieldStyle = { paddingLeft : "10px" }

const datePickerStyle = { paddingLeft : "10px" }

export default class ExpenseDialog extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            open: false,
            createNew: true,
            date: undefined
        };
        fields.forEach(f => this.state[f] = "");
        this.handleClose = this.handleClose.bind(this);
        this.handleSave = this.handleSave.bind(this);
    }

    handleOpen(expense) {
        console.log("handleOpen")
        const newState = { open: true, createNew: expense === undefined };
        fields.forEach(f => newState[f] = expense ? expense[f] : "");
        newState.date = expense ? time.fromDate(expense.date).toDate() : undefined;
        console.log(newState);
        this.setState(newState);
    };

    handleClose() {
        console.log("closing dialog");
        this.setState({open: false});
    };

    handleSave() {
        console.log("Saving expense");
        this.setState({open: false});
        // TODO: fix group
        apiConnect.storeExpense(sessionStorage.getItem("token"), 1, {
            date: time.date(this.state.date),
            sum: this.state.sum,
            description : this.state.description,
            source: this.state.source,
            category: this.state.category + ":" + this.state.subcategory,
            receiver: this.state.receiver})
            .then(e => {
                console.log("Stored expense", e);
            });


    };
    componentDidMount() {
        state.get("expenseDialogStream").onValue(e => {console.log("dialog onValue"); this.handleOpen(e)});
    }

    render() {
        const actions = [
            <FlatButton
                label="Peruuta"
                primary={true}
                onTouchTap={this.handleClose}
            />,
            <FlatButton
            label="Tallenna"
            primary={true}
            keyboardFocused={true}
            onTouchTap={this.handleSave}
    />
        ];

        return (
                <Dialog
                    title={ typeof this.state.createNew ? "Uusi kirjaus" : "Muokkaa kirjausta"}
                    actions={actions}
                    modal={false}
                    open={this.state.open}
                    onRequestClose={this.handleClose}
                >
                    <label style={labelStyle}>Kuvaus:
                        <TextField
                            hintText="Kuvaus"
                            value={this.state.description}
                            style={ formFieldStyle }
                            onChange={i => this.setState({description: i.target.value})}
                    />
                    </label><br />
                    <label style={labelStyle}>Päivämäärä:
                        <DatePicker
                            value={this.state.date}
                            hintText="Päivämäärä"
                            style={datePickerStyle}
                            onChange={(event, date) => this.setState({ date: date })}/></label><br/>
                    <label style={labelStyle}>Kategoria:
                        <DropDownMenu
                            value={this.state.category}
                            style={ formFieldStyle }
                            onChange={(i, j, v) => this.setState({ category: v })}
                    >
                        { categoryList.map((row, index) => (
                            <MenuItem key={index} value={row} primaryText={row} />
                        ))}
                    </DropDownMenu>
                    </label>
                    <label style={labelStyle}>Alikategoria:
                        <DropDownMenu
                            value={this.state.subcategory}
                            style={ formFieldStyle }
                            onChange={(i, j, v) => this.setState({ subcategory: v })}
                        >
                            { this.state.category && categories[this.state.category].map((row, index) => (
                                <MenuItem key={index} value={row} primaryText={row} />
                            ))}
                        </DropDownMenu>
                    </label><br/>
                    <label style={labelStyle}>Tili:
                        <DropDownMenu
                            value={this.state.source}
                            style={ formFieldStyle }
                            onChange={(i, j, v) => this.setState({ source: v })}
                        >
                            <MenuItem value={"SHARED"} primaryText="Yhteinen tili" />
                            <MenuItem value={"ANU"} primaryText="Anun tili" />
                            <MenuItem value={"TUUKKA"} primaryText="Tuukan tili" />
                        </DropDownMenu>
                    </label><br/>
                    <label style={labelStyle}>Saaja:
                        <TextField
                            hintText="Saaja"
                            style={ formFieldStyle }
                            value={this.state.receiver}
                            onChange={i => this.setState({receiver: i.target.value})}
                        />
                    </label><br />
                    <label style={labelStyle}>Summa:
                        <TextField
                            hintText="Summa"
                            style={ formFieldStyle }
                            value={this.state.sum}
                            onChange={i => this.setState({sum: i.target.value})}

                        />
                    </label><br />
                </Dialog>
        );
    }
}
