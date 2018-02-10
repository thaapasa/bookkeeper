import * as React from 'react';
import { combineClassNames } from '../../util/ClientUtil';
import * as colors from '../Colors';

export default function ExpenseHeader(props: { className?: string }) {
  return (
    <div className={combineClassNames('expense-row bk-table-row header', props.className)} style={{ color: colors.header }}>
      <div className="expense-detail date">Pvm</div>
      <div className="expense-detail user optional" />
      <div className="expense-detail title">Nimi</div>
      <div className="expense-detail receiver optional">Kohde</div>
      <div className="expense-detail category optional">Kategoria</div>
      <div className="expense-detail source optional">Lähde</div>
      <div className="expense-detail sum">Summa</div>
      <div className="expense-detail balance optional">Balanssi</div>
      <div className="expense-detail tools" />
    </div>
  );
}
