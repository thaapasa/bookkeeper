import * as React from 'react';
import * as Bacon from "baconjs";
import DatePicker from "material-ui/DatePicker";
import DropDownMenu from "material-ui/DropDownMenu";
import Checkbox from "material-ui/Checkbox";
import MenuItem from "material-ui/MenuItem";
import TextField from "material-ui/TextField";
import AutoComplete from "material-ui/AutoComplete";
import {Expense,Income} from "../icons";
import * as apiConnect from "../../data/api-connect";
import {PlainAutoComplete} from "../component/plain-text-field";
import {stopEventPropagation} from "../../util/client-util";
import PropTypes from "prop-types";
const moment = require("moment");

const styles = {
    category: { width: "50%" }
};

export function SumField(props: {
    value: string,
    errorText?: string,
    onChange: (string) => void,
    theRef?: any
}) {
    return <TextField
        ref={props.theRef}
        hintText="0.00"
        floatingLabelText="Summa"
        floatingLabelFixed={true}
        value={props.value}
        errorText={props.errorText}
        onChange={(i, e) => props.onChange(e)} />
}

export function TitleField(props: {
    value: string,
    errorText?: string,
    dataSource: any[],
    onChange: (s: string) => void,
    onSelect: (s: string) => void,
}) {
    return <AutoComplete
        hintText="Ruokaostokset"
        floatingLabelFixed={true}
        floatingLabelText="Kuvaus"
        searchText={props.value}
        filter={AutoComplete.caseInsensitiveFilter}
        onNewRequest={(v) => (typeof v === "object") ? props.onSelect(v.value) : ""}
        errorText={props.errorText}
        fullWidth={true}
        onKeyUp={stopEventPropagation}
        dataSource={props.dataSource}
        onUpdateInput={(v) => props.onChange(v)} />
}

export function CategorySelector(props: {
    category: number,
    subcategory: number,
    categories: any[],
    subcategories: any[],
    onChangeCategory: (id: number) => void,
    onChangeSubcategory: (id: number) => void,
    errorText?: string,
}) {
    return <div onKeyUp={stopEventPropagation}>
        <DropDownMenu
            key="category"
            value={ props.category }
            style={ styles.category }
            // autoWidth={false}
            // onKeyUp={stopEventPropagation}
            onChange={(i, j, v) => props.onChangeCategory(v)}>
            { props.categories.map((row) => (
                <MenuItem key={row.id} value={row.id} primaryText={row.name} />
            ))}
        </DropDownMenu>
        <DropDownMenu
            key="subcategory"
            value={ props.subcategory }
            style={ styles.category }
            // autoWidth={false}
            // onKeyUp={stopEventPropagation}
            onChange={(i, j, v) => props.onChangeSubcategory(v)}>
            { props.subcategories.map(row =>
                <MenuItem key={row.id} value={row.id} primaryText={row.name} />
            )}
        </DropDownMenu>
        { props.errorText ? [<br key="br"/>, <div className="error-text" key="error">{ props.errorText }</div> ] : null }
    </div>
}

export function SourceSelector(props: {
    value: number,
    onChange: (id: number) => void,
    sources: any[],
    style?: any,
}) {
    return <DropDownMenu
        value={props.value}
        style={props.style}
        // autoWidth={false}
        onChange={(i, j, v) => props.onChange(v)}>
        { props.sources.map((row) =>
            <MenuItem key={row.id} value={row.id} primaryText={row.name}/>
        )}
    </DropDownMenu>
}

export function TypeSelector(props: {
    value: string,
    onChange: (string) => void,
}) {
    return <Checkbox
        label={props.value === "income" ? "Tulo" : "Kulu"}
        checkedIcon={<Income />}
        uncheckedIcon={<Expense />}
        checked={props.value === "income"}
        onCheck={(e, v) => props.onChange(v ? "income" : "expense")} />
}

export function DateField(props: {
    value: Date,
    onChange: (date: Date) => void,
}) {
    return <DatePicker
        value={props.value}
        formatDate={d => moment(d).format("D.M.YYYY")}
        floatingLabelText="Päivämäärä"
        //floatingLabelFixed={true}
        fullWidth={true}
        autoOk={true}
        onChange={(event, date) => props.onChange(date)} />
}

export class ReceiverField extends React.Component<{
    name?: string,
    id?: string,
    hintText?: string,
    value: string,
    errorText?: string,
    onChange: (r: string) => void,
    onBlur?: () => void,
    onKeyUp?: (event: any) => void,
    editorType?: any,
}, any> {

    private inputStream: any;
    private unsub: any[];
    private ref: any;

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

export function PlainReceiverField(props) {
    return React.createElement(ReceiverField, Object.assign({}, props, { editorType: PlainAutoComplete }));
}

export function DescriptionField(props: {
    value: string,
    errorText?: string,
    onChange: (s: string) => void,
}) {
    return <TextField
        multiLine={true}
        hintText="Tarkempi selite"
        floatingLabelText="Selite"
        floatingLabelFixed={true}
        fullWidth={true}
        errorText={props.errorText}
        value={props.value}
        onChange={(i, e) => props.onChange(e)}
    />
}
