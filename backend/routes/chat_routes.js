const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('../routes/route_helper.js');
const { verifyJWToken } = require('../utils/auth.js');


/**
 * THESE ROUTES HAVE NOT BEEN TESTED OR VERIFIED TO WORK
 */

// Database connection setup (idk why this is renamed twice in the original
// routes.js, but we do it again here to be consistent)
const db = dbsingleton;


// GET /chat (retrieves messages between two users)
// - REQUIRES TOKEN
var getChat = async function(req, res) {
    try {
        // other user is username
        const { username } = req.params;

        // first user is USERID
        const { userID, token } = req.body;

        const verified = await verifyJWToken(token, userID);
        if (!verified) {
            return res.status(403).json({error: 'Unauthorized.'});
        }

        // Retrieve other person's user IDs based on usernames
        const queryUserIds = `SELECT user_id FROM users WHERE username = ?;`;
        const otherIDQuery = await db.send_sql(queryUserIds, [username]);
        
        if (userIdsResult.length == 0) {
            return res.status(404).json({ error: 'Other user not found.' });
        }
        const otherID = userIdsResult[0].user_id;

        // Query to get messages between the two users
        const queryMessages = `
            SELECT m.message_id, m.sender_id, m.receiver_id, m.message, m.message_date,
                   sender.username AS sender_username, receiver.username AS receiver_username
            FROM 
                messages m
            INNER JOIN 
                users sender ON m.sender_id = sender.user_id
            INNER JOIN 
                users receiver ON m.receiver_id = receiver.user_id
            WHERE 
                (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY 
                m.message_date ASC;`;
        const messages = await db.send_sql(queryMessages, [userID, otherID, userID, otherID]);

        res.status(200).json({ messages: messages });
    } catch (error) {
        console.error('error:', error);
        return res.status(500).json({ error: 'Error querying chats from database.' });
    }
};
// POST /messages/send (sends a message between two users)
// - REQUIRES TOKEN
var postMessage = async function(req, res) {
    try {
        const senderID = req.body.sender;
        const conversationID = req.body.conversation_id;
        const message = req.body.message;
        //const { userID, token } = req.body;

        const insertQuery = `
            INSERT INTO messages (sender_id, conversation_id, message)
            VALUES (?, ?, ?);`;
        await db.insert_items(insertQuery, [senderID, conversationID, message]);
        
    } catch (error) {
        console.error('error:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

//get /getMessageHistory
var getMessageHistory = async function(req, res) {
    const { conversation_id} = req.query;

    if (!conversation_id) {
        return res.status(400).json({ error: 'Invalid request.' });
    }

    try {
        console.log("message history got");

        const query = `SELECT * FROM messages WHERE conversation_id = ${conversation_id} ORDER BY message_date ASC;`;
        const messages = await db.send_sql(query);

        // get usernames
        const queryUsernames = `
            SELECT username FROM users WHERE user_id = ?;`;
        for (let i = 0; i < messages.length; i++) {
            const senderUsername = await db.send_sql(queryUsernames, [messages[i].sender_id]);
            messages[i].sender_username = senderUsername[0].username;
        }

        return res.status(200).json({ messages: messages });
    } catch (error) {
        console.error('error:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

var routes = {
    get_chat: getChat,
    post_message: postMessage,
    get_message_history: getMessageHistory,
};

module.exports = routes;