const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "users.json");

// Load existing users
let users = [];
if (fs.existsSync(filePath)) {
  const data = fs.readFileSync(filePath, "utf-8");
  users = data ? JSON.parse(data) : [];
}

// Add new user
async function addUser(username, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  users.push({ username, passwordHash });
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
}

// Find user by username
function findUser(username) {
  return users.find((u) => u.username === username);
}

module.exports = { users, addUser, findUser };
