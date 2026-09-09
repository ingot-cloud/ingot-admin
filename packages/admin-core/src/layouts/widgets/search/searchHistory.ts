export const HEADER_SEARCH_HISTORY_LIMIT = 10;
export const HEADER_SEARCH_ANONYMOUS_USER_KEY = "anonymous";

export const resolveSearchHistoryUserKey = (user?: {
  phone?: string;
  email?: string;
}): string => {
  const phone = user?.phone?.trim();
  if (phone) {
    return phone;
  }
  const email = user?.email?.trim();
  if (email) {
    return email;
  }
  return HEADER_SEARCH_ANONYMOUS_USER_KEY;
};

export const pushSearchHistoryKeyword = (
  list: string[],
  keyword: string,
  limit = HEADER_SEARCH_HISTORY_LIMIT,
): string[] => {
  const next = keyword.trim();
  if (!next) {
    return list;
  }
  return [next, ...list.filter((item) => item !== next)].slice(0, limit);
};

export const clearSearchHistoryForUser = (
  histories: Record<string, string[]>,
  userKey: string,
): Record<string, string[]> => {
  const next = { ...histories };
  delete next[userKey];
  return next;
};
