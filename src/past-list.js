import React from "react";
import {StyleSheet, css} from "aphrodite";

import {current, past} from "./gdq-data.js";

export default class PastList extends React.Component {
    render() {
        return <div>
            <h2 className={css(styles.header)}>All GDQ schedules</h2>
            <ul className={css(styles.list)}>
                <li className={css(styles.listElement)}><a className={css(styles.link)} href="/">{current.name}</a></li>
                {Object.keys(past).map(key =>
                    <li key={key} className={css(styles.listElement)}><a className={css(styles.link)} href={`/past/${key}`}>{past[key].name}</a></li>)}
            </ul>
        </div>;
    }
}

const styles = StyleSheet.create({
    header: {
        textAlign: "center",
    },

    list: {
        listStyleType: "none",
        margin: 0,
        padding: 0,
        textAlign: "center",
    },

    listElement: {
        marginBottom: 8,
    },

    link: {
        textDecoration: "none",
        fontSize: 32,
        fontWeight: "bold",
        marginBottom: 8,
    },
});