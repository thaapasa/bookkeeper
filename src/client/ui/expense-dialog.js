"use strict";
import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import DatePicker from 'material-ui/DatePicker';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';

import * as state from "../data/state"

const fields = ["description", "date", "account", "category", "target", "sum"];

export default class ExpenseDialog extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            open: false,
            createNew: true,
        };
        fields.forEach(f => this.state[f] = "");
        this.handleClose = this.handleClose.bind(this);
        this.handleSave = this.handleSave.bind(this);
    }

    handleOpen(expense) {
        console.log("handleOpen")
        const newState = { open: true, createNew: expense === undefined };
        fields.forEach(f => this.state[f] = expense ? expense[f] : "");
        this.setState(newState);
    };

    handleClose() {
        console.log("closing dialog");
        this.setState({open: false});
    };

    handleSave() {
        console.log("Saving expense");
        this.setState({open: false});
        //TODO: Save new expense
    };
    componentDidMount() {
        state.get("expenseDialogStream").onValue(e => {console.log("dialog onValue"); this.handleOpen(e)});
    }

    render() {
        const actions = [
            <FlatButton
                label="Peruuta"
                primary={true}
                keyboardFocused={true}
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
                    <TextField
                        hintText="Kuvaus"
                        floatingLabelText="Kuvaus"
                        value={this.state.description}
                        onChange={i => this.setState({description: i.target.value})}
                    /><br />
                    <DatePicker hintText="Päivämäärä" /><br/>
                    <DropDownMenu
                        value={this.state.category}
                        onChange={(i, j, v) => this.setState({ category: v })}
                        /*
                         onChange={i => this.setState({category: i})}
                        style={styles.customWidth}
                        autoWidth={false}*/
                    >
                        <MenuItem value={"FOOD"} primaryText="Ruoka" />
                        <MenuItem value={"ENTERTAINMENT"} primaryText="Viihde" />
                    </DropDownMenu><br/>
                    <DropDownMenu
                        value={1}
                        /*onChange={this.handleChange}
                         style={styles.customWidth}
                         autoWidth={false}*/
                    >
                        <MenuItem value={1} primaryText="Custom width" />
                        <MenuItem value={2} primaryText="Every Night" />
                        <MenuItem value={3} primaryText="Weeknights" />
                        <MenuItem value={4} primaryText="Weekends" />
                        <MenuItem value={5} primaryText="Weekly" />
                    </DropDownMenu><br/>
                    <TextField
                        hintText="Saaja"
                        floatingLabelText="Saaja"
                    /><br />

                    <TextField
                        hintText="Summa"
                        floatingLabelText="Summa"
                    /><br />
                </Dialog>
        );
    }
}
