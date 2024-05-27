const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('../routes/route_helper.js');
const { generateJWToken, verifyJWToken } = require('../utils/auth.js');

// Database connection setup
const db = dbsingleton;


// POST /register 
var postRegister = async function(req, res) {

    const {
        username, 
        password, 
        first_name, 
        last_name, 
        email,
        actorName,
        hashtags
    } = req.body;

    if (!username || !password || !first_name || !last_name || !email ||!actorName) {
        // TODO: this should eventually be handled on the front end
        res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.'});
        return;
    }

    // use the callback correctly hang on
    helper.encryptPassword(password, async function(err, hashed_password) {
        if (err) {
            res.status(500).json( {error: `hashback prob: ${err}`} );
            return;
        }

        try {
            const insertQuery = `INSERT INTO users (username, hashed_password, first_name, last_name, email) 
            VALUES ('${username}', '${hashed_password}', '${first_name}', '${last_name}', '${email}')`;
            
            const checkExistingUser = await db.send_sql(
                `SELECT * 
                 FROM users
                 WHERE users.username = "${username}" OR users.email = "${email}"`);
            
            if (checkExistingUser.length > 0) {
                res.status(409).json( {error: 'An account with this username/email already exists, please try again.'} );
                return;
            }
            
            await db.send_sql(insertQuery);

            // Retrieve the user_id of the newly inserted user
            const insertedUser = await db.send_sql(
                `SELECT user_id
                    FROM users
                    WHERE username = "${username}"`
            );

            const userId = insertedUser[0].user_id;

            // Insert into the face_match table using the retrieved user_id
            const insertFaceMatchQuery = `INSERT INTO face_match (user_id, actor_name) 
                                            VALUES (${userId}, '${actorName}')`;

            await db.send_sql(insertFaceMatchQuery);

            if (hashtags) {
                for (let i = 0; i < hashtags.length; i++) {
                    const hashtag = hashtags[i];
                    console.log('insert ' + hashtag);
                    const insertHashtagQuery = `INSERT INTO user_hashtags (hashtag, user_id) 
                                                VALUES ('${hashtag}', ${userId})`;
                    await db.send_sql(insertHashtagQuery);
                }
            }
            
            res.status(200).json( {user : `${username}`} );

        } catch (e) {
            res.status(500).json( {error: `${e}`} );
            return;
        }
    });
};
// POST /login - GIVES TOKEN
var postLogin = async function(req, res) {
    const params = req.body;
    const username = params.username;
    const password = params.password;

    if (!username || !password) {
        res.status(400).json( {error: 'One or more fields you entered was empty, please try again.'} );
        return;
    }

    try {
        const userCredentials = await db.send_sql(
            `SELECT hashed_password, user_id, username 
             FROM users 
             WHERE username = "${username}" OR email = "${username}"`
        , []);

        if (userCredentials.length == 0) {
            res.status(401).json( {error: 'Username or email not found'} );
            return;
        }

        const match = await bcrypt.compare(password, userCredentials[0].hashed_password);

        if (!match) {
            res.status(401).json( {error: 'Password is incorrect'} );
            return;
        }

        const token = generateJWToken(userCredentials[0].user_id);
        
        res.status(200).json({
            user_id: `${userCredentials[0].user_id}`,
            username: `${userCredentials[0].username}`,
            token: `${token}`
        });

    } catch (err) {
        console.log(err);
        res.status(500).json( {error: err} );
        return;
    }
};

var routes = { 
    post_login: postLogin,
    post_register: postRegister,
}; 

module.exports = routes;