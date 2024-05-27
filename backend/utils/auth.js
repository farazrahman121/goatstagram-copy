// import JWT
const jwt = require("jsonwebtoken");

// import DB function
/**
 * Create a JWT containing the username
 * @param {*} userid
 * @returns the token
 */

const secret = 'long-string-for-keeping-secrets'; // HASH SEED 



/**
 * Generate a token. Check if the user is valid
 * @param {*} username
 * @returns true if the token is associated with the username
 */
const generateJWToken = (username) => {
  try {
    console.log()
    const token = jwt.sign({ username: username }, secret, { expiresIn: "12000s" }); // check what expiresIn does
    return token;
  } catch (err) {
    return console.log("error", err.message);
  }
};

/**
 * Verify a token. Check if the user is valid
 * @param {*} token
 * @param {*} username
 * @returns true if the token is associated with the username
 */
const verifyJWToken = async (token, username) => {
  try {
    // decoded contains the payload of the token
    const decoded = await jwt.verify(token, secret);
    console.log("payload", decoded);
    console.log(username, decoded.username);

    return decoded.username == username;
  } catch (err) {
    console.log("error", err.message);
    return false;
  }
};

module.exports = { generateJWToken, verifyJWToken };