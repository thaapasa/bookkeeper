export interface CategorySuggestion {
  id: number;
  type: 'category';
  name: string;
}

export interface ReceiverSuggestion {
  id: number;
  type: 'receiver';
  receiver: string;
}

export type SearchSuggestion = CategorySuggestion | ReceiverSuggestion;

export function getSearchSuggestionValue(suggestion: SearchSuggestion) {
  return suggestion.type === 'category'
    ? suggestion.name
    : `Kohde: ${suggestion.receiver}`;
}

export function isReceiverSuggestion(
  x: SearchSuggestion
): x is ReceiverSuggestion {
  return x.type === 'receiver';
}

export function isSameSuggestion(s1: SearchSuggestion, s2: SearchSuggestion) {
  return s1.type === s2.type && s1.id === s2.id;
}
