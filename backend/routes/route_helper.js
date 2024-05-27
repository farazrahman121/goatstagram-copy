const bcrypt = require('bcrypt'); 
const dbsingleton = require('../models/db_access.js');
const db = dbsingleton;


var route_helper = function() {
    return {
        // Function for encrypting passwords WITH SALT
        // Look at the bcrypt hashing routines
        encryptPassword: (password, callback) => {
            // TODO: Implement this
            return bcrypt.hash(password, 10, callback);
        },
        // Checks that every character is a space, letter, number, or one of the following: .,?,_
        isOK: (str) => {
            if (str == null)
                return false;
            for (var i = 0; i < str.length; i++) {
                if (!/[A-Za-z0-9 \.\?,_]/.test(str[i])) {
                    return false;
                }
            }
            return true;
        }        
    };
};

var encryptPassword = function(password, callback) {
    return route_helper().encryptPassword(password, callback);
}

var isOK = function(req) {
    return route_helper().isOK(req);
}

var isLoggedIn = function(req, obj) {
    return route_helper().isLoggedIn(req, obj);
}
 
var getUsernameFromID = function(userID) {

    const result = db.send_sql(`SELECT username FROM users WHERE user_id = ${userID}`)
    return result[0].username;

}

module.exports = {
    isOK,
    isLoggedIn,
    encryptPassword,
    getUsernameFromID
};