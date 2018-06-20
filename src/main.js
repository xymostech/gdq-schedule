import React from "react";
import ReactDOM from "react-dom";
import "normalize.css";

import Shell from "./shell.js";
import Schedule from "./schedule.js";
import PastList from "./past-list.js";
import {current, past} from "./gdq-data.js";

class ScheduleApp extends React.Component {
    render() {
        return (
            <Shell>
                <Schedule
                    {...this.props}
                />
            </Shell>
        );
    }
}

class PastListApp extends React.Component {
    render() {
        return (
            <Shell>
                <PastList />
            </Shell>
        );
    }
}

class FourOhFourApp extends React.Component {
    render() {
        return (
            <Shell>
                404!
            </Shell>
        );
    }
}

const pastRe = /\/past\/([a-z0-9-]+)/;

if (document.location.pathname === "/") {
    ReactDOM.render(<ScheduleApp
        {...current}
    />, document.getElementById("main"));
} else if (document.location.pathname === "/past") {
    ReactDOM.render(<PastListApp />, document.getElementById("main"));
} else if (pastRe.test(document.location.pathname)) {
    const match = document.location.pathname.match(pastRe);
    if (!(match[1] in past)) {
        ReactDOM.render(<FourOhFourApp />, document.getElementById("main"));
    } else {
        ReactDOM.render(<ScheduleApp
            {...past[match[1]]}
        />, document.getElementById("main"));
    }
} else {
    ReactDOM.render(<FourOhFourApp />, document.getElementById("main"));
}
