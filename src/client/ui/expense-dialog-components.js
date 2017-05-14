"use strict";
import React from "react";
import * as Bacon from "baconjs";
import DatePicker from "material-ui/DatePicker";
import DropDownMenu from "material-ui/DropDownMenu";
import Checkbox from "material-ui/Checkbox";
import MenuItem from "material-ui/MenuItem";
import TextField from "material-ui/TextField";
import AutoComplete from "material-ui/AutoComplete";
import {Expense,Income} from "./icons";
import * as apiConnect from "../data/api-connect";
import {PlainAutoComplete} from "./plain-text-field";
import {stopEventPropagation} from "../util/client-util";
import PropTypes from "prop-types";
const moment = require("moment");

const styles = {
    category: { width: "50%" }
};

export function SumField(props) {
    return <TextField
        ref={props.theRef}
        hintText="0.00"
        floatingLabelText="Summa"
        floatingLabelFixed={true}
        value={props.value}
        errorText={props.errorText}
        onChange={i => props.onChange(i.target.value)} />
}
SumField.propTypes = {
    value: PropTypes.string.isRequired,
    errorText: PropTypes.string,
    onChange: PropTypes.func.isRequired
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
        onKeyUp={stopEventPropagation}
        dataSource={props.dataSource}
        onUpdateInput={(v) => props.onChange(v)} />
}
TitleField.propTypes = {
    value: PropTypes.string.isRequired,
    errorText: PropTypes.string,
    dataSource: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired
};

export function CategorySelector(props) {
    return <div onKeyUp={stopEventPropagation}>
        <DropDownMenu
            key="category"
            value={ props.category }
            style={ styles.category }
            autoWidth={false}
            onKeyUp={stopEventPropagation}
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
            onKeyUp={stopEventPropagation}
            onChange={(i, j, v) => props.onChangeSubcategory(v)}>
            { props.subcategories.map(row =>
                <MenuItem key={row.id} value={row.id} primaryText={row.name} />
            )}
        </DropDownMenu>
        { props.errorText ? [<br key="br"/>, <div className="error-text" key="error">{ props.errorText }</div> ] : null }
    </div>
}
CategorySelector.propTypes = {
    category: PropTypes.number.isRequired,
    subcategory: PropTypes.number.isRequired,
    subcategories: PropTypes.array.isRequired,
    errorText: PropTypes.string
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
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    sources: PropTypes.array.isRequired
};

export function TypeSelector(props) {
    return <Checkbox
        label={props.value === "income" ? "Tulo" : "Kulu"}
        checkedIcon={<Income />}
        uncheckedIcon={<Expense />}
        checked={props.value === "income"}
        onCheck={(e, v) => props.onChange(v ? "income" : "expense")} />
}
TypeSelector.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
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
    value: PropTypes.instanceOf(Date),
    onChange: PropTypes.func.isRequired
};

export class ReceiverField extends React.Component {
    constructor (props) {
        super(props);
        this.state = { receivers: [] };
        this.focus = this.focus.bind(this);
    }

    componentDidMount() {
        this.inputStream = new Bacon.Bus();
        this.unsub = [];
        this.unsub.push(this.inputStream.onValue(this.props.onChange));
        this.unsub.push(this.inputStream
            .filter(v => v && v.length > 2 && v.length < 10)
            .debounceImmediate(500)
            .flatMapLatest(v => Bacon.fromPromise(apiConnect.queryReceivers(v)))
            .onValue(v => this.setState({ receivers: v })));
        this.unsub.push(this.inputStream
            .filter(v => !v || v.length < 3)
            .onValue(() => this.setState({ receivers: [] })));
    }

    componentWillUnmount() {
        this.inputStream.end();
        this.unsub.forEach(s => s());
    }

    focus() {
        this.ref && this.ref.focus();
    }

    render() {
        const type = this.props.editorType ? this.props.editorType : AutoComplete;
        return React.createElement(type, {
            name: this.props.name,
            id: this.props.id,
            filter: AutoComplete.noFilter,
            onNewRequest: this.focus,
            dataSource: this.state.receivers,
            onUpdateInput: r => this.inputStream.push(r),
            hintText: this.props.hintText || "Kauppa",
            floatingLabelText: "Saaja",
            floatingLabelFixed: true,
            fullWidth: true,
            errorText: this.props.errorText,
            searchText: this.props.value,
            onBlur: this.props.onBlur,
            onKeyUp: this.props.onKeyUp,
            ref: i => this.ref = i
        });
    }
}
ReceiverField.propTypes = {
    name: PropTypes.string,
    id: PropTypes.string,
    hintText: PropTypes.string,
    value: PropTypes.string.isRequired,
    errorText: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func,
    onKeyUp: PropTypes.func
};

export function PlainReceiverField(props) {
    return React.createElement(ReceiverField, Object.assign({}, props, { editorType: PlainAutoComplete }));
}

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
    value: PropTypes.string.isRequired,
    errorText: PropTypes.string,
    onChange: PropTypes.func.isRequired
};
