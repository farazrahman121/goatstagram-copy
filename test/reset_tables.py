from db_access import MySQLDatabase
import subprocess



if __name__ == "__main__":
    # Get the singleton instance of MySQLDatabase
    db = MySQLDatabase.get_instance()

    try:
        # Do NOT drop the actors table

        # Execute the drop table queries
        db.execute_query("SET FOREIGN_KEY_CHECKS = 0;")
        db.execute_query("DROP TABLE IF EXISTS users")
        db.execute_query("DROP TABLE IF EXISTS posts")
        db.execute_query("DROP TABLE IF EXISTS likes")
        db.execute_query("DROP TABLE IF EXISTS comments")
        db.execute_query("DROP TABLE IF EXISTS friends")
        db.execute_query("DROP TABLE IF EXISTS recommendations")
        db.execute_query("DROP TABLE IF EXISTS user_hashtags")
        db.execute_query("DROP TABLE IF EXISTS post_hashtags")
        db.execute_query("DROP TABLE IF EXISTS messages")
        # db.execute_query("DROP TABLE IF EXISTS actors")
        db.execute_query("DROP TABLE IF EXISTS face_match")
        db.execute_query("SET FOREIGN_KEY_CHECKS = 1;")
        print("Tables dropped successfully.\n")


        # Run the npm script to create the tables
        print("Creating tables...")
        command = "cd ../backend && npm run create_tables"

        # Execute the command
        result = subprocess.run(command, shell=True, text=True, capture_output=True)

        # Check if the command was successful
        if result.returncode == 0:
            print("Tables created sucessfully!\n")
            print("npm output:\n", result.stdout)
        else:
            print("create_tables failed!")
            print("Error:\n", result.stderr)


    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        print()
        db.close()
