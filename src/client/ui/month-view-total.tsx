import * as React from 'react';
import Divider from 'material-ui/Divider';

import * as apiConnect from "../data/api-connect";
import * as state from  "../data/state";
import * as time from "../../shared/util/time"
const moment = require("moment");

export default class MonthViewTotal extends React.Component<{}, {}> {

    public static getYearMonthString(date) {
        return time.getFinnishMonthName(date.month() + 1) + " " + date.year();
    }

    public render() {
        return <div>
                    Yhteensä:<br/>
                    Tulot: "100.00 €"<br/>
                    Kulut: "-200.00 €"<br/>
                    Tilanne: "-345.00 €"<br/>
                </div>
    }
}
