from db_access import MySQLDatabase
from helpers import compare_json_lists_subset
from helpers import runTest
from helpers import addTest
import requests
import csv


# SEE BELOW FOR EXAMPLE TEST CASES, MAKE 
# SURE TO ADD TEST CASE tests LIST USING
# @addTest(tests) DECORATOR
tests = []
URL = "http://localhost:8080"

token = None # global variable to store token 


# Example test case (copy paste this to create a new test)
@addTest(tests)
def testExample(db):
    #TODO: Add your test code here

    return True

# Test the db_access class
@addTest(tests)
def testdb_access(db):

    create_table_query = """
    CREATE TABLE IF NOT EXISTS test ( 
    tconst VARCHAR(10) PRIMARY KEY, 
    primaryTitle VARCHAR(255) 
    );
    """

    db.execute_query("DROP TABLE IF EXISTS test")
    db.create_tables(create_table_query)
    db.insert_items("INSERT IGNORE INTO test (tconst, primaryTitle) VALUES (%s, %s)", ('tt0000001', 'DivekPatel'))
    result = db.execute_query("SELECT * FROM test")
    db.execute_query("DROP TABLE IF EXISTS test")


    # Check if expected JSON string is equal to the result
    expected_json = [{'tconst': 'tt0000001', 'primaryTitle': 'DivekPatel'}]
    return compare_json_lists_subset(expected_json, result)

@addTest(tests)
def testSetup(db):
    # Delete stuff with foreign key requirements first
    db.execute_query("DELETE FROM posts WHERE title = 'Test Title'")
    db.execute_query("DELETE FROM users WHERE username = 'user1' OR username = 'user2'")
    return True

@addTest(tests)
def testPostRegister(db):
    
    # Endpoint for user registration
    registration_url = URL + "/register"
    
    # User registration data
    user_data_1 = {
        "username": "user1",
        "password": "password123",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "actorName": "Henry Kolker"
    }
    
    user_data_2 = {
        "username": "user2",
        "password": "password456",
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane.smith@example.com",
        "actorName": "Henry Kolker"
    }
    
    # Sending POST requests
    response1 = requests.post(registration_url, json=user_data_1)
    response2 = requests.post(registration_url, json=user_data_2)
    
    # print(response1.json())
    # print(response2.json())

    
    # Checking if both POST requests were successful
    success1 = response1.status_code == 200  # or another success code based on your API design
    success2 = response2.status_code == 200  # or another success code based on your API design


    #removing password bc it is hashed
    user_data_1 = {
        "username": "user1",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com"
    }
    
    user_data_2 = {
        "username": "user2",
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane.smith@example.com"
    }

    result = db.execute_query("SELECT * FROM users WHERE username = 'user1' OR username = 'user2' ORDER BY  username ASC")
    print(result)


    passed = compare_json_lists_subset([user_data_1, user_data_2], result)
    return success1 and success2 and passed

@addTest(tests)    
def testLoginUsername(db):
    #TODO: Add your test code here

    session = requests.Session()

    login_url = URL + "/login"

    user_data_1 = {
        "username": "user1",
        "password": "password123"
    }

    response1 = session.post(login_url, json=user_data_1)
    token = response1.json().get("token")

    success1 = response1.status_code == 200

    passed = compare_json_lists_subset([{"username": "user1"}], [response1.json()])

    return success1 and passed

@addTest(tests)
def testSearchPosts(db):
    session = requests.Session()

    response = session.get("/searchPosts")

    success = response.status_code == 200

    return success

#CHAT TESTS

@addTest(tests)
def testSetup(db):
    # Initial cleanup to ensure consistent testing environment
    db.execute_query("DELETE FROM messages WHERE message LIKE 'Test message%'")
    db.execute_query("DELETE FROM users WHERE username IN ('user1', 'user2')")
    print("Setup completed.")
    return True

@addTest(tests)
def testPostMessage(db): 
    post_message_url = URL + "/messages/send"
    
    message_details = {
        "sender": "user1",
        "receiver": "user2",
        "message": "Test message from user1 to user2"
    }
    
    response = requests.post(post_message_url, json=message_details)
    success = response.status_code == 201
    return success

@addTest(tests)
def testGetChat(db):
    get_chat_url = f"{URL}/chat?username1=user1&username2=user2"
    
    response = requests.get(get_chat_url)
    success = response.status_code == 200
    
    expected_messages = [{"sender": "user1", "message": "Test message from user1 to user2"}]
    actual_messages = response.json()["messages"]
    passed = compare_json_lists_subset(expected_messages, actual_messages)
    return success and passed

@addTest(tests)
def testChats(db):
    session = requests.Session()

    response = session.get("")

@addTest(tests)    
def testCreatePost(db):
    #TODO: Add your test code here

    session = requests.Session()

    login_url = URL + "/login"
    create_post_url = URL + "/createPost"

    user_data_1 = {
        "username": "user1",
        "password": "password123"
    }

    response1 = session.post(login_url, json=user_data_1)
    print(response1.json())
    user_id = response1.json().get("user_id")
    token = response1.json().get("token")

    post_json = {
        "title": "Test Title",
        "text": "Zachary Ives is the Department Chair and Adani Presidents Distinguished Professor of Computer and Information Science at the University of Pennsylvania. Zacks research interests include data integration and sharing, data provenance and trustworthiness, and machine learning systems.",
        "s3_content_key":"goatedpost.png",
        "userID": user_id,
        "token": token
    }
    post2_json= {
        "title": "Test Title",
        "text": "Goat",
        "s3_content_key":"goatedpost2.jpeg",
        "userID": user_id,
        "token": token
    }

    response_post1 = session.post(create_post_url, json=post_json)
    success = response_post1.status_code == 201

    response_post2 = session.post(create_post_url, json=post2_json)
    success &= response_post2.status_code == 201

    return success

@addTest(tests)
def testCreatePostUploadToS3(db):
    print("testCreatePostUploadToS3")

    session = requests.Session()

    # log in
    login_url = URL + "/login"
    get_s3_upload_url = URL = "/getS3TempPostUrl"
    create_post_url = URL + "/createPost"

    user_data_1 = {
        "username": "user1",
        "password": "password123"
    }

    print("logging in")
    response = session.post(login_url, json=user_data_1)
    print(response.json())
    user_id = response.json().get("user_id")
    token = response.json().get("token")

    # get s3 presigned link
    print("getting s3 Presigned link")
    s3_upload_information = session.post(get_s3_upload_url, json={"userID": user_id, "token": token})
    if (s3_upload_information.status_code != 200):
        return False

    url = s3_upload_information.url
    objectKey = s3_upload_information.objectKey

    print("uploading to s3")
    with open('./data/test_image.png', 'rb') as f:
        response = session.put(url, f.read())
        
    post_json = {
        "title": "Test Title",
        "text": "all content in this post was uploaded programmatically",
        "s3_content_key": objectKey,
        "userID": user_id,
        "token": token
    }


    response_post1 = session.post(create_post_url, json=post_json)
    success = response_post1.status_code == 201


    return success


# stupid-ah test case
# @addTest(tests)
# def testLikeAndUnlike(db):
#     print("testLike")

#     session = requests.Session()

#     # log in
#     login_url = URL + "/login"
#     like_url = URL + "/likePost"
#     unlike_url = URL + "/unlikePost"

#     user_data_1 = {
#         "username": "user1",
#         "password": "password123"
#     }

#     print("logging in")
#     response = session.post(login_url, json=user_data_1)
#     print(response.json())
#     user_id = response.json().get("user_id")
#     token = response.json().get("token")

#     print("getting most recent post_id")
#     recent_post_id = (db.execute_query("SELECT post_id, date FROM posts ORDER BY date DESC LIMIT 1"))[0].post_id

#     print("liking post with id:", recent_post_id)
#     response = session.post(like_url, {"user_id" : user_id, "token": token, "post_id" : recent_post_id})

#     print("verifying like")
#     query_result = db.execute_query("SELECT * FROM likes WHERE user_id = " + user_id + " AND post_id "+ recent_post_id)
#     success = len(query_result) > 0

#     return success





# @addTest(tests)
# def loadActors(db):
#     # load all the actors from the names.csv file
#     # "primaryName","birthYear","deathYear","nconst","nconst_short"

#     with open('../backend/names.csv', 'r', newline='', encoding='utf-8') as csv_file:
#         csv_reader = csv.reader(csv_file, delimiter=',')
#         next(csv_reader)
#         for row in csv_reader:
#             birth_year = int(row[1]) if row[1] != '\\N' else None
#             death_year = int(row[2]) if row[2] != '\\N' else None
#             db.execute_query('''INSERT IGNORE INTO actors (primaryName, birthYear, deathYear, nconst, nconst_short) 
#             VALUES (%s, %s, %s, %s, %s)''', (row[0], birth_year, death_year, row[3], row[4]))
#             print(f"Inserted {row[0], birth_year, death_year, row[3], row[4]}")

#     print("Data loaded.")

#     return True

@addTest(tests)    
def testAddFriend(db):
    #TODO: Add your test code here

    session = requests.Session()

    add_friend_url = URL + "/user1/friends/add"
    
    post_json = {
        "friendName": "user2"
    }

    response = session.post(add_friend_url, json=post_json)
    success = response.status_code == 200

    return success



if __name__ == "__main__":
    try:
        db = MySQLDatabase.get_instance()
        for test in tests:
            runTest(test, db)

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        print()
        db.close()
