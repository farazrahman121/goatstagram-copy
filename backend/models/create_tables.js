const dbaccess = require('./db_access');
const config = require('../config.json'); // Load configuration


// DELETE?
// function sendQueryOrCommand(db, query, params = []) {
//     return new Promise((resolve, reject) => {
//       db.query(query, params, (err, results) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(results);
//         }
//       });
//     });
//   }

async function create_all_tables(db) {

  // USERS TABLE
  var users = db.create_tables(`CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255)
  );`);
  
  // POSTS TABLE
  var posts = db.create_tables(`CREATE TABLE IF NOT EXISTS posts (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255),
    text VARCHAR(255),
    s3_content_key VARCHAR(255),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  );`);

  // NEWS TABLE
  var news = db.create_tables(`CREATE TABLE IF NOT EXISTS news (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    title VARCHAR(255),
    source_site VARCHAR(255),
    post_uuid_within_site VARCHAR(255),
    text VARCHAR(255),
    likes INT,
    content_type VARCHAR(255),
    s3_content_key VARCHAR(255),
    attach VARCHAR(255),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`);

  // LIKES TABLE
  var likes = db.create_tables(`CREATE TABLE IF NOT EXISTS likes (
    user_id INT,
    post_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
  );`);

  // COMMENTS TABLE
  var comments = db.create_tables(`CREATE TABLE IF NOT EXISTS comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    post_id INT,
    parent_id INT NULL,
    comment_text VARCHAR(255),
    comment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (post_id) REFERENCES posts(post_id),
    FOREIGN KEY (parent_id) REFERENCES comments(comment_id)
  );`);
  
  // FRIENDS TABLE
  var friends = db.create_tables(`CREATE TABLE IF NOT EXISTS friends (
    follower INT,
    followed INT,
    FOREIGN KEY (follower) REFERENCES users(user_id),
    FOREIGN KEY (followed) REFERENCES users(user_id)
  );`);

  // RECOMMENDATIONS TABLE - ?????????
  var recommendations = db.create_tables(`CREATE TABLE IF NOT EXISTS recommendations (
    person INT,
    recommendation INT,
    strength INT,
    FOREIGN KEY (person) REFERENCES users(user_id),
    FOREIGN KEY (recommendation) REFERENCES users(user_id)
  );`);

  // HASHTAGS TABLE
  var user_hashtags = db.create_tables(`CREATE TABLE IF NOT EXISTS user_hashtags ( 
    hashtag VARCHAR(255),
    user_id INT REFERENCES users(user_id)
  );`);

  var post_hashtags= db.create_tables(`CREATE TABLE IF NOT EXISTS post_hashtags ( 
    hashtag VARCHAR(255),
    post_id INT REFERENCES users(user_id)
  );`);

  var news_hashtags= db.create_tables(`CREATE TABLE IF NOT EXISTS news_hashtags ( 
    hashtag VARCHAR(255),
    post_id INT REFERENCES users(user_id)
  );`);
  
  // ACTOR TABLE
  var actors = db.create_tables(`CREATE TABLE IF NOT EXISTS actors (
    primaryName VARCHAR(255) NOT NULL UNIQUE,
    birthYear INT,
    deathYear INT,
    nconst VARCHAR(255),
    nconst_short VARCHAR(255)
  );`);

  // FACE MATH TABLE, INTENTIONALLY SET UP LIKE THIS FOR SIMPLICITY'S SAKE
  var face_match = db.create_tables(`CREATE TABLE IF NOT EXISTS face_match (
    user_id INT,
    actor_name VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  );`);

  // SPARK_RANK DUMP
  var recommendations = db.create_tables(`CREATE TABLE IF NOT EXISTS reccomendations (
    source_type VARCHAR(255),
    source_id VARCHAR(255),
    target_type VARCHAR(255),
    target_id VARCHAR(255),
    weight FLOAT
  );`);

  var invitation = db.create_tables(`CREATE TABLE IF NOT EXISTS invites (
    sender_id INT,
    receiver_id INT,
    FOREIGN KEY (sender_id) REFERENCES users(user_id),
    FOREIGN KEY (receiver_id) REFERENCES users(user_id)
  );`)

  // one table is SOLELY dedicated to storing all conversations
  var conversation = db.create_tables(`CREATE TABLE IF NOT EXISTS conversation (
    conversation_id INT AUTO_INCREMENT PRIMARY KEY
  );`)

  var user_conversations = db.create_tables(`CREATE TABLE IF NOT EXISTS user_conversations (
    user_id INT,
    conversation_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversation(conversation_id),
    PRIMARY KEY (user_id, conversation_id)
  );`)

  // MESSAGES TABLE
  var messages = db.create_tables(`CREATE TABLE IF NOT EXISTS messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT,
    conversation_id INT,
    message TEXT,
    message_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversation(conversation_id)
  );`);



  return await Promise.all([
    users, 
    posts, 
    likes,
    news,
    comments,
    friends,
    user_hashtags,
    post_hashtags,
    news_hashtags,
    actors,
    face_match,
    recommendations,
    invitation,
    conversation,
    user_conversations,
    messages

  ]);
}

// Database connection setup
const db = dbaccess.get_db_connection();

create_all_tables(dbaccess).then(() => {
  dbaccess.close_db();
});
//console.log('Tables created');

const PORT = config.serverPort;