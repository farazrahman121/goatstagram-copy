const dbsingleton = require('../models/db_access.js');
const db = dbsingleton;
const { verifyJWToken } = require('../utils/auth.js');
const { searchPosts } = require('../models/chroma_post_match.js');
const { getTempS3URL } = require('../utils/s3.js');


// GET /search/posts - Search for posts by title and text
async function postSearchPosts(req, res) {
    console.log(req);
    try {
        const k = 5;
        const { query, userID, token } = req.body;  

        const verified = await verifyJWToken(token, userID);
        if (!verified) {
            return res.status(403).json({error: 'Unauthorized.'});
        }
        console.log("authorized");

        console.log("query: ", query);
        const results = await searchPosts(query, k);

        let queryPost = `SELECT 
                                p.post_id, p.user_id, p.title, p.text, p.s3_content_key, 
                                p.date, u.username, COUNT(l.post_id) AS likes_count
                            FROM 
                                posts p
                            INNER JOIN 
                                users u ON p.user_id = u.user_id
                            LEFT JOIN 
                                likes l ON p.post_id = l.post_id
                            WHERE
                                p.post_id = ?
                            GROUP BY 
                                p.post_id, p.user_id, p.title, p.text, p.s3_content_key, p.date, u.username`;

        let queryResults = await results.ids[0].map(async (id, i) => {
            const post = await db.send_sql(queryPost, [id]);
            return post[0];
        }); 

        queryResults = await Promise.all(queryResults);

        // copilot did this interesting iterative for loop when I asked it to address await issues but it works...
        for (let i = 0; i < queryResults.length; i++) {
            const post = queryResults[i];
            post.content_url = await getTempS3URL(post.s3_content_key);
        }

        console.log(queryResults);

        res.status(200).json({ results: queryResults });

    } catch (error) {
        console.error('Search posts error:', error);
        res.status(500).json({ error: 'Error searching for posts.' });
    }
}

var routes = {
    post_searchPosts: postSearchPosts
}

module.exports = routes;