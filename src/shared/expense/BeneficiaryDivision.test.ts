import { describe, expect, it } from 'bun:test';

import { evenBeneficiaryDivision, getBeneficiaryUserIds } from './BeneficiaryDivision';
import { ExpenseDivisionItem } from './Expense';

describe('getBeneficiaryUserIds', () => {
  const division: ExpenseDivisionItem[] = [
    { userId: 1, type: 'cost', sum: '-10.00' },
    { userId: 1, type: 'benefit', sum: '5.00' },
    { userId: 2, type: 'benefit', sum: '5.00' },
    { userId: 1, type: 'income', sum: '10.00' },
    { userId: 1, type: 'split', sum: '-10.00' },
    { userId: 2, type: 'transferee', sum: '10.00' },
  ];

  it('picks the beneficiary side per expense type', () => {
    expect(getBeneficiaryUserIds('expense', division)).toEqual([1, 2]);
    expect(getBeneficiaryUserIds('income', division)).toEqual([1]);
    expect(getBeneficiaryUserIds('transfer', division)).toEqual([2]);
  });

  it('dedupes user ids', () => {
    const doubled: ExpenseDivisionItem[] = [
      { userId: 1, type: 'benefit', sum: '5.00' },
      { userId: 1, type: 'benefit', sum: '5.00' },
    ];
    expect(getBeneficiaryUserIds('expense', doubled)).toEqual([1]);
  });
});

describe('evenBeneficiaryDivision', () => {
  it('splits an expense sum evenly as benefit items', () => {
    expect(evenBeneficiaryDivision('expense', '250.00', [1, 2])).toEqual([
      { userId: 1, type: 'benefit', sum: '125.00' },
      { userId: 2, type: 'benefit', sum: '125.00' },
    ]);
  });

  it('distributes remainder cents so the parts sum exactly', () => {
    const parts = evenBeneficiaryDivision('expense', '10.00', [1, 2, 3]);
    expect(parts.map(p => p.sum).sort()).toEqual(['3.33', '3.33', '3.34']);
  });

  it('negates the income split side', () => {
    expect(evenBeneficiaryDivision('income', '2500.00', [1])).toEqual([
      { userId: 1, type: 'split', sum: '-2500.00' },
    ]);
  });

  it('keeps the transferee side positive', () => {
    expect(evenBeneficiaryDivision('transfer', '100.00', [2])).toEqual([
      { userId: 2, type: 'transferee', sum: '100.00' },
    ]);
  });
});
