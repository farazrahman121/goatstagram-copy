const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('../routes/route_helper.js');
const { verifyJWToken } = require('../utils/auth.js');

const db = dbsingleton;

var changeEmail = async function(req, res) {
  try {
      const username = req.params.username;
      const email = req.body.email;

      const query = `UPDATE users SET email = '${email}' WHERE username = '${username}';`;

      await db.send_sql(query);

      console.log("change email query sent");

      return res.status(200).json({results: "change email query sent"});
  } catch (error) {
      console.error('error:', error);
      return res.status(500).json({error: 'Error querying database.'});
  }
}

//silly thing

var changePassword = async function(req, res) {
  const username = req.params.username;
  const password = req.body.password;

  helper.encryptPassword(password, async function(err, hashed_password) {
    if (err) {
        res.status(500).json( {error: `hashback prob: ${err}`} );
        return;
    }

    try {
        const query = `UPDATE users SET hashed_password = '${hashed_password}' WHERE username = '${username}';`;

        await db.send_sql(query);
        
        console.log("change password query sent");

        return res.status(200).json({results: "change password query sent"});
    } catch (error) {
      console.error('error:', error);
      return res.status(500).json({error: 'Error querying database.'});
    }
  });
}

var routes = {
  change_email: changeEmail,
  change_password: changePassword,
};

module.exports = routes;