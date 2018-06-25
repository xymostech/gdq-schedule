import React from "react";
import {StyleSheet, css} from "aphrodite";
import moment from "moment";
import Popover from "react-popover";
import PropTypes from "prop-types";

import {colors, fonts} from "./constants.js";

function parseTime(time) {
    return moment.utc(time).local();
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

function parseDataToDays(data, startTime) {
    // time, name, runners, duration, setupLength, runKind, platform, host

    data.forEach(function(d) {
        d.time = parseTime(d.time);
        d.duration = moment.duration(d.duration);
        d.setupLength = d.setupLength
            ? moment.duration(d.setupLength)
            : moment.duration(0);
    });

    const eventStart = moment.utc(startTime).local();
    const eventDayStart = startOfDay(eventStart);

    const days = [{day: eventDayStart, runs: []}];

    days[0].runs.push({
        type: "spacer",
        duration: eventStart.diff(eventDayStart),
    });

    let lastRunEnd = eventStart;

    data.forEach(function(d) {
        const setupTime = lastRunEnd.clone();
        const setupLength = d.time.diff(setupTime);
        const runEndTime = d.time.clone().add(d.duration);

        lastRunEnd = runEndTime;

        const setupDate = setupTime.date() - eventDayStart.date();
        const runStartDate = d.time.date() - eventDayStart.date();
        const runEndDate = runEndTime.date() - eventDayStart.date();

        while (days.length <= runEndDate) {
            days.push({day: startOfDay(runEndTime), runs: []});
        }
        if (setupTime.isSame(d.time, "day")) {
            days[setupDate].runs.push({
                type: "setup",
                duration: setupLength,
            });
        } else {
            const runDayStart = startOfDay(d.time);
            days[setupDate].runs.push({
                type: "setup",
                runsOver: true,
                duration: runDayStart.diff(setupTime),
                info: d,
            });
            days[runStartDate].runs.push({
                type: "setup",
                runOver: true,
                duration: d.time.diff(runDayStart),
                info: d,
            });
        }
        if (d.time.isSame(runEndTime, "day")) {
            days[runStartDate].runs.push({
                type: "run",
                duration: d.duration.asMilliseconds(),
                info: d,
            });
        } else {
            const runEndDayStart = startOfDay(runEndTime);
            days[runStartDate].runs.push({
                type: "run",
                runsOver: true,
                duration: runEndDayStart.diff(d.time),
                info: d,
            });
            days[runEndDate].runs.push({
                type: "run",
                runOver: true,
                duration: runEndTime.diff(runEndDayStart),
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
        duration: lastEndNextDay.diff(lastEndTime),
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

function scaleMsToHeight(ms) {
    return ms / 1000 / 30;
}

class Run extends React.Component {
    static propTypes = {
        now: MomentPropType.isRequired,
        showCurrentTime: PropTypes.bool,
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
        const {run, now, showCurrentTime} = this.props;
        const {info} = run;

        const isSetup = /SETUP BLOCK/.test(info.name);
        const isDone = showCurrentTime ? info.time
            .clone()
            .add(info.duration)
            .isBefore(now) : false;

        const timeFormat = <span>
            {info.time.format("h:mm A")} &ndash;{" "}
            {info.time
                .clone()
                .add(info.duration)
                .format("h:mm A")}
        </span>;

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
                    {timeFormat} ({formatDuration(info.duration)})
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
                        height: scaleMsToHeight(run.duration),
                    }}
                    className={css(
                        styles.run,
                        isSetup && styles.setupBlock,
                        isDone && styles.done,
                        run.runsOver && styles.runsOver,
                        run.runOver && styles.runOver,
                    )}
                    onClick={this.handleClickIn}
                >
                    <div className={css(styles.runInner)}>
                        {run.duration >= 1200000 &&
                            <div className={css(styles.runTimeInfo)}>
                                {info.time.format("h:mm A")} &ndash;{" "}
                                {info.time
                                    .clone()
                                    .add(info.duration)
                                    .format("h:mm A")}
                            </div>}
                        <div className={css(styles.runName)}>
                            {info.name}
                            {run.duration < 1200000 && <span className={css(styles.runTimeInfo)}>{" "}({timeFormat})</span>}
                        </div>
                    </div>
                </div>
            </Popover>
        );
    }
}

export default class Schedule extends React.Component {
    static propTypes = {
        name: PropTypes.string.isRequired,
        color: PropTypes.oneOf(["red", "blue"]).isRequired,
        scheduleDataFile: PropTypes.string.isRequired,
        startTime: PropTypes.string.isRequired,
        showCurrentTime: PropTypes.bool,
    };

    state = {
        now: moment(),
        days: null,
    };

    componentDidMount() {
        if (this.props.showCurrentTime) {
            this._refreshTimer = setInterval(() => {
                this.setState({
                    now: moment(),
                });
            }, 1000 * 15);
        }

        fetch(`/data/${this.props.scheduleDataFile}`)
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
                    days: parseDataToDays(data, this.props.startTime),
                }),
            );
    }

    componentWillUnmount() {
        if (this._refreshTimer) {
            clearInterval(this._refreshTimer);
        }
    }

    render() {
        const chart = (
            <div className={css(styles.chart)}>
                {this.state.days &&
                    this.state.days.map((day, i) => (
                        <div key={i} className={css(styles.day)}>
                            {this.props.showCurrentTime && this.state.now.isSame(day.day, "day") && (
                                <div
                                    key="curr-indicator"
                                    className={css(
                                        styles.currentTimeIndicatorWrapper,
                                    )}
                                >
                                    <div
                                        style={{
                                            height: scaleMsToHeight(
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
                                            height: scaleMsToHeight(
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
                                            showCurrentTime={this.props.showCurrentTime}
                                        />
                                    ) : (
                                        <div
                                            key={j}
                                            style={{
                                                height: scaleMsToHeight(run.duration),
                                            }}
                                            className={css(
                                                run.type === "setup" &&
                                                    styles.setup,
                                            )}
                                        />
                                    ),
                            )}
                            <div className={css(styles.dayLabel)}>
                                {day.day.clone().add(1, "days").format("ddd, MMM Do")}
                            </div>
                        </div>
                    ))}
            </div>
        );

        return <div>
            <h1 className={css(
                styles.title,
                this.props.color === "red" && styles.redTitle,
                this.props.color === "blue" && styles.blueTitle
            )}>{this.props.name}</h1>
            {chart}
        </div>;
    }
}

const styles = StyleSheet.create({
    title: {
        ...fonts.display,
        textAlign: "center",
    },

    redTitle: {
        color: colors.red,
    },

    blueTitle: {
        color: colors.blue,
    },

    chart: {
        width: "100%",
        display: "flex",
        flexDirection: "row",
    },

    day: {
        display: "flex",
        flexDirection: "column",
        flexBasis: "12.5%",
        position: "relative",

        ":nth-child(n+2)": {
            marginLeft: 2,
        },
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
        ...fonts.display,
        backgroundColor: "#333333",
        color: "#FFFFFF",
        fontSize: 12,
        padding: 5,
        whiteSpace: "nowrap",
        flex: "0 0 20px",
        lineHeight: "20px",
        textAlign: "center",
    },

    run: {
        backgroundColor: "#00aeef",
        width: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        cursor: "pointer",
        paddingLeft: 5,
        paddingRight: 5,
    },

    runInner: {
        // If we set a padding-top and padding-bottom on run, then it will
        // never shrink to smaller than the size of the padding combined. To
        // counter this, we put a margin on an inner element.
        marginTop: 5,
        marginBottom: 5,
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
        ...fonts.body,
        color: colors.black,
        backgroundColor: "#fff",
        border: `2px solid ${colors.red}`,
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

    runTimeInfo: {
        fontSize: 11,
        fontWeight: "normal",
    },

    runName: {
        fontWeight: "bold",
        marginTop: 2,
    },
});
