const dbsingleton = require('../models/db_access.js');
const db = dbsingleton;
const { getUserNameFromID } = require('./route_helper.js');

var getInvites = async function(req, res) {
    console.log("getInvites called");
    const { userID } = req.query;

    if (!userID) {
        return res.status(400).send('missing UserID');
    }

    try {
        var query = `SELECT * FROM invites WHERE receiver_id = ${userID}`;
        const invites = await db.send_sql(query);

        for (var i = 0; i < invites.length; i++) {
            query = `SELECT username FROM users WHERE user_id = ${invites[i].sender_id}`;
            const sender = await db.send_sql(query);
            invites[i].sender_username = sender[0].username;
        }

        // format the invites to be more readable
        return res.status(200).send(invites);
    } catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }
}

var createInvite = async function(req, res) {
    const { senderID, receiver_username } = req.body;

    if (!senderID || !receiver_username) {
        return res.status(400).send('missing senderID or receiverID');
    }

    // get id of receiver
    var query = `SELECT user_id FROM users WHERE username = '${receiver_username}'`;
    const receiver = await db.send_sql(query);

    if (receiver.length == 0) {
        return res.status(404).send('receiver not found');
    }

    const receiverID = receiver[0].user_id;

    try {
        var query = `INSERT IGNORE INTO invites (sender_id, receiver_id) VALUES (${senderID}, ${receiverID})`;
        await db.send_sql(query);

        return res.status(200).send('Invite created');
    } catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }
}

var ignoreInvite = async function(req, res) {
    const { senderID, receiverID } = req.body;
    if (!senderID || !receiverID) {
        return res.status(400).send('missing senderID or receiverID');
    }

    try {
        var query = `DELETE FROM invites WHERE sender_id = ${senderID} AND receiver_id = ${receiverID}`;
        await db.send_sql(query);

        return res.status(200).send('Invite ignored');
    } catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }
}

var acceptInvite = async function(req, res) {
    const { senderID, receiverID } = req.body;
    if (!senderID || !receiverID) {
        return res.status(400).send('missing senderID or receiverID');
    }

    try {
        var query = `DELETE FROM invites WHERE sender_id = ${senderID} AND receiver_id = ${receiverID}`;
        await db.send_sql(query);

        // delete the other way around if it exists
        query = `DELETE FROM invites WHERE sender_id = ${receiverID} AND receiver_id = ${senderID}`;
        await db.send_sql(query);

        // create conversation
        //query = `INSERT INTO conversation (user_id, friend_id ) VALUES (${senderID}, ${receiverID})`;
        //await db.send_sql(query);

        query = `INSERT INTO conversation () VALUES ()`;
        await db.send_sql(query);

        query = `SELECT LAST_INSERT_ID() as conversation_id`;
        const conversation = await db.send_sql(query);
        const conversationID = conversation[0].conversation_id;

        query = `INSERT IGNORE INTO user_conversations (conversation_id, user_id) VALUES (${conversationID}, ${senderID})`;
        await db.send_sql(query);

        query = `INSERT IGNORE INTO user_conversations (conversation_id, user_id) VALUES (${conversationID}, ${receiverID})`;
        await db.send_sql(query);

        return res.status(200).send('Invite accepted');
    } catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }
}

var getConversations = async function(req, res) {
    const { userID } = req.query;

    if (!userID) {
        return res.status(400).send('missing UserID');
    }

    try {
        var query = `SELECT conversation_id FROM user_conversations WHERE user_id = ${userID}`;
        const conversations = await db.send_sql(query);

        // include participants in the conversation
        for (var i = 0; i < conversations.length; i++) {
            query = `SELECT u.username FROM user_conversations c LEFT JOIN users u ON c.user_id = u.user_id WHERE conversation_id = ${conversations[i].conversation_id}`;
            const participants = await db.send_sql(query);

            
            conversations[i].participants = participants;
        }

        return res.status(200).send(conversations);
    } catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }
}

var postConversationInvite = async function(req, res) {
    console.log(req);

    const { receiverUsername, conversationID } = req.body;

    if (!receiverUsername || !conversationID) {
        return res.status(400).send('missing receiverID or conversationID');
    }

    try {
        var query = `SELECT user_id FROM users WHERE username = '${receiverUsername}'`;
        const receiver = await db.send_sql(query);

        if (receiver.length == 0) {
            return res.status(404).send('receiver not found');
        }

        const receiverID = receiver[0].user_id;

        console.log('receiverID:', receiverID);

        query = `SELECT * FROM user_conversations WHERE conversation_id = ${conversationID} AND user_id = ${receiverID}`;
        const conversation = await db.send_sql(query);

        if (conversation.length > 0) {
            return res.status(200).send('user already in the conversation');
        }

        var query = `INSERT INTO user_conversations (conversation_id, user_id) VALUES (${conversationID}, ${receiverID})`;
        await db.send_sql(query);

        return res.status(200).send('Invite accepted');
    } catch (error) {
        console.error('error:', error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

var getMembersFromConversation = async function(req, res) {
    const { conversationID } = req.query;

    if (!conversationID) {
        return res.status(400).send('missing conversationID');
    }

    try {
        var query = `SELECT * FROM user_conversations WHERE conversation_id = ${conversationID}`;
        const conversation = await db.send_sql(query);
        return res.status(200).send(conversation);
    } catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }

}

var routes = {
    get_invites: getInvites,
    post_createInvite: createInvite,
    post_ignoreInvite: ignoreInvite,
    post_acceptInvite: acceptInvite,
    get_conversations: getConversations,
    get_membersFromConversation: getMembersFromConversation,
    post_conversationInvite: postConversationInvite
};

module.exports = routes;

/*

1. game plan: user a will invite user b
2. user b will receive the invite
3. user b can accept or ignore the invite
4. if user b accepts the invite, a conversation will be created between user a and user b
5. if user b ignores the invite, the invite will be deleted from the database
6. if user a invites user b again, user b will receive the invite again

7. (upon invite accceptance) on both user a and user b's side, they will be able to a conversation between them
8. both should be able to open up a chat betweeen (a,b)
9. on user a's end, they will fetch all messages between (a,b)
10. etc. whatever happens next happens 

*/