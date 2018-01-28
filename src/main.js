import React from "react";
import ReactDOM from "react-dom";
import {StyleSheet, css} from "aphrodite";
import moment from "moment";
import Popover from "react-popover";
import "normalize.css";
import PropTypes from "prop-types";

function parseTime(time) {
    return moment.utc(time).local();
}

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

function parseDataToDays(data) {
    // time, name, runners, duration, setupLength, runKind, platform, host

    data.forEach(function(d) {
        d.time = parseTime(d.time);
        d.duration = moment.duration(d.duration);
        d.setupLength = d.setupLength
            ? moment.duration(d.setupLength)
            : moment.duration(0);
    });

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

    return days;
}

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

const MomentPropType = PropTypes.instanceOf(moment);
const DurationPropType = function(props, propName, componentName) {
    if (!props[propName].isDuration || !props[propName].isDuration()) {
        return new Error(
            `Invalid prop ${propName} supplied to ${componentName}. Expected Moment Duration`,
        );
    }
};

class Run extends React.Component {
    static propTypes = {
        now: MomentPropType.isRequired,
        run: PropTypes.shape({
            info: PropTypes.shape({
                name: PropTypes.string.isRequired,
                host: PropTypes.string.isRequired,
                runKind: PropTypes.string.isRequired,
                time: MomentPropType.isRequired,
                duration: DurationPropType.isRequired,
            }).isRequired,
            duration: PropTypes.number.isRequired,
            runsOver: PropTypes.bool,
            runOver: PropTypes.bool,
        }).isRequired,
    };

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

class App extends React.Component {
    state = {
        now: moment(),
        days: null,
    };

    componentDidMount() {
        this._refreshTimer = setInterval(() => {
            this.setState({
                now: moment(),
            });
        }, 1000 * 15);

        fetch("/data/schedule.json")
            .then(resp => {
                if (resp.status >= 200 && resp.status < 300) {
                    return resp;
                } else {
                    throw new Error(resp.statusText);
                }
            })
            .then(resp => resp.json())
            .then(data =>
                this.setState({
                    days: parseDataToDays(data),
                }),
            );
    }

    componentWillUnmount() {
        clearInterval(this._refreshTimer);
    }
    render() {
        const chart = (
            <div className={css(styles.chart)}>
                {this.state.days &&
                    this.state.days.map((day, i) => (
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
                                        className={css(
                                            styles.currentTimeIndicator,
                                        )}
                                    />
                                    <div
                                        style={{
                                            flex: msToMinutes(
                                                startOfNextDay(
                                                    this.state.now,
                                                ).diff(this.state.now),
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
                                        <Run
                                            key={j}
                                            run={run}
                                            now={this.state.now}
                                        />
                                    ) : (
                                        <div
                                            key={j}
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
                <header className={css(styles.header)}>
                    <h1>AGDQ Schedule</h1>
                    <nav className={css(styles.headNavs)}>
                        <a
                            className={css(styles.headNavsLinks)}
                            href="https://gamesdonequick.com/tracker/donate/22"
                        >
                            Donate
                        </a>
                    </nav>
                    <nav className={css(styles.headNavs)}>
                        <a
                            className={css(styles.headNavsLinks)}
                            href="https://www.twitch.tv/gamesdonequick"
                        >
                            Watch
                        </a>
                    </nav>
                    <nav className={css(styles.headNavs)}>
                        <a
                            className={css(styles.headNavsLinks)}
                            href="https://github.com/xymostech/gdq-schedule"
                        >
                            Github
                        </a>
                    </nav>
                </header>
                {chart}
            </div>
        );
    }
}

const styles = StyleSheet.create({
    app: {
        margin: "0 auto",
        paddingBottom: 10,
        boxSizing: "border-box",
        maxWidth: 1300,
        width: "100%",
        fontFamily: "Arvo, serif",
    },

    header: {
        display: "flex",
        padding: "0px 0px 0px 15px",
        margin: "-8px 0px 40px 0px",
        borderBottom: "1px solid #c1c1c1",
        height: 70,
    },

    headNavs: {
        padding: "30px 0px 0px 2%",
    },

    headNavsLinks: {
        textDecoration: "none",
        color: "black",
    },

    chart: {
        width: "100%",
        display: "flex",
        flexDirection: "row",
    },

    day: {
        marginLeft: 2,
        display: "flex",
        flexDirection: "column",
        flexBasis: "12.5%",
        position: "relative",
    },

    currentTimeIndicatorWrapper: {
        position: "absolute",
        top: 20,
        bottom: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        pointerEvents: "none",
    },

    currentTimeIndicator: {
        width: 0,
        height: 0,
        borderTop: "10px solid transparent",
        borderBottom: "10px solid transparent",
        borderRight: "10px solid black",
        zIndex: 1,
    },

    dayLabel: {
        backgroundColor: "#333333",
        color: "#FFFFFF",
        fontSize: 17,
        padding: 5,
        whiteSpace: "nowrap",
        flex: "0 0 20px",
        textAlign: "left",
    },

    run: {
        backgroundColor: "#00aeef",
        width: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        cursor: "pointer",
        padding: 5,
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
        backgroundColor: "#fff",
        border: "2px solid #00aeef",
        borderRadius: 3,
        boxShadow: "1px 1px 2px #b3b3b3",
        padding: 10,
        fontSize: 15,
        opacity: 0.95,
    },

    eventTimes: {
        fontSize: 14,
        paddingBottom: 5,
    },
});

ReactDOM.render(<App />, document.getElementById("main"));
