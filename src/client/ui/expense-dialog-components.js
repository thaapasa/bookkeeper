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
        hintText="0.00"
        floatingLabelText="Summa"
        floatingLabelFixed={true}
        value={props.value}
        errorText={props.errorText}
        onChange={i => props.onChange(i.target.value)} />
}
SumField.propTypes = {
    value: React.PropTypes.string.isRequired,
    errorText: React.PropTypes.string,
    onChange: React.PropTypes.func.isRequired
};

export function TitleField(props) {
    return <AutoComplete
        hintText="Ruokaostokset"
        floatingLabelFixed={true}
        floatingLabelText="Kuvaus"
        searchText={props.value}
        filter={AutoComplete.caseInsensitiveFilter}
        onNewRequest={(v) => props.onSelect(v.value)}
        errorText={props.errorText}
        fullWidth={true}
        dataSource={props.dataSource}
        onUpdateInput={(v) => props.onChange(v)} />
}
TitleField.propTypes = {
    value: React.PropTypes.string.isRequired,
    errorText: React.PropTypes.string,
    dataSource: React.PropTypes.array.isRequired,
    onChange: React.PropTypes.func.isRequired,
    onSelect: React.PropTypes.func.isRequired
};

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
        { props.errorText ? [<br key="br"/>, <div className="error-text" key="error">{ props.errorText }</div> ] : null }
    </div>
}
CategorySelector.propTypes = {
    category: React.PropTypes.number.isRequired,
    subcategory: React.PropTypes.number.isRequired,
    subcategories: React.PropTypes.array.isRequired,
    errorText: React.PropTypes.string
};

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
SourceSelector.propTypes = {
    value: React.PropTypes.number.isRequired,
    onChange: React.PropTypes.func.isRequired,
    sources: React.PropTypes.array.isRequired
};

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
DateField.propTypes = {
    value: React.PropTypes.instanceOf(Date),
    onChange: React.PropTypes.func.isRequired
};

export function ReceiverField(props) {
    return <TextField
        hintText="Kauppa"
        floatingLabelText="Saaja"
        floatingLabelFixed={true}
        fullWidth={true}
        errorText={props.errorText}
        value={props.value}
        onChange={i => props.onChange(i.target.value)}
    />
}
ReceiverField.propTypes = {
    value: React.PropTypes.string.isRequired,
    errorText: React.PropTypes.string,
    onChange: React.PropTypes.func.isRequired
};

export function DescriptionField(props) {
    return <TextField
        multiLine={true}
        hintText="Tarkempi selite"
        floatingLabelText="Selite"
        floatingLabelFixed={true}
        fullWidth={true}
        errorText={props.errorText}
        value={props.value}
        onChange={i => props.onChange(i.target.value)}
    />
}
DescriptionField.propTypes = {
    value: React.PropTypes.string.isRequired,
    errorText: React.PropTypes.string,
    onChange: React.PropTypes.func.isRequired
};
