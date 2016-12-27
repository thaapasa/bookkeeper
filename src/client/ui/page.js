import React from "react"
import TopBar from "./topbar"
import MonthView from "./monthview"
import request from "superagent"
import * as state from  "../state";
import * as apiConnect from "../api-connect";

export default class BookkeeperPage extends React.Component {

    constructor(props) {
        super(props);
        console.log("Initializing bookkeeper");
        this.state = { loggedin : false, currentUser: undefined, users : [], expenses : [] };
        this.showValue = this.showValue.bind(this);
    }

    componentDidMount() {

        if (this.state.loggedin === true && typeof this.state.currentUser !== "undefined") {
            apiConnect.getExpenses(sessionStorage.getItem("token"))
                .then(e => {
                    console.log("Got expenses", e);
                    this.setState({ expenses: e })
                });
        }
        //this.getUsers(u => this.setState({ users: u }));
        //this.getExpenses(e => this.setState({ expenses: e }));
    }

    showValue(value) {
        //this.refs.lastValue.setValue(value)
    }

    getUsers(callback) {
        const url = 'http://localhost:3000/api/user/list';
        request.get(url, function(err, res) {
            //console.log('Response ok:', response.ok);
            if (!err) {
                console.log('Response body:', res.body);
                callback(res.body);
            }
        });

    }

    getExpenses(callback) {
        var url = 'http://localhost:3000/api/expense/list';
        request.get(url, function(err, res) {
            //console.log('Response ok:', response.ok);
            if (!err) {
                console.log('Response body:', res.body);
                callback(res.body);
            }
        });

    }

    render() {
        console.log("render");
        return <div className="everything">
            <TopBar/>
            <div className="main-content">
                <div>Hei {state.get("currentUser").user.firstname}!</div>
                <div><MonthView/></div>
            </div>
        </div>;
    }
}
