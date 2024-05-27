the following pip installs should be run WITHIN your Docker container

```pip install mysql-connector-python```

```pip install requests```

```pip install python-dotenv```

```pip install boto3``` for s3

Each test script (python files starting with test) should be formatted as a series of custom function defs followed by a script that runs all of the tests under statement

``` if __name__ == "__main__":```


Tests can be run using the command ```python3 test_[name].py```


To use run_pysql.py as a local MySQL db run
```apt install mysql-server```