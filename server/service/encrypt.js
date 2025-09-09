import bcrypt from "bcrypt";

export const hashPassword = (password) => {
  const salt = 10;
  const hashedPassword = bcrypt.hash(password, salt);
  return hashedPassword;
};
