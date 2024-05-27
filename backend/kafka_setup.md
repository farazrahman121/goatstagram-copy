# How to set up Kafka
1. Download `nets2120-project.pem` file from [ed](https://edstem.org/us/courses/49842/discussion/4809058) and move it into your nets2120 directory
2. Move the tunnel into the ssh location with `mv nets2120-project.pem ~/.ssh`
3. Reset permissions with `chmod 600 ~/.ssh/nets2120-project.pem`
4. Open terminal in docker container
5. Do `nano /etc/hosts` (you have to do this every time you reopen docker)
6. Add the line `127.0.0.1 ip-172-31-29-52` at the bottom
7. Run the command `ssh -i ~/.ssh/nets2120-project.pem -4 -L 9092:ip-172-31-29-52.ec2.internal:9092 ubuntu@ec2-44-203-65-104.compute-1.amazonaws.com`
8. You may need to go into config.json and change "groupId": "nets-2120-goats" to something else, if we’ve already read everything from the stream
9. `npm install kafkajs` and `npm install kafkajs-snappy`