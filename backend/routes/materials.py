import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from backend import config
from backend.services.firebase_service import verify_token, save_study_material, get_study_materials, get_study_material, delete_study_material
from backend.services.text_extractor import extract_text

materials_bp = Blueprint('materials', __name__)

def get_authenticated_user():
    """Helper to verify Authorization Bearer token."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ', 1)[1]
    return verify_token(token)

@materials_bp.route('', methods=['POST'])
@materials_bp.route('/upload', methods=['POST'])
def upload_material():
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized Access"}), 401

    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected for uploading"}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(config.UPLOAD_FOLDER, filename)
    
    try:
        # Save file locally first to read it
        file.save(file_path)
        
        # Determine file size
        file_size = os.path.getsize(file_path)
        
        # Extract text content
        extracted_text = extract_text(file_path, filename)
        word_count = len(extracted_text.split())
        
        # Prepare material record
        material_data = {
            "name": filename,
            "size": file_size,
            "type": os.path.splitext(filename.lower())[1][1:].upper(),
            "wordCount": word_count,
            "text": extracted_text,
            "status": "processed",
            "error": None,
            "generations": {}
        }
        
        # Save to database (Cloud Firestore or Local JSON)
        saved_material = save_study_material(user['uid'], material_data)
        
        # Remove temporary file
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return jsonify(saved_material), 201
        
    except ValueError as ve:
        # Expected extraction validation errors
        if os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        # Catch unexpected errors
        if os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({"error": f"An error occurred during file ingestion: {str(e)}"}), 500

@materials_bp.route('', methods=['GET'])
def list_materials():
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized Access"}), 401
        
    try:
        materials = get_study_materials(user['uid'])
        # Strip heavy text for list queries to optimize payload
        list_response = []
        for m in materials:
            list_response.append({
                "id": m.get("id"),
                "name": m.get("name"),
                "size": m.get("size"),
                "type": m.get("type"),
                "wordCount": m.get("wordCount"),
                "status": m.get("status"),
                "createdAt": m.get("createdAt"),
                "hasSummary": "summary" in m.get("generations", {}),
                "hasFlashcards": "flashcards" in m.get("generations", {}),
                "hasQuiz": "quiz" in m.get("generations", {}),
            })
        return jsonify(list_response), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve materials: {str(e)}"}), 500

@materials_bp.route('/<material_id>', methods=['GET'])
def get_material(material_id):
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized Access"}), 401
        
    try:
        material = get_study_material(user['uid'], material_id)
        if not material:
            return jsonify({"error": "Material not found"}), 404
        return jsonify(material), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve material details: {str(e)}"}), 500

@materials_bp.route('/<material_id>', methods=['DELETE'])
def delete_material(material_id):
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized Access"}), 401
        
    try:
        success = delete_study_material(user['uid'], material_id)
        if success:
            return jsonify({"success": True, "message": "Material deleted successfully"}), 200
        return jsonify({"error": "Material not found or access denied"}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to delete material: {str(e)}"}), 500
