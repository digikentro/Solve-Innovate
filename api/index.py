import sys
import os

# Add the fastapi directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "fastapi"))

from api.main import app
