from flask import Flask, request, jsonify, send_from_directory
import subprocess
import os

app = Flask(__name__, static_folder=None) # Disable default static folder

@app.route('/api/qualifying')
def get_qualifying_api():
    date = request.args.get('date') # This will be None if not provided

    try:
        # Ensure the command uses the python3 in the virtual environment if applicable
        # Adjust path to get_quali_results.py if it's not in the same directory as server.py
        python_executable = ".venv/bin/python3" if os.path.exists(".venv/bin/python3") else "python3"
        script_path = "get_quali_results.py"
        
        # Construct the command to run the script
        command = [python_executable, script_path]

        # Add date if provided, otherwise the script runs its default 'latest' logic
        if date:
            command.extend(["--date", date])

        # Check for p15 flag and add it to the command
        if request.args.get('p15') == 'true':
            command.extend(["--p15"])

        process = subprocess.run(
            command, # Use the constructed command
            capture_output=True, text=True, check=False, # check=False to handle errors manually
            cwd=os.path.dirname(os.path.abspath(__file__)) # Run script from its directory
        )

        if process.returncode == 0:
            # The script now prints JSON directly, so just return it
            return process.stdout, 200, {'Content-Type': 'application/json'}
        else:
            print(f"Error running script: {process.stderr}")
            return jsonify({"error": "Failed to get qualifying results from script", "details": process.stderr}), 500
    except Exception as e:
        print(f"Exception in API route: {str(e)}")
        return jsonify({"error": "Server error processing request", "details": str(e)}), 500

# Route to serve static files (HTML, JS, CSS) from the current directory
@app.route('/<path:filename>')
def serve_static(filename):
    # Ensure we don't try to serve directories or special files if not intended
    if filename.endswith('/') or filename == 'server.py' or filename.startswith('.'):
        return jsonify({"error": "Access forbidden"}), 403
    return send_from_directory('.', filename)

@app.route('/')
def serve_index():
    # By default, serve index.html
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    # Make sure to activate your virtual environment that has flask, requests, pandas
    # e.g., source .venv/bin/activate
    # Then run: python3 server.py
    print("Starting Flask server on http://localhost:8000")
    print("Ensure virtual environment is active if packages like flask are installed there.")
    print(f"Serving static files from: {os.getcwd()}")
    app.run(debug=True, port=8000) 