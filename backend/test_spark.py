from pyspark.sql import SparkSession

def main():
    # Initialize Spark Session
    spark = SparkSession.builder \
        .appName("MySQL Integration") \
        .config("spark.jars", "/usr/local/share/java/mysql-connector-java-8.0.28.jar") \
        .getOrCreate()

    # JDBC connection properties
    jdbc_url = "jdbc:mysql://localhost:3306/goatdb"
    connection_properties = {
        "user": "admin",
        "password": "rds-password",
        "driver": "com.mysql.cj.jdbc.Driver"
    }

    # Load data using JDBC
    df = spark.read.jdbc(url=jdbc_url, table="users", properties=connection_properties)

    # Show the results
    df.show()

    # Stop the Spark session
    spark.stop()

if __name__ == "__main__":
    main()
