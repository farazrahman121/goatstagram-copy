from db_access import MySQLDatabase
from helpers import compare_json_lists_subset
from helpers import runTest
from helpers import addTest
#from reset_tables import resetTables
import requests
import time

import csv


# SEE BELOW FOR EXAMPLE TEST CASES, MAKE 
# SURE TO ADD TEST CASE tests LIST USING
# @addTest(tests) DECORATOR
tests = []
URL = "http://localhost:8080"

token = None # global variable to store token 

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
    db.execute_query("DELETE FROM users WHERE username = 'user1' OR username = 'user2' OR username = 'user3' OR username = 'user4'")
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
    user_data_3 = {
        "username": "user3",
        "password": "password456",
        "first_name": "Joe",
        "last_name": "Shmoe",
        "email": "ignore@example.com",
        "actorName": "Henry Kolker"
    }
    user_data_4 = {
        "username": "user4",
        "password": "password456",
        "first_name": "Ibrahim Abu Bakar Umar Ali-Amaan Ikram Saad Saeedi",
        "last_name": "Smith",
        "email": "ignore2@example.com",
        "actorName": "Henry Kolker"
    }
    
    # Sending POST requests
    response1 = requests.post(registration_url, json=user_data_1)
    response2 = requests.post(registration_url, json=user_data_2)
    response3 = requests.post(registration_url, json=user_data_3)
    response4 = requests.post(registration_url, json=user_data_4)
    print(response4.json())

    # Checking if both POST requests were successful
    success = response1.status_code == 200  # or another success code based on your API design
    success &= response2.status_code == 200  # or another success code based on your API design
    success &= response3.status_code == 200
    success &= response4.status_code == 200


    #removing password bc it is hashed
    user_data_1 = {
        "username": "user1",
        "first_name": "John",
    }
    user_data_2 = {
        "username": "user2",
        "first_name": "Jane",
    }
    user_data_3 = {
        "username": "user3",
        "first_name": "Joe",
    }
    user_data_4 = {
        "username": "user4",
        "first_name": "Ibrahim Abu Bakar Umar Ali-Amaan Ikram Saad Saeedi",
    }
    result = db.execute_query("SELECT * FROM users WHERE username = 'user1' OR username = 'user2' OR username = 'user3' OR username = 'user4' ORDER BY  username ASC")
    # print(result)
    print(len(result))

    passed = compare_json_lists_subset([user_data_1, user_data_2, user_data_3, user_data_4], result)
    return success and passed

@addTest(tests)    
def testAddFriend(db):
    session = requests.Session()

    # recall that these are bidirectional relationships so we only need to add one direction
    friends_to_add = [["user1", "user3"], ["user1", "user2"], ["user2", "user4"]]

    success = True
    for friend_pair in friends_to_add:
        add_friend_url = URL + "/"+ friend_pair[0]+ "/friends/add"
        post_json = {
            "friendName": friend_pair[1]
        }
        response = session.post(add_friend_url, json=post_json)
        success &= response.status_code == 200

    return success

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
    user_data_2 = {
        "username": "user2",
        "password": "password456"
    }

    response1 = session.post(login_url, json=user_data_1)
    user1_id = response1.json().get("user_id")
    user1_token = response1.json().get("token")

    response2= session.post(login_url, json=user_data_2)
    user2_id = response2.json().get("user_id")
    user2_token = response2.json().get("token")
    

    post_json = {
        "title": "Test Title",
        "text": "Zachary Ives is the #goat and Department Chair and Adani President's Distinguished Professor of Computer and Information Science at the University of Pennsylvania. Zack's research interests include data integration and sharing, data provenance and trustworthiness, and machine learning systems. He is a recipient of the NSF CAREER award, and an alumnus of the DARPA Computer Science Study Panel and Information Science and Technology advisory panel.  He has also been awarded the Christian R. and Mary F. Lindback Foundation Award for Distinguished Teaching and an IEEE Technical Committee on Data Engineering Education Award, and he is a Fellow of the ACM.",
        "s3_content_key":"goatedpost.png",
        "userID": user1_id,
        "token": user1_token
    }
    post2_json= {
        "title": "Test Title",
        "text": "#goat",
        "s3_content_key":"goatedpost2.jpeg",
        "userID": user2_id,
        "token": user2_token
    }

    response_post1 = session.post(create_post_url, json=post_json)
    success = response_post1.status_code == 201

    response_post2 = session.post(create_post_url, json=post2_json)
    success &= response_post2.status_code == 201
    return success

@addTest(tests)
def testLikePost(db):
    session = requests.Session()
    # time.sleep(1)
    # login as user 2
    success = True
    user_data_2 = {
        "username": "user2",
        "password": "password456"
    }

    login_url = URL + "/login"
    response_login = session.post(login_url, json=user_data_2)
    user_id = response_login.json().get("user_id")
    token = response_login.json().get("token")
    print("logged in as user 2")

    # Get the postID from user 
    # result = db.execute_query("SELECT * FROM users")
    # print(result)
    post_id = 1


    like_post_url = URL + "/likePost"
    post_json = {
        "postID": post_id,
        "userID": user_id,
        "token": token
    }
    response = session.post(like_post_url, json=post_json)
    print(response.json())
    success &= response.status_code == 200 or response.status_code == 201

    return success

@addTest(tests)
def testAddHashtag(db):
    session = requests.Session()
    success = True
    user_data_1 = {
        "username": "user4",
        "password": "password456"
    }

    login_url = URL + "/login"
    response_login = session.post(login_url, json=user_data_1)
    user_id = response_login.json().get("user_id")
    token = response_login.json().get("token")
    print("logged in as user 4")

    add_hashtag_url = URL + "/postUserHashtag"
    post_json = {
        "hashtagList": ["goat"],
        "userID": user_id,
    }
    response = session.post(add_hashtag_url, json=post_json)
    print(response.json())
    success &= response.status_code == 200 or response.status_code == 201

    return success

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
