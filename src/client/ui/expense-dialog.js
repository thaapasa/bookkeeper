"use strict";
import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import DatePicker from 'material-ui/DatePicker';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';

import * as state from "../data/state"

export default class ExpenseDialog extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            open: false,
            expense: undefined
        };
        this.handleClose = this.handleClose.bind(this);
    }

    handleOpen(expense) {
        console.log("handleOpen")
        this.setState({open: true, expense : expense})
    };

    handleClose() {
        console.log("closing dialog");
        this.setState({open: false, expense : undefined});
    };

    componentDidMount() {
        state.get("expenseDialogStream").onValue(e => {console.log("dialog onValue"); this.handleOpen(e)});
    }

    render() {
        const actions = [
            <FlatButton
                label="Ok"
                primary={true}
                keyboardFocused={true}
                onTouchTap={this.handleClose}
            />
        ];

        return (
                <Dialog
                    title={ typeof this.state.expense === "undefined" ? "Uusi kirjaus" : "Muokkaa kirjausta"}
                    actions={actions}
                    modal={false}
                    open={this.state.open}
                    onRequestClose={this.handleClose}
                >
                    <TextField
                        hintText="Kuvaus"
                        floatingLabelText="Kuvaus"
                    /><br />
                    <DatePicker hintText="Päivämäärä" /><br/>
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
