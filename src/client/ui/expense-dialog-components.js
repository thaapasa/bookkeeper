"use strict";
import React from 'react';
import DatePicker from 'material-ui/DatePicker';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import AutoComplete from 'material-ui/AutoComplete';
const moment = require("moment");

const styles = {
    category: { width: "50%" }
};

export function SumField(props) {
    return <TextField
        style={props.style}
        hintText="0.00"
        floatingLabelText="Summa"
        floatingLabelFixed={true}
        value={props.value}
        onChange={i => props.onChange(i.target.value)} />
}

export function DescriptionField(props) {
    return <AutoComplete
        hintText="Ruokaostokset"
        floatingLabelFixed={true}
        floatingLabelText="Kuvaus"
        searchText={props.value}
        filter={AutoComplete.caseInsensitiveFilter}
        onNewRequest={(v) => props.onSelect(v.value)}
        fullWidth={true}
        dataSource={props.dataSource}
        onUpdateInput={(v) => props.onChange(v.value)} />
}

export function CategorySelector(props) {
    return <div>
        <DropDownMenu
            key="category"
            value={ props.category }
            style={ styles.category }
            autoWidth={false}
            onChange={(i, j, v) => props.onChangeCategory(v)}>
            { props.categories.map((row) => (
                <MenuItem key={row.id} value={row.id} primaryText={row.name} />
            ))}
        </DropDownMenu>
        <DropDownMenu
            key="subcategory"
            value={ props.subcategory }
            style={ styles.category }
            autoWidth={false}
            onChange={(i, j, v) => props.onChangeSubcategory(v)}>
            { props.subcategories.map(row =>
                <MenuItem key={row.id} value={row.id} primaryText={row.name} />
            )}
        </DropDownMenu>
    </div>
}

export function SourceSelector(props) {
    return <DropDownMenu
        value={props.value}
        style={props.style}
        autoWidth={false}
        onChange={(i, j, v) => props.onChange(v)}>
        { props.sources.map((row) =>
            <MenuItem key={row.id} value={row.id} primaryText={row.name}/>
        )}
    </DropDownMenu>
}

export function DateField(props) {
    return <DatePicker
        value={props.value}
        formatDate={d => moment(d).format("D.M.YYYY")}
        floatingLabelText="Päivämäärä"
        floatingLabelFixed={true}
        fullWidth={true}
        autoOk={true}
        onChange={(event, date) => props.onChange(date)} />
}

export function ReceiverField(props) {
    return <TextField
        hintText="Kauppa"
        floatingLabelText="Saaja"
        floatingLabelFixed={true}
        fullWidth={true}
        value={props.value}
        onChange={i => props.onChange(i.target.value)}
    />
}
