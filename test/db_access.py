import mysql.connector
from mysql.connector import Error
import json
import os
from dotenv import load_dotenv, find_dotenv

class MySQLDatabase:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls() # calling cls() will call the __init__ method
        return cls._instance

    def __init__(self):
        self.db_connection = None
        self.load_and_process_env()
        self.connect()

    # SETUP FUNCTIONS
    def load_and_process_env(self):
        # Attempt to find the .env file and load it manually with export handling
        env_path = find_dotenv('../backend/.env')
        if env_path:
            with open(env_path, 'r') as file:
                lines = file.readlines()
            for line in lines:
                if line.startswith('export '):
                    key_value_pair = line.strip().replace('export ', '')
                    key, value = key_value_pair.split('=', 1)
                    os.environ[key] = value  # Set the environment variable

    def connect(self):
        try:
            with open('../backend/config.json', 'r') as f:
                config = json.load(f)
                # print("config:", config)

            # print("RDS_USER:", os.getenv('RDS_USER'))
            # print("RDS_PWD:", os.getenv('RDS_PWD'))

            # Extract database configuration from the loaded config
            db_config = config['database']
            db_host = db_config['host']
            db_port = db_config['port']
            db_name = db_config['database']

            # Override user and password from environment variables
            db_user = os.getenv('RDS_USER')
            db_password = os.getenv('RDS_PWD')

            # Establish MySQL connection
            self.db_connection = mysql.connector.connect(
                host=db_host,
                port=db_port,
                database=db_name,
                user=db_user,
                password=db_password
            )

            print("Connected to the MySQL server.\n")
            
        except Error as e:
            print(f"Error connecting to MySQL: {e}")

    # USAGE FUNCTIONS
    def execute_query(self, query, params=None):
        try:
            cursor = self.db_connection.cursor(dictionary=True)
            cursor.execute(query, params or ())
            if query.lower().startswith('select'):
                result = cursor.fetchall()
            else:
                self.db_connection.commit()
                result = cursor.rowcount
            cursor.close()
            return result
        except Error as e:
            print(f"Error executing query: {e}")
            return None

    def create_tables(self, query):
        return self.execute_query(query)

    def insert_items(self, query, params):
        return self.execute_query(query, params)

    def close(self):
        if self.db_connection.is_connected():
            self.db_connection.close()
            print("Database connection closed.")
