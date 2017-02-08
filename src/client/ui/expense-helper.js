"use strict";

import React from "react"
import Money from "../../shared/util/money"

export const ExpensePropType = {
    id: React.PropTypes.number.isRequired,
    userId: React.PropTypes.number.isRequired,
    title: React.PropTypes.string.isRequired,
    sum: React.PropTypes.string.isRequired,
    sourceId: React.PropTypes.number.isRequired,
    categoryId: React.PropTypes.number.isRequired,
    description: React.PropTypes.string
};

export function expenseName(e) {
    return `${e.title} (${e.receiver}): ${Money.from(e.sum).format()}`;
}
