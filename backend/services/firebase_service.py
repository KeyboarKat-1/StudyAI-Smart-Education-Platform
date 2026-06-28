import os
import json
import uuid
from datetime import datetime, date, timedelta
from backend import config

db = None
auth = None

if config.FIREBASE_ENABLED:
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore, auth as firebase_auth
        
        # Check if already initialized to avoid exception
        if not firebase_admin._apps:
            if config.FIREBASE_CREDENTIALS_PATH and os.path.exists(config.FIREBASE_CREDENTIALS_PATH):
                cred = credentials.Certificate(config.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred)
            else:
                # Initialize from environment variables
                client_email = os.getenv('FIREBASE_CLIENT_EMAIL')
                private_key = os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n')
                project_id = os.getenv('FIREBASE_PROJECT_ID')
                
                cred = credentials.Certificate({
                    "type": "service_account",
                    "project_id": project_id,
                    "private_key": private_key,
                    "client_email": client_email,
                    "token_uri": "https://oauth2.googleapis.com/token"
                })
                firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        auth = firebase_auth
        print("Firebase Admin SDK successfully initialized.")
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {e}. Falling back to LOCAL JSON storage.")
        config.FIREBASE_ENABLED = False

# --- Local Fallback Storage Helpers ---
def _read_local_json(filename):
    file_path = os.path.join(config.DATA_FOLDER, filename)
    if not os.path.exists(file_path):
        return {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading local file {filename}: {e}")
        return {}

def _write_local_json(filename, data):
    file_path = os.path.join(config.DATA_FOLDER, filename)
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error writing to local file {filename}: {e}")
        return False

# --- Database Service API ---

def verify_token(token):
    """Verifies Firebase token or falls back to accepting local mock token."""
    if not token:
        return None
        
    if config.FIREBASE_ENABLED:
        try:
            # Firebase token verification
            decoded_token = auth.verify_id_token(token)
            return {
                "uid": decoded_token["uid"],
                "email": decoded_token.get("email"),
                "name": decoded_token.get("name", "")
            }
        except Exception as e:
            print(f"Firebase token verification failed: {e}")
            return None
    else:
        # Local Mock Token Verification
        # In mock mode, the client passes "mock-uid:<email>" as the token
        if token.startswith("mock-uid:"):
            email = token.split(":", 1)[1]
            # Create a deterministic UID based on email for persistence
            uid = f"local-user-{hash(email) & 0xffffffff}"
            return {
                "uid": uid,
                "email": email,
                "name": email.split("@")[0].capitalize()
            }
        return None

def save_study_material(user_id, material_data):
    """Saves study material metadata and text context."""
    material_id = material_data.get('id') or str(uuid.uuid4())
    material_data['id'] = material_id
    material_data['userId'] = user_id
    # Use timezone-aware datetimes (or standard ISO format)
    if 'createdAt' not in material_data:
        material_data['createdAt'] = datetime.now().isoformat()
    
    if config.FIREBASE_ENABLED:
        try:
            db.collection('materials').document(material_id).set(material_data)
            return material_data
        except Exception as e:
            print(f"Firestore save failed: {e}. Falling back to local write.")
    
    # Local JSON save fallback
    materials = _read_local_json('materials.json')
    materials[material_id] = material_data
    _write_local_json('materials.json', materials)
    return material_data

def get_study_materials(user_id):
    """Retrieves all materials belonging to the user."""
    if config.FIREBASE_ENABLED:
        try:
            docs = db.collection('materials').where('userId', '==', user_id).stream()
            results = []
            for doc in docs:
                results.append(doc.to_dict())
            # Sort by createdAt descending
            results.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
            return results
        except Exception as e:
            print(f"Firestore retrieve failed: {e}. Falling back to local read.")
            
    # Local JSON fallback
    materials = _read_local_json('materials.json')
    user_materials = [m for m in materials.values() if m.get('userId') == user_id]
    user_materials.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
    return user_materials

def get_study_material(user_id, material_id):
    """Retrieves a single study material."""
    if config.FIREBASE_ENABLED:
        try:
            doc = db.collection('materials').document(material_id).get()
            if doc.exists:
                data = doc.to_dict()
                if data.get('userId') == user_id:
                    return data
            return None
        except Exception as e:
            print(f"Firestore get failed: {e}. Falling back to local read.")
            
    # Local JSON fallback
    materials = _read_local_json('materials.json')
    material = materials.get(material_id)
    if material and material.get('userId') == user_id:
        return material
    return None

def delete_study_material(user_id, material_id):
    """Deletes a study material."""
    if config.FIREBASE_ENABLED:
        try:
            doc_ref = db.collection('materials').document(material_id)
            doc = doc_ref.get()
            if doc.exists and doc.to_dict().get('userId') == user_id:
                doc_ref.delete()
                return True
            return False
        except Exception as e:
            print(f"Firestore delete failed: {e}. Falling back to local delete.")
            
    # Local JSON fallback
    materials = _read_local_json('materials.json')
    if material_id in materials and materials[material_id].get('userId') == user_id:
        del materials[material_id]
        _write_local_json('materials.json', materials)
        return True
    return False

def update_study_material_generation(user_id, material_id, gen_type, content):
    """Caches AI generated summaries, quizzes, or flashcards on the study material."""
    # gen_type should be: 'summary', 'flashcards', or 'quiz'
    valid_types = ['summary', 'flashcards', 'quiz', 'tf_quiz', 'sa_quiz', 'schedule', 'weak_topics']
    
    material = get_study_material(user_id, material_id)
    if not material:
        return False
        
    # Initialize generations dictionary if not present
    if 'generations' not in material:
        material['generations'] = {}
        
    material['generations'][gen_type] = content
    material['updatedAt'] = datetime.now().isoformat()
    
    save_study_material(user_id, material)
    return True

# --- NEW: Quiz Records & Performance Stats ---

def save_quiz_record(user_id, record):
    """Saves a quiz score record to history."""
    record_id = str(uuid.uuid4())
    record['id'] = record_id
    record['userId'] = user_id
    if 'timestamp' not in record:
        record['timestamp'] = datetime.now().isoformat()
        
    if config.FIREBASE_ENABLED:
        try:
            db.collection('quiz_history').document(record_id).set(record)
        except Exception as e:
            print(f"Firestore quiz record save failed: {e}. Falling back to local.")
            
    # Local JSON fallback
    history = _read_local_json('quiz_history.json')
    history[record_id] = record
    _write_local_json('quiz_history.json', history)
    
    # Also log this as an activity
    score_percentage = round((record['score'] / record['totalQuestions']) * 100) if record['totalQuestions'] > 0 else 0
    activity_msg = f"Completed a {record.get('quizType', 'quiz').upper()} quiz on '{record.get('materialName', 'document')}' scoring {score_percentage}%"
    log_user_activity(user_id, activity_msg)
    
    return record

def get_quiz_history(user_id):
    """Retrieves quiz history logs."""
    if config.FIREBASE_ENABLED:
        try:
            docs = db.collection('quiz_history').where('userId', '==', user_id).stream()
            results = []
            for doc in docs:
                results.append(doc.to_dict())
            results.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            return results
        except Exception as e:
            print(f"Firestore quiz history retrieve failed: {e}. Falling back to local.")
            
    # Local JSON fallback
    history = _read_local_json('quiz_history.json')
    user_history = [r for r in history.values() if r.get('userId') == user_id]
    user_history.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    return user_history

# --- NEW: Streaks & User activity tracking ---

def log_user_activity(user_id, action_description):
    """Logs user study actions and manages streak count calculation."""
    timestamp = datetime.now()
    today_str = timestamp.date().isoformat()
    
    # Fetch current user profile details
    user_profile = _get_or_create_user_profile(user_id)
    
    # Check streak update rules
    last_study_date_str = user_profile.get('lastStudyDate')
    streak = user_profile.get('streakCount', 0)
    
    if last_study_date_str:
        last_date = date.fromisoformat(last_study_date_str)
        today = timestamp.date()
        delta = today - last_date
        
        if delta.days == 1:
            # Incremented streak (studied consecutive day)
            streak += 1
        elif delta.days > 1:
            # Reset streak (missed days)
            streak = 1
        # If delta.days == 0: studied today, keep current streak count
    else:
        # First study activity
        streak = 1
        
    user_profile['streakCount'] = streak
    user_profile['lastStudyDate'] = today_str
    
    # Add activity logs (cap list at 15 items for database size bounds)
    activity_log = user_profile.get('activityLog', [])
    activity_log.insert(0, {
        "id": str(uuid.uuid4()),
        "description": action_description,
        "timestamp": timestamp.isoformat()
    })
    user_profile['activityLog'] = activity_log[:15]
    
    _save_user_profile(user_id, user_profile)
    return user_profile

def get_user_stats(user_id):
    """Retrieves user analytics (streaks, activity history, recommendations)."""
    profile = _get_or_create_user_profile(user_id)
    
    # Check if streak broke since last check (if last activity was before yesterday)
    last_study = profile.get('lastStudyDate')
    if last_study:
        last_date = date.fromisoformat(last_study)
        today = date.today()
        if (today - last_date).days > 1:
            profile['streakCount'] = 0
            _save_user_profile(user_id, profile)
            
    return {
        "streakCount": profile.get('streakCount', 0),
        "lastStudyDate": profile.get('lastStudyDate'),
        "activityLog": profile.get('activityLog', [])
    }

def _get_or_create_user_profile(user_id):
    if config.FIREBASE_ENABLED:
        try:
            doc = db.collection('users').document(user_id).get()
            if doc.exists:
                return doc.to_dict()
        except Exception as e:
            print(f"Firestore user load error: {e}")
            
    # Local JSON fallback
    users = _read_local_json('users.json')
    if user_id in users:
        return users[user_id]
        
    # Default Profile template
    new_profile = {
        "userId": user_id,
        "streakCount": 0,
        "lastStudyDate": None,
        "activityLog": []
    }
    
    if config.FIREBASE_ENABLED:
        try:
            db.collection('users').document(user_id).set(new_profile)
        except Exception:
            pass
            
    users = _read_local_json('users.json')
    users[user_id] = new_profile
    _write_local_json('users.json', users)
    return new_profile

def _save_user_profile(user_id, profile_data):
    if config.FIREBASE_ENABLED:
        try:
            db.collection('users').document(user_id).set(profile_data)
            return
        except Exception as e:
            print(f"Firestore user save failed: {e}")
            
    # Local JSON fallback
    users = _read_local_json('users.json')
    users[user_id] = profile_data
    _write_local_json('users.json', users)
