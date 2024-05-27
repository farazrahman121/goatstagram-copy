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

var getFriends = async function(req, res) {
  try {
      const username = req.params.username;

      const query = `select users2.username from users left join friends on users.user_id = friends.follower left join users as users2 on friends.followed = users2.user_id where users.username = '${username}';`;

      const queryResult = await db.send_sql(query);

      return res.status(200).json({results: queryResult});
  } catch (error) {
      console.error('error:', error);
      return res.status(500).json({error: 'Error querying database.'});
  }
}
var addFriend = async function(req, res) {
    try {
        const username = req.params.username;
        const friendName = req.body.friendName;

        const query = `select users.user_id from users where users.username = '${friendName}';`;
        const queryResult = await db.send_sql(query);

        if (queryResult.length == 0) {
            return res.status(400).json({error: "User does not exist."});
        }

        //check your user id, there is probably a better way to do this sorry
        const userIDQuery = `select users.user_id from users where users.username = '${username}';`;
        const userIDResult = await db.send_sql(userIDQuery);

        if (userIDResult.length == 0) {
            return res.status(400).json({error: "Something went wrong."});
        }

        const currUserID = userIDResult[0].user_id;

        const friendID = queryResult[0].user_id;

        if (currUserID == friendID) {
            return res.status(400).json({error: "You cannot friend yourself."});
        }

        //check if already friends
        const alreadyFriendsQuery = `select * from friends where follower = '${currUserID}' and followed = '${friendID}';`;
        const alreadyFriendsResult = await db.send_sql(alreadyFriendsQuery);

        if (alreadyFriendsResult.length > 0) {
            return res.status(400).json({error: "You are already friends with this user."});
        }

        const addQuery = `insert into friends (follower, followed) values ('${currUserID}', '${friendID}');`;
        db.send_sql(addQuery);

        const addQuery2 = `insert into friends (follower, followed) values ('${friendID}', '${currUserID}');`;
        db.send_sql(addQuery2);
  
        return res.status(200).json('Friend added.');
    } catch (error) {
        console.error('error:', error);
        return res.status(500).json({error: 'Error querying database.'});
    }
}
var removeFriend = async function(req, res) {
    try {
        const username = req.params.username;
        const friendName = req.body.friendName;

        const query = `select users.user_id from users where users.username = '${friendName}';`;
        const queryResult = await db.send_sql(query);

        if (queryResult.length == 0) {
            return res.status(400).json({error: "User does not exist."});
        }

        //check your user id, there is probably a better way to do this sorry
        const userIDQuery = `select users.user_id from users where users.username = '${username}';`;
        const userIDResult = await db.send_sql(userIDQuery);

        if (userIDResult.length == 0) {
            return res.status(400).json({error: "Something went wrong."});
        }

        const currUserID = userIDResult[0].user_id;
        const friendID = queryResult[0].user_id;

        if (currUserID == friendID) {
            return res.status(400).json({error: "You cannot unfriend yourself."});
        }

        //check if not already friends
        const alreadyFriendsQuery = `select * from friends where follower = '${currUserID}' and followed = '${friendID}';`;
        const alreadyFriendsResult = await db.send_sql(alreadyFriendsQuery);

        if (alreadyFriendsResult.length == 0) {
            return res.status(400).json({error: "You are not friends with this user."});
        }

        const addQuery = `delete from friends where friends.follower = '${currUserID}' and friends.followed = '${friendID}';`;
        db.send_sql(addQuery);

        const addQuery2 = `delete from friends where friends.follower = '${friendID}' and friends.followed = '${currUserID}';`;
        db.send_sql(addQuery2);
  
        return res.status(200).json('Friend removed.');
    } catch (error) {
        console.error('error:', error);
        return res.status(500).json({error: 'Error querying database.'});
    }
}
var getFriendRecommendations = async function(req, res) {
    try { 
        console.log("getFriendRecommendations CALLED")
        const { token, userID } = req.body;

        // Verify the JWT token to authenticate the user
        // const verified = await verifyJWToken(token, userID);
        // if (!verified) {
        //     return res.status(403).json({error: 'Unauthorized.'});
        // }

        console.log("User verified");

        // Construct the SQL query to select posts
        queryRecommendedFriends = `SELECT u.username, r.source_id, r.target_id, r.weight  
                                    FROM recommendations r 
                                    LEFT JOIN friends f ON r.source_id = f.follower AND r.target_id = f.followed 
                                    INNER JOIN users u ON r.target_id = u.user_id
                                    WHERE r.source_type = 'user' 
                                                    AND r.target_type = 'user' 
                                                    AND r.source_id = ${userID}   
                                                    AND f.follower IS NULL 
                                    ORDER BY r.weight DESC;`

        // Execute the query to get the posts
        const recommendedFriends = await db.send_sql(queryRecommendedFriends);

        //If no posts found, send a different status
        if (recommendedFriends.length === 0) {
            return res.status(404).json({results: []});
        }
        else {
            console.log(recommendedFriends);
            res.status(200).json({results: recommendedFriends});
        }

    }
    catch (error) {
            console.log("Error querying database");
            return res.status(500).json({error: 'Error querying database.'});
    }
}

var routes = {
    get_friends: getFriends,
    add_friend: addFriend,
    remove_friend: removeFriend,
    get_friend_recommendations: getFriendRecommendations
};

module.exports = routes;