import * as React from 'react';
import Money from "../../shared/util/money"
import PropTypes from "prop-types"

export const ExpensePropType = {
    id: PropTypes.number.isRequired,
    userId: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    sum: PropTypes.string.isRequired,
    sourceId: PropTypes.number.isRequired,
    categoryId: PropTypes.number.isRequired,
    description: PropTypes.string
};

export function expenseName(e: any): string {
    return `${e.title} (${e.receiver}): ${Money.from(e.sum).format()}`;
}
