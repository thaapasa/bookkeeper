import React from "react"
import TopBar from "./topbar"
import LoginView from "./loginview"
import request from "superagent"
import * as state from  "../state";

export default class BookkeeperPage extends React.Component {

    constructor(props) {
        super(props);
        console.log("Initializing calculators");
        this.state = { loggedin : false, currentUser: undefined, users : [], expenses : [] };
        this.showValue = this.showValue.bind(this);
    }

    componentDidMount() {
        this.getUsers(u => this.setState({ users: u }));
        this.getExpenses(e => this.setState({ expenses: e }));
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
        if (!this.state.loggedin) {
            return <div className="everything">
                <LoginView onLogin={u => this.setState({ currentUser: u, loggedin: true })}/>
            </div>
        } else {
            return <div className="everything">
                <TopBar/>
                <div className="main-content">
                    <div><div>Hei! {state.get("currentUser").firstname}</div>
                        {this.state.users.map(u => <div key={u}>{u}</div>)}
                        {this.state.expenses.map(e => <div key={e.id}>{e.user} {e.amount}</div>)}</div>
                </div>
            </div>
        }
    }
}
