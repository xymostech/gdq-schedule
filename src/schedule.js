import React from "react";
import {StyleSheet, css} from "aphrodite";
import moment from "moment";
import PropTypes from "prop-types";

import {colors, fonts} from "./constants.js";
import SearchIcon from "./search-icon.js";
import Popover from "./popover.js";

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
        result += `${hours} ${hours === 1 ? "hour" : "hours"}`;
    }
    if (minutes > 0 || hours === 0) {
        if (result.length > 0) {
            result += " ";
        }
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
        filter: PropTypes.string,
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
        const {run, now, showCurrentTime, filter} = this.props;
        const {info} = run;

        const isSetup = /SETUP BLOCK/.test(info.name);

        const hasFilter = filter.length > 0;
        const isSelected = new RegExp(filter, "i").test(info.name);

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
                <div className={css(styles.popoverItem)}>
                    <strong>{info.name}</strong>
                    {!isSetup && <span> ({info.platform})</span>}
                </div>
                {!isSetup &&
                    <div className={css(styles.popoverItem)}>
                        <strong>Runner(s):</strong> {info.runners}
                    </div>
                }
                {!isSetup &&
                    <div className={css(styles.popoverItem)}>{info.runKind}</div>
                }
                <div className={css(styles.popoverItem)}>
                    <strong>Host:</strong> {info.host}
                </div>
                <div className={css(styles.popoverItem)}>
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
                        hasFilter && !isSelected && styles.deselected,
                        !(hasFilter && isSelected) && isDone && styles.done,
                        hasFilter && !isSelected && isDone
                            && styles.deselectedAndDone,
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

function now() {
    return moment();
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
        now: now(),
        days: null,
        filter: "",
    };

    componentDidMount() {
        if (this.props.showCurrentTime) {
            this._refreshTimer = setInterval(() => {
                this.setState({
                    now: now(),
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
        let currentRun = null;
        let nextRun = null;
        if (this.state.days && this.props.showCurrentTime) {
            // Keep track of whether we're looking at the first run.
            let firstRun = true;

            // Go through all the runs in all the days.
            this.state.days.forEach(day => {
                day.runs.forEach(run => {
                    if (run.type !== "run") {
                        // We ignore non-run segments here, because they don't
                        // contain the time info that we need.
                        return;
                    }

                    if (!nextRun && currentRun) {
                        // If we have found a "current" run but not a "next"
                        // run yet, then this is the next run.
                        nextRun = run;
                    }

                    if (currentRun) {
                        // If we've already found a current run, ignore the
                        // rest here.
                        return;
                    }

                    if (
                        run.info.time.clone()
                            .add(run.info.duration)
                            .isBefore(this.state.now)
                    ) {
                        // If this run has ended, bail out
                        return;
                    }

                    if (run.info.time.isBefore(this.state.now)) {
                        // If this run has already started, it's the current
                        // run.
                        currentRun = run;
                    } else {
                        // If this run hasn't started then this run is up next.
                        nextRun = run;

                        if (firstRun) {
                            // If we're before the very first run in the gdq,
                            // then mark this as the "beginning" so that we
                            // don't show an "on now" element.
                            currentRun = {type: "beginning"};
                        } else {
                            // If we're before an event but not at the first
                            // run, then we're in a setup block.
                            currentRun = {type: "setup"};
                        }
                    }

                    firstRun = false;
                });
            });
        }

        const chart = (
            <div className={css(styles.chart)}>
                {this.state.days &&
                    this.state.days.map((day, i) => (
                        <div
                            key={i}
                            className={css(styles.day)}
                            style={{
                                flexBasis: `${100 / this.state.days.length}%`,
                            }}
                        >
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
                                            filter={this.state.filter}
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

        let nextStartsAt;
        if (nextRun) {
            nextStartsAt = `starts at ${nextRun.info.time.format("h:mm A")}`;

            if (!nextRun.info.time.isSame(this.state.now, "day")) {
                nextStartsAt = `starts on ${nextRun.info.time.format("MMM Do, h:mm A")}`;
            }
        }

        return <div>
            <h1 className={css(
                styles.title,
                this.props.color === "red" && styles.redTitle,
                this.props.color === "blue" && styles.blueTitle
            )}>{this.props.name}</h1>
            <div className={css(styles.subtitle)}>
                {currentRun && currentRun.type !== "beginning" && <div className={css(styles.nowNextWrap)}>
                    <div className={css(styles.onNow)}>On now</div>
                    <div className={css(styles.nowNextTitle)}>
                        {currentRun.type === "run" ? currentRun.info.name : "Setup"}
                    </div>
                    {currentRun.type === "run" && <div className={css(styles.nowNextTime)}>
                        ({currentRun.info.time.clone().add(currentRun.info.duration).from(this.state.now, true)} remaining)
                    </div>}
                </div>}

                {nextRun && <div className={css(styles.nowNextWrap)}>
                    <div className={css(styles.upNext)}>Up next</div>
                    <div className={css(styles.nowNextTitle)}>{nextRun.info.name}</div>
                    <div className={css(styles.nowNextTime)}>
                        ({nextStartsAt})
                    </div>
                </div>}

                <div className={css(styles.searchWrap)}>
                    <div className={css(styles.searchIcon)}>
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        className={css(styles.search)}
                        placeholder="Search runs..."
                        value={this.state.filter}
                        onChange={e => this.setState({
                            filter: e.target.value,
                        })}
                    />
                </div>
            </div>
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
        backgroundColor: colors.blue,
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

    deselected: {
        opacity: 0.55,
    },

    deselectedAndDone: {
        opacity: 0.4,
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
    },

    popoverItem: {
        marginTop: 5,
        marginBottom: 5,
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

    subtitle: {
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        marginBottom: 15,
    },

    searchWrap: {
        position: "relative",
    },

    search: {
        appearance: "none",
        border: `2px solid ${colors.gray}`,
        height: 20,
        borderRadius: 10,
        width: 200,
        padding: "2px 4px 2px 27px",
        color: colors.black,
    },

    searchIcon: {
        position: "absolute",
        top: 3,
        left: 4,
    },

    nowNextWrap: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        marginRight: 24,
    },

    nowNextTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 6,
        maxWidth: 280,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },

    nowNextTime: {
        marginTop: 2,
        fontSize: 14,
    },

    onNow: {
        ...fonts.display,
        fontSize: 14,
        color: colors.blue,
    },

    upNext: {
        ...fonts.display,
        fontSize: 14,
        color: colors.red,
    },
});
