const multer = require('multer');

const upload = multer({ dest: 'uploads/' });
const auth_routes = require('./auth_routes.js');
const chat_routes = require('./chat_routes.js');
const content_routes = require('./content_routes.js');
const social_routes = require('./social_routes.js');
const face_routes = require('./face_routes.js');
const news_routes = require('./news_routes.js');
const comment_routes = require('./comment_routes.js');
const profile_routes = require('./profile_routes.js');
const search_routes = require('./search_routes.js');
const invite_routes = require('./invite_routes.js');


// export a function called register_routes which can be passed an app
// to register routes for

module.exports = {
    register_routes
}

function register_routes(app) {

    // AUTH ROUTES
    app.post('/login', auth_routes.post_login);
    app.post('/register', auth_routes.post_register);

    // CONTENT ROUTES
    app.post('/createPost', content_routes.create_post); 
    app.get('/getPost', content_routes.get_post);
    app.post('/getS3TempPostUrl', content_routes.get_s3_temp_post_url);
    app.post('/feed', content_routes.get_feed);
    app.get('/explore', content_routes.get_explore);

    // COMMENT ROUTES
    app.post('/postComment', comment_routes.post_comment);
    app.get('/getComments', comment_routes.get_comments);
    app.get('/getCommentsFromParent', comment_routes.get_comments_from_parent);
    app.get('/getRootComment', comment_routes.get_root_comment);

    // HASHTAG ROUTES
    app.post('/postUserHashtag', content_routes.post_userhashtag);
    app.post('/postPostHashtag', content_routes.post_posthashtag);
    app.get('/getHashtags', content_routes.get_hashtags);
    app.post('/deleteUserHashtags', content_routes.delete_userhashtag);

    //gets top hashtags
    app.get('/getTopHashtags', content_routes.get_top_hashtags);

    // LIKE ROUTES
    app.post('/likePost', content_routes.post_likepost);
    app.post('/unlikePost', content_routes.post_unlikepost);
    app.get('/isLikedPost', content_routes.get_isliked);
    app.get('/getNumLikes', content_routes.get_num_likes);

    // note that these arent actually the URLs the end users will see 
    // just the routes we should standardize using JSON bodies to carry information
    app.get('/:username/profile', content_routes.get_profile); 

    // CHAT ROUTES - Faraz wants to websocket this tho
    app.post('chat/:username', chat_routes.get_chat);
    app.post('/messages/send', chat_routes.post_message);

    // NEWS ROUTES - Raymond
    app.get('/news', news_routes.get_news_feed);

    // face match route
    app.post('/faceMatches', upload.single('image'), face_routes.post_face_matches);
    app.put('/matchUserActor', face_routes.put_match_user_actor);
    app.get('/getActor', face_routes.get_actor);
    app.get('/getActorPhoto', face_routes.get_actor_photo);

    // SOCIAL ROUTES
    app.get('/:username/friends', social_routes.get_friends);
    app.post('/:username/friends/add', social_routes.add_friend);
    app.post('/:username/friends/remove', social_routes.remove_friend);
    app.post('/friends/recommendations', social_routes.get_friend_recommendations);

    // PROFILE CHANGE ROUTES
    app.post('/:username/profile/changeEmail', profile_routes.change_email);
    app.post('/:username/profile/changePassword', profile_routes.change_password);

    //search routes
    // this should be a get but I don't care
    app.post('/searchPosts', search_routes.post_searchPosts);

    // invite routes
    app.get('/getInvites', invite_routes.get_invites);
    app.post('/sendInvite', invite_routes.post_createInvite);
    app.post('/acceptInvite', invite_routes.post_acceptInvite);
    app.post('/declineInvite', invite_routes.post_ignoreInvite);
    app.post('/inviteToConversation', invite_routes.post_conversationInvite);

    // i know it's from invite routes but it is 3:18 am and frankly I don't really care
    app.get('/getConversations', invite_routes.get_conversations);

    //kms kms kms
    app.get('/getMessageHistory', chat_routes.get_message_history);
}
