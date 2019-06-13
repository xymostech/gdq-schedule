import React, {Component} from "react";
import {StyleSheet, css} from "aphrodite";

import {colors} from "./constants.js";

export default class Popover extends Component {
    componentDidMount() {
        document.body.addEventListener("click", this.handleDocumentClick);
    }

    componentWillUnmount() {
        document.body.removeEventListener("click", this.handleDocumentClick);
    }

    handleDocumentClick = e => {
        if (this.props.isOpen) {
            let elem = e.target;
            while (elem !== document.body && elem !== this.wrapperRef) {
                elem = elem.parentNode;
            }

            if (elem === document.body) {
                this.props.onOuterAction(e);
            }
        }
    };

    getPositioning() {
        const wrapperRect = this.wrapperRef.getBoundingClientRect();
        const popoverRect = this.popoverRef.getBoundingClientRect();

        const wrapperTopY = wrapperRect.y;
        const wrapperMidX = wrapperRect.x + wrapperRect.width / 2;

        const bodyWidth = document.body.clientWidth;

        let positioning;
        if (
            wrapperMidX - popoverRect.width / 2 > 0 &&
            wrapperMidX + popoverRect.width / 2 < bodyWidth
        ) {
            if (wrapperTopY - popoverRect.height - 10 > 0) {
                return {
                    position: "top",
                    styles: null
                };
            } else {
                return {
                    position: "bottom",
                    styles: null,
                };
            }
        } else if (wrapperMidX - popoverRect.width / 2 < 0) {
            return {
                position: "right",
                styles: {
                    top: `calc(50% - ${popoverRect.height}px / 2)`,
                },
            };
        } else {
            return {
                position: "left",
                styles: {
                    top: `calc(50% - ${popoverRect.height}px / 2)`,
                },
            };
        }
    }

    render() {
        let position;
        let popoverStyles;
        if (this.props.isOpen) {
            ({position, styles: popoverStyles} = this.getPositioning());
        }

        return <div
            ref={el => this.wrapperRef = el}
            className={css(
                styles.popoverWrapper,
                !this.props.isOpen && styles.popoverWrapperHidden
            )}
        >
            <div
                ref={el => this.popoverRef = el}
                style={popoverStyles}
                className={css(
                    styles.popover,
                    !this.props.isOpen && styles.popoverHidden,
                    position === "top" && styles.popoverTop,
                    position === "bottom" && styles.popoverBottom,
                    position === "right" && styles.popoverRight,
                    position === "left" && styles.popoverLeft,
                )}
            >
                {this.props.body}
            </div>
            {this.props.children}
        </div>;
    }
}

const styles = StyleSheet.create({
    popoverWrapper: {
        position: "relative",
    },

    popoverWrapperHidden: {
        overflow: "hidden",
    },

    popoverHidden: {
        visibility: "hidden",
        zIndex: -1,
        animation: "none",
    },

    popover: {
        position: "absolute",
        zIndex: 1,
        width: "130%",
        animationDuration: "200ms",
        animationIterationCount: "1",
        animationFillMode: "forwards",

        "::before": {
            content: "' '",
            position: "absolute",
            width: 0,
            height: 0,
            border: "10px solid transparent",
        },

        "::after": {
            content: "' '",
            position: "absolute",
            width: 0,
            height: 0,
            border: "10px solid transparent",
        },
    },

    popoverTop: {
        left: "-15%",
        bottom: "calc(100% + 10px)",
        animationName: {
            "0%": {
                opacity: "0",
                transform: 'translateY(-20px)',
            },
            "100%": {
                opacity: "1",
                transform: 'translateY(0px)',
            },
        },

        "::before": {
            top: "100%",
            left: "calc(50% - 10px)",
            borderTopColor: colors.red,
            borderBottomWidth: 0,
        },

        "::after": {
            top: "calc(100% - 3px)",
            left: "calc(50% - 10px)",
            borderTopColor: "white",
            borderBottomWidth: 0,
        },
    },

    popoverBottom: {
        left: "-15%",
        top: "calc(100% + 10px)",
        animationName: {
            "0%": {
                opacity: "0",
                transform: 'translateY(20px)',
            },
            "100%": {
                opacity: "1",
                transform: 'translateY(0px)',
            },
        },

        "::before": {
            bottom: "100%",
            left: "calc(50% - 10px)",
            borderBottomColor: colors.red,
            borderTopWidth: 0,
        },

        "::after": {
            bottom: "calc(100% - 3px)",
            left: "calc(50% - 10px)",
            borderBottomColor: "white",
            borderTopWidth: 0,
        },
    },

    popoverRight: {
        left: "calc(100% + 10px)",
        animationName: {
            "0%": {
                opacity: "0",
                transform: 'translateX(20px)',
            },
            "100%": {
                opacity: "1",
                transform: 'translateX(0px)',
            },
        },

        "::before": {
            right: "100%",
            top: "calc(50% - 10px)",
            borderRightColor: colors.red,
            borderLeftWidth: 0,
        },

        "::after": {
            right: "calc(100% - 3px)",
            top: "calc(50% - 10px)",
            borderRightColor: "white",
            borderLeftWidth: 0,
        },
    },

    popoverLeft: {
        right: "calc(100% + 10px)",
        animationName: {
            "0%": {
                opacity: "0",
                transform: 'translateX(-20px)',
            },
            "100%": {
                opacity: "1",
                transform: 'translateX(0px)',
            },
        },

        "::before": {
            left: "100%",
            top: "calc(50% - 10px)",
            borderLeftColor: colors.red,
            borderRightWidth: 0,
        },

        "::after": {
            left: "calc(100% - 3px)",
            top: "calc(50% - 10px)",
            borderLeftColor: "white",
            borderRightWidth: 0,
        },
    },
});