export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface UserStore {
  [id: string]: User;
}

const users: UserStore = {};

export const findUserByEmail = (email: string): User | undefined => {
  return Object.values(users).find(user => user.email === email);
};

export const findUserById = (id: string): User | undefined => {
  return users[id];
};

export const createUser = (user: User): User => {
  users[user.id] = user;
  return user;
};