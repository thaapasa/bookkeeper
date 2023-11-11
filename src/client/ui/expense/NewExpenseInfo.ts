import { expensePagePath, shortcutsPagePath } from 'client/util/Links';

export function pageSupportsRoutedExpenseDialog(path: string) {
  // Currently, only the expense page, shortcuts page,
  // and the frontpage supports routed new expense dialogs
  return (
    path.includes(expensePagePath) ||
    path.includes(shortcutsPagePath) ||
    path === '/' ||
    path === '/p'
  );
}
