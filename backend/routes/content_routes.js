const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('../routes/route_helper.js');
const { Kafka } = require('kafkajs');
const { getTempS3URL, postTempS3URL } = require('../utils/s3.js');
const { addPostCaptionToChroma } = require('../models/chroma_post_match.js');

const { verifyJWToken } = require('../utils/auth.js');

const { getHashtags } = require('../utils/hashtags.js');
var currentDate = new Date();

// Database connection setup
const db = dbsingleton;

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: config.bootstrapServers
});

// producer stuff
async function producerStart(username, source_site, post_uuid_within_site, post_text, content_type) {
    const producer = kafka.producer({ 
        groupId: config.groupId, 
        bootstrapServers: config.bootstrapServers});
    await producer.connect();

    const deliveryReports = await producer.send({
        topic: 'Federated-Posts', 
        messages: [
            { value: `{"username": "${username}","source_site": "${source_site}", "post_uuid_within_site": "${post_uuid_within_site}", "post_text": "${post_text}", "content_type": "${content_type}"}` } 
        ]
    });

    console.log('Message sent:', deliveryReports);

    await producer.disconnect();
}

// POST /createPost - REQUIRES TOKEN

// the client should first call this method to get a signed URL to upload an image to S3
// and then call createPost with the s3_content_key
var getS3TempPostUrl = async function(req, res) {
    console.log("uploadImage CALLED");
    const { userID, token } = req.body;

    console.log("UserID: ", userID, "Token: ", token);

    const verified = await verifyJWToken(token, userID);
    if (!verified) {
        return res.status(403).json({error: 'Unauthorized.'});
    }
    console.log("go squad"); // on verification

    result = await postTempS3URL();
    console.log(result);
    res.status(200).json(result);
}

// TODO: ISSUE OUR CAPTIONS CANNOT HAVE QUOTES IN THEM ...........
var createPost = async function(req, res) {
    console.log("createPost CALLED");
    try {
        console.log(req.body);
        const { title, text, s3_content_key, userID, token } = req.body;

        const verified = await verifyJWToken(token, userID);
        if (!verified) {
            return res.status(403).json({error: 'Unauthorized.'});
        }
        console.log("go squad"); // on verification

        // non-empty checks
        if (!title || (!s3_content_key && !text)) {
            return res.status(400).json({error: 'Ooogity Boogity you forgot to include a title or content.'});
        }

        console.log(`input was title: ${title}, s3_content_key: ${s3_content_key}, userID: ${userID}`);
        
        // edited
        const insertQuery = `INSERT INTO posts (user_id, title, text, s3_content_key) 
        VALUES (
            ?, ?, ?, ?
        );`
        await db.insert_items(insertQuery, [userID, title, text, s3_content_key]);

        // get post_id
        const post_id_query = `SELECT post_id FROM posts WHERE user_id = ? AND title = ? AND text = ? AND s3_content_key = ?;`;
        const post_id_response = await db.send_sql(post_id_query, [userID, title, text, s3_content_key]);
        const post_id = post_id_response[0].post_id;

        // create default root comment
        const root_comment_query = `INSERT INTO comments (user_id, post_id, parent_id, comment_text) VALUES (?, ?, NULL, ?);`;
        await db.insert_items(root_comment_query, [userID, post_id, text]);

        //get username
        const username_query = `SELECT username FROM users WHERE user_id = '${userID}';`
        const username = await db.send_sql(username_query);

        const hashtags = getHashtags(text);
        hashtags.forEach(async (hashtag) => {
            // check if hashtag exists
            console.log("hashtag: ", hashtag);
            let query = `INSERT INTO post_hashtags (hashtag, post_id) VALUES (?, ?);`;
            await db.send_sql(query, [hashtag, post_id]);
        })


        // SEND POST TO CHROMA DB
        console.log("sending post to chroma");
        await addPostCaptionToChroma(text, post_id, userID);

        // SEND POST TO KAFKA
        // producerStart(username, "goats", post_id, text, "text/plain");
        
        // going to comment this out for now since i dont have kafka set up sorry ray
        producerStart(username, "goats", post_id, text, "text/plain");

        res.status(201).json({message: "Post created."});
    } catch (error) {
        console.error('error:', error);
        return res.status(500).json({error: 'Error creating post in database.'});
    }
}

// GET post information
var getPost = async function(req, res) {
    const { post_id } = req.query;

    if (!post_id) {
        return res.status(400).json({error: 'Post ID is required.'});
    }

    try {
        var query = `SELECT * FROM posts LEFT JOIN users ON posts.user_id = users.user_id WHERE post_id = ${post_id};`;
        const result = await db.send_sql(query);

        if (result.length === 0) {
            return res.status(400).json({error: 'Post does not exist.'});
        }

        // get s3 url
        const post = result[0];
        post.content_url = await getTempS3URL(post.s3_content_key);

        res.status(200).json({results: result});
    } catch (error) {
        return res.status(500).json({error: 'Error getting post.'});
    }
}

// GET /feed (retrieves posts for the current user) - REQUIRES TOKEN
var getFeed = async function(req, res) {
    console.log("getFeed CALLED")
    let { token , userID } = req.body;

    const verified = await verifyJWToken(token, userID);
    if (!verified) {
        return res.status(403).json({error: 'Unauthorized.'});
    }
    console.log("go squad"); // on verification

    try {
        // EXTRA: ADD PAGINATION
        var query = `
        WITH friend_ids AS (
            SELECT followed AS user_id FROM friends WHERE follower = ${userID}
        ), 
        followed_hashtags AS (
            SELECT hashtag FROM user_hashtags WHERE user_id = ${userID}
        )
        SELECT 
            p.post_id, p.user_id, p.title, p.text, p.s3_content_key, 
            p.date, u.username, COUNT(l.post_id) AS likes_count
        FROM 
            posts p
        INNER JOIN 
            users u ON p.user_id = u.user_id
        LEFT JOIN 
            likes l ON p.post_id = l.post_id
        LEFT JOIN 
            post_hashtags h ON p.post_id = h.post_id
        WHERE u.user_id IN (SELECT f.user_id FROM friend_ids f) OR h.hashtag IN (SELECT h.hashtag FROM followed_hashtags h)
        GROUP BY 
            p.post_id, p.user_id, p.title, p.text, p.s3_content_key, p.date, u.username
        ORDER BY
            p.date DESC;`;

        // TODO: ADD TOP COMMENT QUERY?

        const queryResult = await db.send_sql(query);

        // copilot did this interesting iterative for loop when I asked it to address await issues but it works...
        for (let i = 0; i < queryResult.length; i++) {
            const post = queryResult[i];
            post.content_url = await getTempS3URL(post.s3_content_key);
        }
        // console.log(queryResult);

        res.status(200).json({ results: queryResult });

    } catch (error) {
        console.error('error:', error);
        return res.status(500).json({error: 'Error querying database for feed.'});
    }
}

var getNumLikes = async function(req, res) {
    try {
        const { postID } = req.query;
        const parsedPostID = parseInt(postID, 10);
        if (isNaN(parsedPostID)) {
            return res.status(400).json({ error: 'Invalid postID provided.' });
        }

        var query = `SELECT COUNT(*) AS number_of_likes
        FROM likes
        WHERE post_id = ?;
        `;

        const queryResult = await db.send_sql(query, [parsedPostID]);
        const result = queryResult[0].number_of_likes;
        res.status(200).json({ results: result });
    } catch (error) {
        console.error('error:', error);
        return res.status(500).json({error: 'Error querying database.'});
    }
}


// GET /explore (retrieves posts for the current user) - REQUIRES TOKEN
var getExplore = async function(req, res) {
    console.log("getExplore CALLED")
    // TODO: CHECK AUTH CURRENTLY ANYONE CAN SEE ANY USER

    try {
        // EXTRA: CHANGE THIS QUERY SO THAT IT ONLY GETS POSTS OF PEOPLE THAT THE USER FOLLOWS
        // EXTRA: ADD PAGINATION
        // EXTRA: ADD LIKES COUNT IN SQL QUERY
        var query = `
        WITH detailed_posts AS (SELECT 
                        p.post_id, p.user_id, p.title, p.text, p.s3_content_key, 
                        p.date, u.username, COUNT(l.post_id) AS likes_count
                    FROM 
                        posts p
                    INNER JOIN 
                        users u ON p.user_id = u.user_id
                    LEFT JOIN 
                        likes l ON p.post_id = l.post_id
                    GROUP BY 
                        p.post_id, p.user_id, p.title, p.text, p.s3_content_key, p.date, u.username
                    ORDER BY
                        p.date DESC),
        post_rankings AS (
            SELECT target_id 
            AS post_id, SUM(weight) AS weight
            FROM recommendations 
            WHERE target_type = "post" 
            GROUP BY target_id
        )
        SELECT * 
        FROM detailed_posts p
        INNER JOIN post_rankings r
            ON p.post_id = r.post_id
        ORDER BY r.weight DESC;`;

        // TODO: ADD TOP COMMENT QUERY?

        const queryResult = await db.send_sql(query);

        // copilot did this interesting iterative for loop when I asked it to address await issues but it works...
        for (let i = 0; i < queryResult.length; i++) {
            const post = queryResult[i];
            post.content_url = await getTempS3URL(post.s3_content_key);
        }
        // console.log(queryResult);

        res.status(200).json({ results: queryResult });

    } catch (error) {
        console.error('error:', error);
        return res.status(500).json({error: 'Error querying database for feed.'});
    }
}



// GET /profile - REQUIRES TOKEN
var getProfile = async function(req, res) {
    const { username } = req.params;
    //const { userID } = req.query;
    
    // TODO: CHECK AUTH CURRENTLY ANYONE CAN SEE ANY USER


    // TODO: EXTRA CREDIT = PRIVATE ACCOUNTS?
    if (!username) {
        return res.status(400).json({error: 'Username is required.'});
    }

    const queryUserId = `SELECT user_id FROM users WHERE username = ?`;
    const result = await db.send_sql(queryUserId, [username]);

    if (result.length === 0) {
        return res.status(400).json({error: 'User does not exist.'});
    }

    const userID = result[0].user_id;

    const query_userId = userID;
    
    let queryInfo = `SELECT 
                    users.user_id, users.username, 
                    users.first_name, users.last_name, 
                    users.email,
                        COUNT(DISTINCT friends.followed) AS friends_count
                    FROM users
                    LEFT JOIN friends ON users.user_id = friends.follower
                    WHERE users.user_id = ${query_userId}
                    GROUP BY users.user_id;`

    let queryPosts = `SELECT p.post_id, p.user_id, p.title, p.text, p.s3_content_key, p.date
                        FROM posts p
                        WHERE user_id = ${query_userId}
                        ORDER BY date DESC;`
    
    const infoResults = await db.send_sql(queryInfo);
    const postResults = await db.send_sql(queryPosts);

    for (let i = 0; i < postResults.length; i++) {
        const post = postResults[i];
        post.content_url = await getTempS3URL(post.s3_content_key);
    }

    let queryHashtags = `SELECT hashtag FROM user_hashtags WHERE user_id = ${query_userId};`
    const hashtagResults = await db.send_sql(queryHashtags);
    infoResults[0].hashtags = hashtagResults;

    let queryActor = `SELECT actor_name FROM face_match WHERE user_id = ${query_userId};`
    const actorResults = await db.send_sql(queryActor);
    infoResults[0].actor = actorResults;

    res.status(200).json({info: infoResults, posts: postResults}); 
}

var getUserHashtags = async function(req, res) {
    const { userID } = req.query;

    try {
        var query = `SELECT hashtag FROM user_hashtags WHERE user_id = ${userID};`;
        const result = await db.send_sql(query);

        res.status(200).json({hashtags: result});
    } catch (err) {
        return res.status(500).json({error: 'Error getting hashtags.'});
    }
}

var postUserHashtag = async function(req, res) {
    const { userID, hashtagList } = req.body;

    const validhashtagList = hashtagList && hashtagList.length > 0;

    if (!userID || !validhashtagList) {
        return res.status(400).json({error: 'User ID and hashtag are required.'});
    }

    try {
        // check if user exists
        const userQuery = `SELECT * FROM users WHERE user_id = ${userID};`;
        const userResult = await db.send_sql(userQuery);

        if (userResult.length === 0) {
            return res.status(400).json({error: 'User does not exist.'});
        }

        // check if user is already linked to the hashtag
        hashtagList.forEach(async (hashtag) => {
            let query = `
            SELECT * 
            FROM user_hashtags
            WHERE (user_id = ${userID} AND hashtag = "${hashtag}");`;

            const result = await db.send_sql(query);

            if (result.length == 0) {
                query = `
                INSERT INTO user_hashtags (hashtag, user_id)
                VALUES ("${hashtag}", ${userID});`;

                await db.send_sql(query);
            }
        })

        res.status(201).json({message: 'Hashtags linked to user.'});
    } catch (error)  {
        return res.status(500).json({error: 'Error linking hashtags to user.'});
    }
}

var postDeleteUserHashtag = async function(req, res) {
    const { userID } = req.body;

    if (!userID) {
        return res.status(400).json({error: 'User ID and hashtag are required.'});
    }

    try {
        // check if user exists
        const userQuery = `SELECT * FROM users WHERE user_id = ${userID};`;
        const userResult = await db.send_sql(userQuery);

        if (userResult.length === 0) {
            return res.status(400).json({error: 'User does not exist.'});
        }

        // find all hashtags linked to user
        const query = `DELETE FROM user_hashtags WHERE user_id = ${userID};`;
        await db.send_sql(query);

        res.status(201).json({message: 'Hashtags unlinked from user.'});
    } catch (error)  {
        return res.status(500).json({error: error});
    }
}

var postPostHashtag = async function(req, res) {
    const { postID, hashtagList } = req.body;

    const validhashtagList = hashtagList && hashtagList.length > 0;

    if (!postID || !validhashtagList) {
        return res.status(400).json({error: 'Post ID and hashtag are required.'});
    }

    try {
        // check if post exists
        const postQuery = `SELECT * FROM posts WHERE post_id = ${postID};`;
        const postResult = await db.send_sql(postQuery);

        if (postResult.length === 0) {
            return res.status(400).json({error: 'Post does not exist.'});
        }

        // check if post is already linked to the hashtag
        hashtagList.forEach(async (hashtag) => {
            let query = `
            SELECT * 
            FROM post_hashtags
            WHERE (post_id = ${postID} AND hashtag = "${hashtag}");`;

            const result = await db.send_sql(query);

            if (result.length == 0) {
                query = `
                INSERT INTO post_hashtags (hashtag, post_id) 
                VALUES ("${hashtag}", ${postID});`;

                await db.send_sql(query);
            }
        });

        res.status(201).json({message: 'Hashtags linked to post.'});
    } catch (error)  {
        return res.status(500).json({error: 'Error linking hashtags to post.'});
    }
}

var postLikePost = async function(req, res) {
    const { postID, userID, token } = req.body;

    const verified = await verifyJWToken(token, userID);
    if (!verified) {
        return res.status(403).json({error: 'Unauthorized.'});
    }

    if (!postID) {
        return res.status(400).json({error: 'Post ID is required.'});
    }

    try {
        const query = `INSERT IGNORE INTO likes (user_id, post_id) VALUES (${userID}, ${postID});`;
        await db.send_sql(query);

        res.status(201).json({like: true});
    } catch (error) {
        return res.status(500).json({error: 'Error liking post.'});
    }
}

var postUnlikePost = async function(req, res) {
    const { postID, userID, token } = req.body;

    const verified = await verifyJWToken(token, userID);
    if (!verified) {
        return res.status(403).json({error: 'Unauthorized.'});
    }

    if (!postID) {
        return res.status(400).json({error: 'Post ID is required.'});
    }

    try {
        const query = `DELETE FROM likes WHERE user_id = ${userID} AND post_id = ${postID};`;
        await db.send_sql(query);

        res.status(201).json({like: false});
    } catch (error) { 
        return res.status(500).json({error: 'Error unliking post.'});
    }
}

var getIsLiked = async function(req, res) {
    const { postID, userID } = req.query;

    if (!postID || !userID) {
        return res.status(400).json({error: 'Post ID and user ID are required.'});
    }

    try {
        const query = `SELECT * FROM likes WHERE user_id = ${userID} AND post_id = ${postID};`;
        const result = await db.send_sql(query);

        res.status(200).json({isLiked: result.length > 0});
    } catch (error) {
        return res.status(500).json({error: 'Error checking if post is liked.'});
    }
}


var getTopHashtags = async function(req, res) {
    try {
        console.log("getting top hashtags");

        const countQuery = `SELECT hashtag, COUNT(*) AS hashtag_count
        FROM (
            SELECT hashtag FROM news_hashtags
            UNION ALL
            SELECT hashtag FROM post_hashtags
        ) AS combined_hashtags
        GROUP BY hashtag
        ORDER BY hashtag_count DESC
        LIMIT 10;`
        const result = await db.send_sql(countQuery);

        res.status(200).json({results: result});
    } catch (error) {
        return res.status(500).json({error: error});
    }
}

var routes = {
    create_post: createPost,
    get_post: getPost,
    get_feed: getFeed,
    get_explore: getExplore,
    get_profile: getProfile,
    get_s3_temp_post_url: getS3TempPostUrl,
    post_userhashtag: postUserHashtag,
    post_posthashtag: postPostHashtag,
    post_likepost: postLikePost,
    post_unlikepost: postUnlikePost,
    get_hashtags: getUserHashtags,
    get_isliked: getIsLiked,
    delete_userhashtag: postDeleteUserHashtag,
    get_num_likes: getNumLikes,
    get_top_hashtags: getTopHashtags
};


module.exports = routes;