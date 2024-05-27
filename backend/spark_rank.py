from pyspark.sql import SparkSession # type: ignore
from pyspark.sql.functions import concat, col, lit, when, array # type: ignore
from pyspark.sql import functions as F # type: ignore
from pyspark.sql import Window # type: ignore 
from pyspark.sql.functions import col # type: ignore
from pyspark.sql.functions import udf   # type: ignore
from pyspark.sql.types import ArrayType, DoubleType # type: ignore
from pyspark.sql.functions import explode, collect_list # type: ignore
from pyspark.sql.functions import expr # type: ignore



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

    # Load "edges" data using JDBC
    user_hashtags = spark.read.jdbc(url=jdbc_url, table="user_hashtags", properties=connection_properties)
    post_hashtags = spark.read.jdbc(url=jdbc_url, table="post_hashtags", properties=connection_properties)
    likes = spark.read.jdbc(url=jdbc_url, table="likes", properties=connection_properties)
    friends = spark.read.jdbc(url=jdbc_url, table="friends", properties=connection_properties)

    # Load "nodes" data using JDBC
    users = spark.read.jdbc(url=jdbc_url, table="users", properties=connection_properties)
    posts = spark.read.jdbc(url=jdbc_url, table="posts", properties=connection_properties)
    hashtags = user_hashtags.union(post_hashtags).select("hashtag").distinct()


    # Setting a common format for edges
    user_hashtags_transformed = user_hashtags.select(
        lit('user').alias('type1'), 
        user_hashtags['user_id'].alias('node1'),
        lit('hashtag').alias('type2'),
        user_hashtags['hashtag'].alias('node2')
    )
    post_hashtags_transformed = post_hashtags.select(
        lit('post').alias('type1'), 
        post_hashtags['post_id'].alias('node1'),
        lit('hashtag').alias('type2'),
        post_hashtags['hashtag'].alias('node2')
    )
    likes_transformed = likes.select(
        lit('user').alias('type1'), 
        likes['user_id'].alias('node1'),
        lit('post').alias('type2'),
        likes['post_id'].alias('node2')
    )
    friends_transformed = friends.select(
        lit('user').alias('type1'), 
        friends['follower'].alias('node1'),
        lit('user').alias('type2'),
        friends['followed'].alias('node2')
    )

    edges = user_hashtags_transformed.union(post_hashtags_transformed)\
                                            .union(likes_transformed)\
                                            .union(friends_transformed)
    
    # making edges bidrectional
    reversed_edges = edges.select(
        edges['type2'].alias('type1'),
        edges['node2'].alias('node1'),
        edges['type1'].alias('type2'),
        edges['node1'].alias('node2')
    )

    edges = edges.union(reversed_edges).distinct()

    # Setting a common format for nodes
    user_nodes = users.select(users.user_id.alias("id")).withColumn("type", lit("user"))
    post_nodes = posts.select(posts.post_id.alias("id")).withColumn("type", lit("post"))
    hashtag_nodes = hashtags.select(hashtags.hashtag.alias("id")).withColumn("type", lit("hashtag"))
    
    nodes = user_nodes.union(post_nodes).union(hashtag_nodes)


    # Show the data
    # print("nodes")
    # nodes.show()
    # print("edges")
    # edges.show()

    # Count neighbors modulo the type of neighbor
    edge_counts = edges.groupBy("type1", "node1", "type2").count()
    window_spec = Window.partitionBy("type1", "node1")
    total_edges = edge_counts.withColumn("total_count", F.sum("count").over(window_spec))
    print("edges with counts")
    # total_edges.show()

    # Weight edges based on the type of neighbor
    def calculate_weight(type1, type2, count, total_count):
        if type1 == "hashtag" and type2 == "user":
            return 1 / total_count
        elif type1 == "hashtag" and type2 == "post":
            return 1 / total_count
        elif type1 == "user":
            if type2 == "hashtag":
                return 0.3 / total_count
            elif type2 == "post":
                return 0.4 / total_count
            elif type2 == "user":
                return 0.3 / total_count
        elif type1 == "post":
            return 1 / total_count

    print("edges with weights based on types") 
    edge_weights = total_edges.withColumn("weight", F.udf(calculate_weight)("type1", "type2", "count", "total_count"))
    # edge_weights.show()

    weighted_edges = edge_weights.alias("ew").join(
        edges.alias("e"),
            (col("ew.type1") == col("e.type1")) &
            (col("ew.node1") == col("e.node1")) &
            (col("ew.type2") == col("e.type2")),
            "left"
        ).select(
            col("ew.type1"),
            col("ew.node1"),
            col("ew.type2"),
            col("e.node2"),  # Now clearly referencing the node2 from edges
            col("ew.weight")
        )
    

    weighted_edges = weighted_edges.withColumn("src", concat(col("type1"), lit("_"), col("node1")))
    weighted_edges = weighted_edges.withColumn("dst", concat(col("type2"), lit("_"), col("node2")))


    nodes = weighted_edges.select(col("src").alias("node")).distinct().orderBy("node")

    print("weighted_edges")
    weighted_edges.show()
    print("labeled nodes")
    # nodes.show()

    # Collect all unique nodes
    node_list = nodes.rdd.map(lambda r: r.node).collect()

    # Function to initialize probabilities
    def initial_probs(node_id):
        return [1.0 if node == node_id else 0.0 for node in node_list]

    initialize_probs_udf = udf(initial_probs, ArrayType(DoubleType()))

    # Add initial probabilities to nodes DataFrame
    nodes_distributions = nodes.withColumn("probabilities", initialize_probs_udf("node"))

    print("labeled nodes with initial probabilities")
    # nodes_distributions.show()



    # ITERATIVE ALGORITHM TO UPDATE PROBABILITIES

    def update_probabilities(nodes, edges, iterations = 3):
        for i in range(iterations):
            
            recieved_by_edge = edges.join(nodes, edges.src == nodes.node, "inner")
            # print("recieved")
            # recieved_by_edge.show(truncate=False)       

            recieved_by_edge_weighted = recieved_by_edge.withColumn(
                "weighted_probability",
                expr("transform(probabilities, x -> x * weight)")
            )
            # print("recieved_by_edge_weighted")
            # recieved_by_edge_weighted.show(truncate=False)


            grouped_probabilities = recieved_by_edge_weighted.groupBy("dst").agg(
                F.collect_list("weighted_probability").alias("collected_probabilities")
            )

            # print("grouped_probabilities")
            # grouped_probabilities.show(truncate=False)

            # Define a UDF for element-wise summing of arrays
            def sum_arrays(arrays):
                # Transpose the array list to sum each position across arrays
                return [sum(values) for values in zip(*arrays)]

            sum_arrays_udf = F.udf(sum_arrays, ArrayType(DoubleType()))

            # Apply the UDF to sum the probabilities
            final_probabilities = grouped_probabilities.withColumn(
                "summed_probabilities",
                sum_arrays_udf("collected_probabilities")
            ).select(
                "dst",
                "summed_probabilities"
            )

            final_probabilities_normalized = final_probabilities.withColumn(
                "probabilities_normalized",
                F.expr("""
                    transform(
                        summed_probabilities, 
                        x -> (x) / aggregate(
                            summed_probabilities, 
                            cast(0.00001 as double), 
                            (acc, y) -> acc + cast(y as double)
                        )
                    )
                """)
            ).select(
                "dst",
                "probabilities_normalized"
            )

            nodes = final_probabilities_normalized.withColumnRenamed("dst", "node").withColumnRenamed("probabilities_normalized", "probabilities")
            print("iteration", i)
            # nodes.show(truncate=False)



        return nodes

    # Example call to the function
    final_distributions = update_probabilities(nodes_distributions, weighted_edges).orderBy("node")
    final_distributions.show(truncate=False)

    df = final_distributions

    # Extract nodes and create an index for each unique node
    node_indices = df.select("node").distinct().rdd.map(lambda r: r.node).zipWithIndex().toDF(["node", "index"])

    # Join this back to the original DataFrame to get indices for each node's 'probabilities' field
    df_with_indices = df.join(node_indices, on="node").orderBy("node")

    df_with_indices.show(truncate=False)

    exploded_df = df_with_indices.select(
        "node", 
        F.posexplode("probabilities").alias("target_index", "weight")
    )     

    # exploded_df.show(truncate=False)  

    adjacency_list = exploded_df.join(
        node_indices.withColumnRenamed("node", "target_node").withColumnRenamed("index", "target_index"),
        on="target_index"
    ).select(
        F.col("node").alias("source_node"),
        F.col("target_node"),
        "weight"
    )

    # adjacency_list.show(truncate=False)

    weighted_adjacency_list = adjacency_list.filter(F.col("weight") > 0)

    final_result = weighted_adjacency_list.withColumn("source_type", F.split(col("source_node"), "_")[0]).withColumn("source_id", F.split(col("source_node"), "_")[1])
    final_result = final_result.withColumn("target_type", F.split(col("target_node"), "_")[0]).withColumn("target_id", F.split(col("target_node"), "_")[1])
    final_result = final_result.select("source_type", "source_id", "target_type", "target_id", "weight")

    final_result.show()


    # Write the result to MySQL
    final_result.write.jdbc(url=jdbc_url, table="recommendations", mode="overwrite", properties=connection_properties)








if __name__ == "__main__":
    main()

