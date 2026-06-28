import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Base directory
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Folder Settings
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
DATA_FOLDER = os.path.join(BASE_DIR, 'data')

# Create necessary folders if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

# Application Settings
PORT = int(os.getenv('PORT', 5000))
DEBUG = os.getenv('FLASK_ENV', 'development') == 'development'

# Groq API Configuration
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_ENABLED = bool(GROQ_API_KEY)

# Firebase Configuration
# Can be configured via credentials file path or separate env variables
FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH')
FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID')

# Check if Firebase credentials exist
FIREBASE_ENABLED = False
if FIREBASE_CREDENTIALS_PATH and os.path.exists(FIREBASE_CREDENTIALS_PATH):
    FIREBASE_ENABLED = True
elif os.getenv('FIREBASE_CLIENT_EMAIL') and os.getenv('FIREBASE_PRIVATE_KEY'):
    FIREBASE_ENABLED = True

print("=== STUDYAI BACKEND CONFIGURATION ===")
print(f"Groq AI Enabled: {GROQ_ENABLED}")
print(f"Firebase Cloud Storage/Db Enabled: {FIREBASE_ENABLED}")
if not FIREBASE_ENABLED:
    print("WARNING: Running in LOCAL FALLBACK MODE for database and storage.")
if not GROQ_ENABLED:
    print("WARNING: Running in MOCK AI MODE. Provide GROQ_API_KEY to enable Llama 3.3.")
print("=====================================")
