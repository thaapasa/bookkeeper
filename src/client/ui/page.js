import React from "react"

var request = require('superagent');


export default class BookkeeperPage extends React.Component {

    constructor(props) {
        super(props)
        console.log("Initializing calculators")
        this.state = { users : [] } ;
        this.showValue = this.showValue.bind(this)
    }

    componentDidMount() {
        this.getUsers(u => this.setState({users:u}));
    }

    showValue(value) {
        //this.refs.lastValue.setValue(value)
    }


    getUsers(callback) {
        var url = 'http://localhost:3000/api/users';
        request.get(url, function(err, res) {
            //console.log('Response ok:', response.ok);
            if (!err) {
                console.log('Response body:', res.body);
                callback(res.body);
            }
        });

    }

    render() {

        console.log("Got users: ");

        return <div>{this.state.users.map(u => <div key={u}>{u}</div>)}</div>
        /*<div className="everything">
            <div className="main-content">
            <div className="section-row">
            <Numbers onValue={this.showValue} />
    <Colors onValue={this.showValue} />
    </div>
        <div className="section-row">
            <Identifiers onValue={this.showValue} />
    <DateTime onValue={this.showValue} />
    </div>
        <TextConversion onValue={this.showValue} />
    <Cryptography onValue={this.showValue} />
    </div>
        </div>*/
    }
}
