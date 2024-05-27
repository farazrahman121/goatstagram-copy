Here are some instructions on how to setup a local mysql instance so we don't have to tunnel to the AWS db every time.

1. install mysql on the docker container using ```apt-get update``` and ```apt-get install -y mysql-server```
2. Run ```mysql_secure_installation``` and setup a root user (just make security as lax as possible since this is just for testing)
3. Use ```service mysql start``` to start the MySQL server (by default it will run on port 3306)

4. Once the server is running you can use the default user: root with password:(empty) to log in. The command to do this is ```mysql -u root -p``` and leave the password empty when it asks for one
5. Once we are logged into MySQL we can use ```CREATE DATABASE goatdb;``` to emulate our AWS RDS instance.
6. You should also run the following commands so we can log in using the same credentials that we use for the AWS RDS instnance
   
    ```CREATE USER 'admin'@'localhost' IDENTIFIED BY 'rds-password';```
   
    ```GRANT ALL PRIVILEGES ON goatdb.* TO 'admin'@'localhost';```
   
     ```FLUSH PRIVILEGES;```

7. From this point most things should be working, but you might need to relog into the terminal. Which you can do using the familiar ```mysql --host=localhost --port=3306 --user=admin --password=rds-password``` command. Note that the host and port options are redundant but can be used as a reality check to make sure everything is running in the right place.
8. Once in the mysql console you can use ```mysqladmin -u root -p shutdown``` to shut the server down (you should do this before attempting to connect to actual AWS RDS, as otherwise there might be issues with applications competeing for ports)
