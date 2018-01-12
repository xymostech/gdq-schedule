import React from "react";
import ReactDOM from "react-dom";
import {StyleSheet, css} from "aphrodite";
import moment from "moment";
import Popover from "react-popover";
import "normalize.css";

import data from "./data.js";

// time, name, runners, duration, setupLength, runKind, platform, host

function parseTime(time) {
    return moment.utc(time).local();
}

data.forEach(function(d) {
    d.time = parseTime(d.time);
    d.duration = moment.duration(d.duration);
    d.setupLength = d.setupLength
        ? moment.duration(d.setupLength)
        : moment.duration(0);
});

function msToMinutes(ms) {
    return ms / 1000 / 60;
}

function startOfDay(date) {
    return date
        .clone()
        .hour(0)
        .minute(0)
        .second(0);
}
function startOfNextDay(date) {
    return startOfDay(date).add(1, "day");
}

const eventStart = moment.utc("2018-01-07T16:30:00Z").local();
const eventDayStart = startOfDay(eventStart);

const days = [{day: eventDayStart, runs: []}];

days[0].runs.push({
    type: "spacer",
    duration: msToMinutes(eventStart.diff(eventDayStart)),
});

data.forEach(function(d) {
    const setupTime = d.time.clone().subtract(d.setupLength);
    const runEndTime = d.time.clone().add(d.duration);

    const setupDate = setupTime.date() - eventDayStart.date();
    const runStartDate = d.time.date() - eventDayStart.date();
    const runEndDate = runEndTime.date() - eventDayStart.date();

    while (days.length <= runEndDate) {
        days.push({day: startOfDay(runEndTime), runs: []});
    }
    if (setupTime.isSame(d.time, "day")) {
        days[setupDate].runs.push({
            type: "setup",
            duration: msToMinutes(d.setupLength.asMilliseconds()),
        });
    } else {
        const runDayStart = startOfDay(d.time);
        days[setupDate].runs.push({
            type: "setup",
            runsOver: true,
            duration: msToMinutes(runDayStart.diff(setupTime)),
            info: d,
        });
        days[runStartDate].runs.push({
            type: "setup",
            runOver: true,
            duration: msToMinutes(d.time.diff(runDayStart)),
            info: d,
        });
    }
    if (d.time.isSame(runEndTime, "day")) {
        days[runStartDate].runs.push({
            type: "run",
            duration: msToMinutes(d.duration.asMilliseconds()),
            info: d,
        });
    } else {
        const runEndDayStart = startOfDay(runEndTime);
        days[runStartDate].runs.push({
            type: "run",
            runsOver: true,
            duration: msToMinutes(runEndDayStart.diff(d.time)),
            info: d,
        });
        days[runEndDate].runs.push({
            type: "run",
            runOver: true,
            duration: msToMinutes(runEndTime.diff(runEndDayStart)),
            info: d,
        });
    }
});

const lastData = data[data.length - 1];
const lastEndTime = lastData.time.clone().add(lastData.duration);
const lastEndDate = lastEndTime.date() - eventDayStart.date();
const lastEndNextDay = startOfNextDay(lastEndTime);

days[lastEndDate].runs.push({
    type: "spacer",
    duration: msToMinutes(lastEndNextDay.diff(lastEndTime)),
});

function formatDuration(duration) {
    let result = "";

    const hours = duration.hours();
    const minutes = duration.minutes();

    if (hours > 0) {
        result += `${hours} ${hours === 1 ? "hour" : "hours"} `;
    }
    if (minutes > 0) {
        result += `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
    }
    return result;
}

class Run extends React.Component {
    state = {
        open: false,
    };

    handleClickIn = e => {
        e.preventDefault();

        this.setState({
            open: !this.state.open,
        });
    };

    handleClickOut = () => {
        this.setState({
            open: false,
        });
    };

    render() {
        const run = this.props.run;
        const info = run.info;

        const isSetup = /SETUP BLOCK/.test(info.name);
        const isDone = info.time
            .clone()
            .add(info.duration)
            .isBefore(this.props.now);

        const popover = (
            <div className={css(styles.popover)}>
                <div>
                    {info.name}
                    {!isSetup && <span> ({info.platform})</span>}
                </div>
                {!isSetup && <div>Runner(s): {info.runners}</div>}
                {!isSetup && <div>{info.runKind}</div>}
                <div>Host: {info.host}</div>
                <div>
                    {info.time.format("h:mm a")} &ndash;{" "}
                    {info.time
                        .clone()
                        .add(info.duration)
                        .format("h:mm a")}{" "}
                    ({formatDuration(info.duration)})
                </div>
            </div>
        );

        return (
            <Popover
                isOpen={this.state.open}
                body={popover}
                onOuterAction={this.handleClickOut}
                enterExitTransitionDurationMs={100}
            >
                <div
                    style={{
                        flex: this.props.run.duration,
                    }}
                    className={css(
                        styles.run,
                        isSetup && styles.setupBlock,
                        isDone && styles.done,
                        this.props.run.runsOver && styles.runsOver,
                        this.props.run.runOver && styles.runOver,
                    )}
                    onClick={this.handleClickIn}
                >
                    {info.name}
                </div>
            </Popover>
        );
    }
}

function range(n) {
    const arr = [];
    for (let i = 0; i < n; i++) {
        arr.push(i);
    }
    return arr;
}

class App extends React.Component {
    state = {
        now: moment(),
    };

    componentDidMount() {
        this._refreshTimer = setInterval(() => {
            this.setState({
                now: moment(),
            });
        }, 1000 * 15);
    }

    componentWillUnmount() {
        clearInterval(this._refreshTimer);
    }

    render() {
        const chart = (
            <div className={css(styles.chart)}>
                <div className={css(styles.hourLabels)}>
                    <div className={css(styles.dayLabel)} />
                    {range(24 / 3).map(x => (
                        <div className={css(styles.hourLabel)}>
                            {moment({hour: x * 3, minute: 0, second: 0}).format(
                                "h:mm a",
                            )}
                        </div>
                    ))}
                </div>
                {this.props.days.map((day, i) => (
                    <div key={i} className={css(styles.day)}>
                        {this.state.now.isSame(day.day, "day") && (
                            <div
                                key="curr-indicator"
                                className={css(
                                    styles.currentTimeIndicatorWrapper,
                                )}
                            >
                                <div
                                    style={{
                                        flex: msToMinutes(
                                            this.state.now.diff(
                                                startOfDay(this.state.now),
                                            ),
                                        ),
                                    }}
                                />
                                <div
                                    className={css(styles.currentTimeIndicator)}
                                />
                                <div
                                    style={{
                                        flex: msToMinutes(
                                            startOfNextDay(this.state.now).diff(
                                                this.state.now,
                                            ),
                                        ),
                                    }}
                                />
                            </div>
                        )}
                        <div className={css(styles.dayLabel)}>
                            {day.day.format("ddd, MMM Do")}
                        </div>
                        {day.runs.map(
                            (run, j) =>
                                run.type === "run" ? (
                                    <Run run={run} now={this.state.now} />
                                ) : (
                                    <div
                                        style={{
                                            flex: run.duration,
                                        }}
                                        className={css(
                                            run.type === "setup" &&
                                                styles.setup,
                                        )}
                                    />
                                ),
                        )}
                    </div>
                ))}
            </div>
        );

        return (
            <div className={css(styles.app)}>
                <h1>AGDQ Schedule</h1>
                <p>
                    <a href="https://gamesdonequick.com/tracker/donate/22">
                        Donate to The Prevent Cancer Foundation&reg;
                    </a>
                </p>
                <p>
                    <a href="https://www.twitch.tv/gamesdonequick">
                        Watch AGDQ on Twitch.tv
                    </a>
                </p>
                {chart}
                <p>
                    Contribute at{" "}
                    <a href="https://github.com/xymostech/gdq-schedule">
                        xymostech/gdq-schedule on github
                    </a>
                </p>
            </div>
        );
    }
}

const styles = StyleSheet.create({
    app: {
        margin: "0 auto",
        padding: 10,
        boxSizing: "border-box",
        maxWidth: 1200,
        width: "100%",
        textAlign: "center",
    },

    chart: {
        height: "90vh",
        width: "100%",

        display: "flex",
        flexDirection: "row",
        fontFamily: "sans-serif",
    },

    day: {
        marginLeft: 5,
        display: "flex",
        flexDirection: "column",
        flex: 1,
        alignItems: "center",
        position: "relative",
    },

    currentTimeIndicatorWrapper: {
        position: "absolute",
        top: 20,
        bottom: 0,
        left: -2,
        right: -2,
        display: "flex",
        flexDirection: "column",
        pointerEvents: "none",
    },

    currentTimeIndicator: {
        width: "100%",
        height: 1,
        backgroundColor: "#000",
    },

    dayLabel: {
        flex: "0 0 20px",
        fontFamily: "sans-serif",
        fontSize: 17,
        paddingBottom: 5,
        whiteSpace: "nowrap",
    },

    hourLabels: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
    },

    hourLabel: {
        flex: 1,
        width: "100%",
        textAlign: "left",
        boxSizing: "border-box",
        borderTop: "1px solid black",
        whiteSpace: "nowrap",
        paddingRight: 10,
    },

    run: {
        backgroundColor: "#00aeef",
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #555",
        overflow: "hidden",
        cursor: "pointer",
    },

    done: {
        opacity: 0.7,
    },

    runOver: {
        borderTop: 0,
    },

    runsOver: {
        borderBottom: 0,
    },

    setup: {
        width: "100%",
    },

    setupBlock: {
        backgroundColor: "#f21847",
    },

    popover: {
        backgroundColor: "#ccc",
        borderRadius: 3,
        boxShadow: "1px 1px 2px #999",
        padding: 10,
    },
});

ReactDOM.render(<App days={days} />, document.getElementById("main"));
