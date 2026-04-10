import { create } from 'zustand';

import {
  CategoryMap,
  ExpenseGroupingMap,
  ExpenseGroupingRef,
  Group,
  Session,
  Source,
  User,
} from 'shared/types';
import { toMap } from 'shared/util';

import { CategoryDataSource, catToDataSource, toCategoryMap, UserDataProps } from './Categories';

export interface ExpenseDialogData {
  sources: Source[];
  user: User;
  group: Group;
  sourceMap: Record<string, Source>;
  categoryMap: CategoryMap;
  groupings: ExpenseGroupingRef[];
  users: User[];
}

export type SessionStatus = 'uninitialized' | 'checking' | 'ready' | 'error';

interface SessionState {
  session: Session | null;
  status: SessionStatus;

  // Pre-computed derived state (null when session is null)
  userMap: Record<string, User> | null;
  sourceMap: Record<string, Source> | null;
  categoryMap: CategoryMap | null;
  categoryDataSource: CategoryDataSource[] | null;
  expenseGroupingMap: ExpenseGroupingMap | null;
  userData: UserDataProps | null;
  expenseDialogData: ExpenseDialogData | null;

  // Actions
  setSession: (session: Session | null) => void;
  setStatus: (status: SessionStatus) => void;
}

export const useSessionStore = create<SessionState>(set => ({
  session: null,
  status: 'uninitialized',
  userMap: null,
  sourceMap: null,
  categoryMap: null,
  categoryDataSource: null,
  expenseGroupingMap: null,
  userData: null,
  expenseDialogData: null,

  setSession: session => {
    if (!session) {
      set({
        session: null,
        userMap: null,
        sourceMap: null,
        categoryMap: null,
        categoryDataSource: null,
        expenseGroupingMap: null,
        userData: null,
        expenseDialogData: null,
      });
      return;
    }

    const userMap = toMap(session.users, 'id');
    const sourceMap = toMap(session.sources, 'id');
    const categoryMap = toCategoryMap(session.categories);
    const categoryDataSource = catToDataSource(session.categories, categoryMap);
    const expenseGroupingMap: ExpenseGroupingMap = Object.fromEntries(
      session.groupings.map(g => [String(g.id), g]),
    );
    const userData: UserDataProps = {
      userMap,
      sourceMap,
      categoryMap,
      groupingMap: expenseGroupingMap,
    };
    const expenseDialogData: ExpenseDialogData = {
      sources: session.sources,
      user: session.user,
      group: session.group,
      sourceMap,
      categoryMap,
      groupings: session.groupings,
      users: session.users,
    };

    set({
      session,
      userMap,
      sourceMap,
      categoryMap,
      categoryDataSource,
      expenseGroupingMap,
      userData,
      expenseDialogData,
    });
  },

  setStatus: status => set({ status }),
}));

// Convenience hooks with stable selectors

export const useSession = () => useSessionStore(s => s.session);
export const useSessionStatus = () => useSessionStore(s => s.status);
export const useCategoryMap = () => useSessionStore(s => s.categoryMap);
export const useSourceMap = () => useSessionStore(s => s.sourceMap);
export const useUserMap = () => useSessionStore(s => s.userMap);
export const useCategoryDataSource = () => useSessionStore(s => s.categoryDataSource);
export const useExpenseGroupingMap = () => useSessionStore(s => s.expenseGroupingMap);
export const useUserData = () => useSessionStore(s => s.userData);
export const useExpenseDialogData = () => useSessionStore(s => s.expenseDialogData);

export function useValidSession(): Session {
  const session = useSessionStore(s => s.session);
  if (!session) {
    throw new Error('useValidSession called without an active session');
  }
  return session;
}
