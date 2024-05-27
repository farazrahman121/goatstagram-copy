const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('../routes/route_helper.js');
const { verifyJWToken } = require('../utils/auth.js');
const { Kafka } = require('kafkajs');
const { getHashtags } = require('../utils/hashtags.js');

const {  CompressionTypes, CompressionCodecs } = require('kafkajs')
const SnappyCodec = require('kafkajs-snappy')
 
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec

/**
 * THESE ROUTES HAVE NOT BEEN TESTED OR VERIFIED TO WORK
 */

// Database connection setup (idk why this is renamed twice in the original
// routes.js, but we do it again here to be consistent)
const db = dbsingleton;

//kafka setup stuff
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: config.bootstrapServers
});

const consumer1 = kafka.consumer({ 
    groupId: config.groupId, 
    bootstrapServers: config.bootstrapServers});
  
const consumer2 = kafka.consumer({ 
    groupId: config.groupId2, 
    bootstrapServers: config.bootstrapServers});

function getImage(text) {
    const regex = new RegExp("<img src.*?\/>", "g");
    const matches = text.match(regex);
    return matches ? matches.map(match => match.substring(1)) : [];
}

const run = async () => {
    // Consuming
    await consumer2.connect();
    await consumer2.subscribe({ topic: "Twitter-Kafka", fromBeginning: true });
    await consumer2.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                var item = JSON.parse(message.value.toString());
                const username = item.author_id;
                const source_site = "twitter";
                const post_uuid_within_site = item.id;
                const text = item.text;
                const likes = item.likes;

                //check if any duplicates
                const duplicateQuery = `SELECT * FROM news WHERE 
                username = ? AND source_site = ? AND post_uuid_within_site = ? AND text = ?;`;
                const duplicateQueryResponse = await db.send_sql(duplicateQuery, [username, source_site, post_uuid_within_site, text]);

                if (duplicateQueryResponse.length == 0) {
                    const insertQuery = `INSERT INTO news (username, title, source_site, post_uuid_within_site, text, likes) VALUES (?, ?, ?, ?, ?, ?);`

                    await db.insert_items(insertQuery, [username, "Twitter Post", source_site, post_uuid_within_site, text, likes]);

                    // get post_id
                    const post_id_query = `SELECT post_id FROM news WHERE username = ? AND source_site = ? AND post_uuid_within_site = ? AND text = ?;`;
                    const post_id_response = await db.send_sql(post_id_query, [username, source_site, post_uuid_within_site, text]);
                    const post_id = post_id_response[0].post_id;

                    console.log("TWITTER POST");

                    const hashtags = getHashtags(text);
                    hashtags.forEach(async (hashtag) => {
                        console.log("hashtag: ", hashtag);
                        let query = `INSERT INTO news_hashtags (hashtag, post_id) VALUES (?, ?);`;
                        await db.send_sql(query, [hashtag, post_id]);
                    });

                } 

            } catch (error) {
                console.log("not a valid post");
            }
        },
    });

    await consumer1.connect();
    await consumer1.subscribe({ topic: "FederatedPosts", fromBeginning: true });
    await consumer1.run({
        eachMessage: async ({ topic, partition, message }) => { 
            try {
                //console.log(message.value.toString());

                var item = JSON.parse(message.value.toString());
                const attach = item.attach;
                const username = item.username;
                const source_site = item.source_site;
                const post_uuid_within_site = item.post_uuid_within_site;
                const text = item.post_text;

                if (attach && attach.length > 9) {
                    const help = attach.split(`"`)[1];

                    const duplicateQuery = `SELECT * FROM news WHERE 
                    username = ? AND source_site = ? AND post_uuid_within_site = ? AND text = ?;`;
                    const duplicateQueryResponse = await db.send_sql(duplicateQuery, [username, source_site, post_uuid_within_site, text]);

                    if (duplicateQueryResponse.length == 0) {
                        const insertQuery = `INSERT INTO news (username, title, source_site, post_uuid_within_site, text, attach) VALUES (?, ?, ?, ?, ?, ?);`

                        await db.insert_items(insertQuery, [username, "Federated Post", source_site, post_uuid_within_site, text, help]);

                        // get post_id
                        const post_id_query = `SELECT post_id FROM news WHERE username = ? AND source_site = ? AND post_uuid_within_site = ? AND text = ?;`;
                        const post_id_response = await db.send_sql(post_id_query, [username, source_site, post_uuid_within_site, text]);
                        const post_id = post_id_response[0].post_id;

                        //console.log("FEDERATED POST");

                        const hashtags = getHashtags(text);
                        hashtags.forEach(async (hashtag) => {
                            console.log("hashtag: ", hashtag);
                            let query = `INSERT INTO news_hashtags (hashtag, post_id) VALUES (?, ?);`;
                            await db.send_sql(query, [hashtag, post_id]);
                        });

                    } 
                }

            } catch (error) {
                console.log("not a valid post");
            }
        },
    }); 
};

run().catch(console.error);

var getNewsFeed = async function(req, res) {
    console.log("getNewsFeed CALLED");
    try {
        const { token, userID } = req.body;

        // Verify the JWT token to authenticate the user
        // const verified = await verifyJWToken(token, userID);
        // if (!verified) {
        //     return res.status(403).json({error: 'Unauthorized.'});
        // }

        console.log("User verified");

        // Construct the SQL query to select posts
        const selectQuery = `
            SELECT *
            FROM news
            ORDER BY news.date DESC
            LIMIT 20;
        `;

        // Execute the query to get the posts
        const posts = await db.send_sql(selectQuery);

        //If no posts found, send a different status
        if (posts.length === 0) {
            return res.status(404).json({error: 'No posts found.'});
        }

        console.log(posts);

        console.log(`Fetched ${posts.length} posts`);

        // Respond with the fetched posts
        res.status(200).json({results: posts});
    } catch (error) {
        console.error('Error fetching news feed:', error);
        return res.status(500).json({error: 'Error fetching news feed from database.'});
    }
}


var routes = {
    get_news_feed: getNewsFeed
};

module.exports = routes;