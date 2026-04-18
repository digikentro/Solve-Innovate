import sys
import os

# Add the fastapi directory to path
sys.path.append(r'c:\digikentro\solve-innovate\fastapi')

from api.main import app

print("\n--- Registered Routes (Manual Check) ---")
for route in app.routes:
    if hasattr(route, 'path'):
        methods = getattr(route, 'methods', 'No Methods')
        print(f"{methods} {route.path}")
print("--- End of Routes ---")
