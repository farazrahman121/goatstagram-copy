import subprocess
import sys

def install_packages():
    # Function to install required Python packages
    try:
        import mysql.connector
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "mysql-connector-python"])

def start_mysql(port):
    # Command to start MySQL on a specific port
    command = f'mysqld_safe --port={port}'

    try:
        # Start MySQL server
        print(f"Starting MySQL server on port {port}...")
        subprocess.run(command, check=True, shell=True)
        print("MySQL server started successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Failed to start MySQL server: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    # install_packages()  # Ensure all packages are installed
    port = 3306         # Set port to 8080 or customize as needed
    start_mysql(port)
