import React from "react"
//import * as state from  "../state";
//import * as apiConnect from "../api-connect";

export default class ExpenseRow extends React.Component {

    constructor(props) {
        super(props);
        this.state = { expense : this.props.expense };
    }

    componentDidMount() {

    }

    render() {
        return <div className="expense">
            <span>{this.state.expense.date}</span>
            <span>{this.state.expense.description}</span>
            <span>{this.state.expense.category}</span>
            <span>{this.state.expense.sum}</span>
        </div>;
    }
}
