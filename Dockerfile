# Use the official Ubuntu base image
FROM ubuntu:latest

# Set the maintainer label
LABEL maintainer="goats"

# Install necessary packages
RUN apt-get update

# Install Java packages
RUN apt-get install -y \
    software-properties-common \
    openjdk-11-jdk \ 
    maven

# Install Python3 packages
RUN apt-get install -y \
    python3 \
    python3-pip \
    python3-venv

# Install Node.js
RUN apt-get install -y \
    nodejs \
    npm

# UNCOMMENT THESE IF YOU WANT TO DEVELOP LOCALLY
RUN apt-get install -y \
    wget \
    curl \
    tar \
    unzip \
    mysql-server \
    mysql-client \
    lsof

# Cleanup the apt cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Set Python3 as the default python
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 1

# Create Python Virtual Environment
RUN python3 -m venv /ve

# Install pip packages
RUN ./ve/bin/pip install --upgrade pip 
RUN ./ve/bin/pip install pyspark 
RUN ./ve/bin/pip install numpy mysql-connector-python requests python-dotenv chromadb

# MySQL Connector for Java that PySpark will use
RUN wget https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.28/mysql-connector-java-8.0.28.jar -P /usr/local/share/java/


# Define the environment variable for Java
ENV JAVA_HOME /usr/lib/jvm/java-11-openjdk-amd64


# NOTE FOR DEPLOYMENT WE WILL NEED TO COPY FILES OVER AND NPM INSTALL BUT
# FOR NOW WE WILL JUST MOUNT A VOLUME TO DEVELOP LOCALLY

WORKDIR /data
# Start a bash shell so the container doesn't exit immediately
CMD ["bash"]