import React from "react"
import TopBar from "./topbar"
import LoginView from "./loginview"
import request from "superagent"
import * as state from  "../state";
import * as apiConnect from "../api-connect";

export default class BookkeeperPage extends React.Component {

    constructor(props) {
        super(props);
        console.log("Initializing calculators");
        this.state = { loggedin : false, currentUser: undefined, users : [], expenses : [] };
        this.showValue = this.showValue.bind(this);
    }

    componentDidMount() {
        if (this.state.loggedin === false && sessionStorage.getItem("token")) {
            console.log("not logged in but session token exists in sessionStorage", sessionStorage.getItem("token"));
            apiConnect.getSession(sessionStorage.getItem("token"))
                .then(u => {
                    console.log("got session", u);
                    state.set("currentUser", u);
                    this.setState({ currentUser: u, loggedin: true});
                    sessionStorage.setItem('token', u.token);
                });
        }
        apiConnect.getExpenses(sessionStorage.getItem("token"))
            .then(e => {
                console.log("Got expenses", e);
                this.setState({ expenses: e })
            });
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
        if (!this.state.loggedin) {
            return <div className="everything">
                <LoginView onLogin={u => this.setState({ currentUser: u, loggedin: true })}/>
            </div>
        } else {
            return <div className="everything">
                <TopBar/>
                <div className="main-content">
                    <div><div>Hei {state.get("currentUser").user.firstname}!</div>
                        {console.log("Rendering expenses", this.state.expenses)}{this.state.expenses.map(e => <div key={e.id}>{e.description} {e.sum}</div>)}</div>
                </div>
            </div>
        }
    }
}
