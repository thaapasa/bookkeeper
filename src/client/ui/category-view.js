import React from "react"
import * as state from "../data/state"

export default class CategoryView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            categories: state.get("categories")
        };
    }

    render() {
        return <div className="content">
            { this.state.categories.map(c => <div key={c.id}>
                <div>Category { c.name }</div>
            </div>) }
        </div>
    }
}
