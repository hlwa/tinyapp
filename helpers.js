const findUserByEmail = (email, users) => {
  for (const userId in users) {
    if (users[userId]['email'] === email) {
      return users[userId];
    }
  }
  return undefined;
};

module.exports = {findUserByEmail};