import React from "react";
import {StyleSheet, css} from "aphrodite";
import PropTypes from "prop-types";

import {colors, fonts} from "./constants.js";

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
                <hr className={css(styles.rule)}/>
                <div className={css(styles.content)}>{this.props.children}</div>
                <footer className={css(styles.footer)}>
                    Made by Xymostech and Jett Burns. Not affiliated with Games Done Quick
                </footer>
            </div>
        );
    }
}

const styles = StyleSheet.create({
    app: {
        ...fonts.body,
        boxSizing: "border-box",
        width: "100%",
        color: colors.black,
    },

    header: {
        display: "flex",
        padding: "0px 0px 16px 15px",
        maxWidth: 1300,
        margin: "-8px auto 0",
        height: 70,
        alignItems: "flex-end",
        boxSizing: "border-box",
    },

    rule: {
        margin: "0 0 32px",
    },

    content: {
        maxWidth: 1300,
        margin: "0 auto",
    },

    headerTitle: {
        ...fonts.display,
        fontSize: "2em",
        margin: 0,
    },

    headNavs: {
        ...fonts.display,
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

    footer: {
        marginTop: 20,
        backgroundColor: "#333",
        color: "white",
        textAlign: "center",
        padding: 8,
    },
});
