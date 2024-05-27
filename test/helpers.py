import sys
import subprocess
import signal

# TESTING HELPERS

def addTest(tests):
    """
    Decorator function to add a test function to a list of tests.
    """
    def decorator(func):
        tests.append(func)
        return func
    return decorator

def compare_json_lists_subset(actual, expected):

    """
    The compare_json_lists function compares two lists of dictionaries, 
    ensuring that each dictionary in the actual list contains all key-value
    pairs present in the corresponding dictionary in the expected list, 
    and reports detailed discrepancies.
    """

    # Check if both inputs are lists
    if not isinstance(actual, list) or not isinstance(expected, list):
        raise ValueError("Both inputs must be lists.")

    # Check if all elements in the lists are dictionaries
    if not all(isinstance(item, dict) for item in actual) or not all(isinstance(item, dict) for item in expected):
        raise ValueError("All elements in both lists must be dictionaries.")

    # Check if the lengths of the lists are the same
    if len(actual) != len(expected):
        raise ValueError("The lists must be of the same length.")

    # Compare each dictionary pair from both lists
    all_matched = True
    for i, (actual_dict, expected_dict) in enumerate(zip(actual, expected)):
        for key, value in actual_dict.items():
            if key not in expected_dict:
                print(f"Missing key '{key}' in expected JSON at index {i}.")
                all_matched = False
            elif expected_dict[key] != value:
                print(f"Mismatched value for key '{key}' at index {i}: actual '{value}', found '{expected_dict[key]}'.")
                all_matched = False

    return all_matched

def runTest(test, db):
    """
    Print the placeholder for the result of a test function before running,
    then update with the actual result after the test is executed.
    """
    # Print the placeholder
    sys.stdout.write(f"[------], {test.__name__}\r")
    sys.stdout.flush()  # Ensure it gets printed before running the test
    
    # Execute the test
    result = test(db)
    
    # Overwrite the previous output with the final result
    if result:
        print("\033[32m[PASSED]\033[0m", f"{test.__name__}")
    else:
        print("\033[31m[FAILED]\033[0m", f"{test.__name__}")



# lol

# # SERVER CONTROL
# def start_server():
#     # Define the directory where the server script is located relative to the Python script
#     backend_directory = '../backend'
    
#     # Start the server using subprocess.Popen
#     # Popen allows the Python script to continue running while the server is active
#     process = subprocess.Popen(['npm', 'start'], cwd=backend_directory, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
#     print("Server started in backend directory...")
#     return process

# def stop_server(process):
#     # Send SIGINT, equivalent to Ctrl+C
#     process.send_signal(signal.SIGINT)
#     process.wait()  # Wait for process to terminate
#     print("Server stopped.")

# def start_frontend():
#     # Define the directory where the server script is located relative to the Python script
#     frontend_directory = '../frontend'
    
#     # Start the server using subprocess.Popen
#     # Popen allows the Python script to continue running while the server is active
#     process = subprocess.Popen(['npm', 'run dev'], cwd=frontend_directory, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
#     print("Frontend started in frontend directory...")
#     return process

# def stop_frontend(process):
#     # Send SIGINT, equivalent to Ctrl+C
#     process.send_signal(signal.SIGINT)
#     process.wait()  # Wait for process to terminate
#     print("Frontend stopped.")