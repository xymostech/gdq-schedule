import React from "react";

import {colors} from "./constants.js";

export default () => (
    <svg
        width="20"
        height="20"
    >
        <circle
            cx="8"
            cy="8"
            r="4"
            stroke={colors.gray}
            fill="transparent"
            strokeWidth="2"
        />
        <path
            d="M11,9 L19,17 L17,19 L9,11 Z"
            fill={colors.gray}
        />
    </svg>
);
