import React from "react";
import {StyleSheet, css} from "aphrodite";
import PropTypes from "prop-types";

export default class App extends React.Component {
    static propTypes = {
        children: PropTypes.node,
    };

    render() {
        return (
            <div className={css(styles.app)}>
                <header className={css(styles.header)}>
                    <h1 className={css(styles.headerTitle)}>
                        <a
                            className={css(styles.headNavsLinks)}
                            href="/"
                        >
                            GDQ Schedule
                        </a>
                    </h1>
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
                    <nav className={css(styles.headNavs)}>
                        <a
                            className={css(styles.headNavsLinks)}
                            href="/past"
                        >
                            Previous GDQ schedules
                        </a>
                    </nav>
                </header>
                {this.props.children}
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
        padding: "0px 0px 16px 15px",
        margin: "-8px 0px 40px 0px",
        borderBottom: "1px solid #c1c1c1",
        height: 70,
        alignItems: "flex-end",
        boxSizing: "border-box",
    },

    headerTitle: {
        fontSize: "1.5em",
        lineHeight: 1,
        margin: 0,
    },

    headNavs: {
        paddingLeft: "2%",
    },

    headNavsLinks: {
        textDecoration: "none",
        color: "black",

        ":hover": {
            textDecoration: "underline",
            color: "#00aeef",
        },
    },
});