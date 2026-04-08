const blacklist: Set<string> = new Set();

export const addToBlacklist = (token: string): void => {
  blacklist.add(token);
};

export const isBlacklisted = (token: string): boolean => {
  return blacklist.has(token);
};