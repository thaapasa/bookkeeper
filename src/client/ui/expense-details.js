import React from "react"
import * as state from  "../data/state";

export default class ExpenseDetails extends React.Component {

    constructor(props) {
        super(props);
        this.userMap = state.get("userMap");
    }

    render() {
        return <div className="expense-division">
            { this.props.division.map(d => <div key={ `${d.type}-${d.userId}` }>
                { this.userMap[d.userId].firstName }:  { d.type } { d.sum }
            </div>)}
        </div>
    }
}
