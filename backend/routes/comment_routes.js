const dbsingleton = require('../models/db_access.js');
const helper = require('../routes/route_helper.js');

const { verifyJWToken } = require('../utils/auth.js');

const { getHashtags } = require('../utils/hashtags.js');

const db = dbsingleton;

// GET /comments (retrieves comments for a post) - REQUIRES TOKEN
var getComments = async function(req, res) {
    const { post_id } = req.query;

    if (!post_id) {
        return res.status(400).json({error: 'Post ID is required.'});
    }
    
    try {
        // TODO: CHECK AUTH
        // i dont know why you need auth to see comments

        var query = `
            SELECT comments.*, users.username
            FROM comments  
            INNER JOIN 
                users ON comments.user_id = users.user_id
            WHERE comments.post_id = ${post_id};`;

        const queryResult = await db.send_sql(query);
        
        res.status(200).json({results: queryResult});
    } catch (error) {
        console.error('error:', error);
        return res.status(500).json({error: 'Error querying database for comments.'});
    }
}

var getRootComment = async function(req, res) {
    const { post_id } = req.query;

    if (!post_id) {
        return res.status(400).json({error: 'Post ID is required.'});
    }
    
    try {
        var query = `
            SELECT comments.*, users.username
            FROM comments  
            INNER JOIN 
                users ON comments.user_id = users.user_id
            WHERE comments.post_id = ${post_id} AND comments.parent_id IS NULL;`;

        const queryResult = await db.send_sql(query);
        
        res.status(200).json({results: queryResult});
    } catch (error) {
        console.error('error:', error);
        return res.status(500).json({error: 'Error querying database for comments.'});
    }
}
var getCommentsFromParent = async function(req, res) {
    const { parent_id } = req.query;

    if (!parent_id) {
        return res.status(400).json({error: 'Parent ID is required.'});
    }
    
    try {
        var query = `
            SELECT comments.*, users.username
            FROM comments  
            INNER JOIN 
                users ON comments.user_id = users.user_id
            WHERE comments.parent_id = ${parent_id};`;

        const queryResult = await db.send_sql(query);
        
        res.status(200).json({results: queryResult});
    } catch (error) {
        console.error('error:', error);
        return res.status(500).json({error: 'Error querying database for comments.'});
    }
}

// POST /comments (writes a comment for a particular post) - REQUIRES TOKEN
var postComment = async function(req, res) {
    console.log(req);

    try {
        const { post_id, parent_id, comment_text, userID, token } = req.body;

        if (!post_id || !comment_text) {
            return res.status(400).json({error: 'Post ID or comment text is required.'});
        }

        const verified = await verifyJWToken(token, userID);
        if (!verified) {
            return res.status(403).json({error: 'Unauthorized.'});
        }

        const hashtags = getHashtags(comment_text);
        hashtags.forEach(async (hashtag) =>{
            // check if hashtag exists
            let query = `SELECT * FROM post_hashtags WHERE hashtag = "${hashtag}" AND post_id = "${post_id}";`;
            const result = await db.send_sql(query);

            if (result.length === 0) {
                // insert hashtag
                query = `INSERT INTO post_hashtags (hashtag, post_id) VALUES ("${hashtag}", ${post_id});`;
                await db.send_sql(query);
            }
        })

        var query = `INSERT INTO comments (user_id, post_id, parent_id, comment_text) 
        VALUES (
            ${userID}, ${post_id}, ${parent_id}, "${comment_text}"
        );`;

        await db.insert_items(query);
        res.status(201).json({message: "Comment created."});

    } catch (error) {
        console.error('error:', error);
        return res.status(500).json({error: 'Error creating comment in database.'});
    }
}

var routes = {
    get_comments: getComments,
    get_comments_from_parent: getCommentsFromParent,
    get_root_comment: getRootComment,
    post_comment: postComment
};

module.exports = routes;