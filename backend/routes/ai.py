from flask import Blueprint, request, jsonify
from backend.services.firebase_service import verify_token, get_study_material, update_study_material_generation, get_quiz_history
from backend.services.groq_service import (
    generate_summary, 
    generate_flashcards, 
    generate_quiz, 
    chat_with_document,
    evaluate_short_answer,
    generate_study_schedule,
    generate_weak_topic_report
)

ai_bp = Blueprint('ai', __name__)

def get_authenticated_user():
    """Helper to verify Authorization Bearer token."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ', 1)[1]
    return verify_token(token)

@ai_bp.route('/summary', methods=['POST'])
def get_or_create_summary():
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized Access"}), 401
        
    data = request.json or {}
    material_id = data.get('materialId')
    
    if not material_id:
        return jsonify({"error": "Missing materialId"}), 400
        
    material = get_study_material(user['uid'], material_id)
    if not material:
        return jsonify({"error": "Material not found"}), 404
        
    generations = material.get('generations', {})
    if 'summary' in generations and generations['summary']:
        return jsonify({"summary": generations['summary']}), 200
        
    try:
        summary_text = generate_summary(material['text'], material['name'])
        update_study_material_generation(user['uid'], material_id, 'summary', summary_text)
        return jsonify({"summary": summary_text}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate summary: {str(e)}"}), 500

@ai_bp.route('/flashcards', methods=['POST'])
def get_or_create_flashcards():
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized Access"}), 401
        
    data = request.json or {}
    material_id = data.get('materialId')
    
    if not material_id:
        return jsonify({"error": "Missing materialId"}), 400
        
    material = get_study_material(user['uid'], material_id)
    if not material:
        return jsonify({"error": "Material not found"}), 404
        
    generations = material.get('generations', {})
    if 'flashcards' in generations and generations['flashcards']:
        return jsonify({"flashcards": generations['flashcards']}), 200
        
    try:
        flashcards = generate_flashcards(material['text'], material['name'])
        update_study_material_generation(user['uid'], material_id, 'flashcards', flashcards)
        return jsonify({"flashcards": flashcards}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate flashcards: {str(e)}"}), 500

@ai_bp.route('/quiz', methods=['POST'])
def get_or_create_quiz():
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized Access"}), 401
        
    data = request.json or {}
    material_id = data.get('materialId')
    quiz_type = data.get('quizType', 'mcq') # Types: mcq, tf, short_answer
    
    if not material_id:
        return jsonify({"error": "Missing materialId"}), 400
        
    material = get_study_material(user['uid'], material_id)
    if not material:
        return jsonify({"error": "Material not found"}), 404
        
    # Map cache keys
    cache_key = f"quiz_{quiz_type}"
    generations = material.get('generations', {})
    
    if cache_key in generations and generations[cache_key]:
        return jsonify({"quiz": generations[cache_key]}), 200
        
    try:
        quiz = generate_quiz(material['text'], material['name'], quiz_type)
        update_study_material_generation(user['uid'], material_id, cache_key, quiz)
        return jsonify({"quiz": quiz}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate {quiz_type.upper()} quiz: {str(e)}"}), 500

@ai_bp.route('/quiz/evaluate', methods=['POST'])
def evaluate_quiz_answer():
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized Access"}), 401
        
    data = request.json or {}
    question = data.get('question')
    sample_answer = data.get('sampleAnswer')
    user_answer = data.get('userAnswer')
    
    if not all([question, sample_answer, user_answer]):
        return jsonify({"error": "Missing evaluation parameters"}), 400
        
    try:
        evaluation = evaluate_short_answer(question, sample_answer, user_answer)
        return jsonify(evaluation), 200
    except Exception as e:
        return jsonify({"error": f"Evaluation engine failed: {str(e)}"}), 500

@ai_bp.route('/schedule', methods=['POST'])
def get_or_create_schedule():
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized Access"}), 401
        
    data = request.json or {}
    material_id = data.get('materialId')
    
    if not material_id:
        return jsonify({"error": "Missing materialId"}), 400
        
    material = get_study_material(user['uid'], material_id)
    if not material:
        return jsonify({"error": "Material not found"}), 404
        
    generations = material.get('generations', {})
    if 'schedule' in generations and generations['schedule']:
        return jsonify({"schedule": generations['schedule']}), 200
        
    try:
        schedule = generate_study_schedule(material['text'], material['name'])
        update_study_material_generation(user['uid'], material_id, 'schedule', schedule)
        return jsonify({"schedule": schedule}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate study schedule: {str(e)}"}), 500

@ai_bp.route('/weak-topics', methods=['POST'])
def get_weak_topics():
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized Access"}), 401
        
    data = request.json or {}
    material_id = data.get('materialId')
    
    if not material_id:
        return jsonify({"error": "Missing materialId"}), 400
        
    material = get_study_material(user['uid'], material_id)
    if not material:
        return jsonify({"error": "Material not found"}), 404
        
    # Get all quiz history for this user to pass to AI diagnostic
    all_history = get_quiz_history(user['uid'])
    # Filter for this specific material
    mat_history = [r for r in all_history if r.get('materialId') == material_id]
    
    # We can check if weak topics are cached, but if new quizzes are taken, we should regenerate.
    # For now, let's cache but regenerate if quiz history length is different from when we cached.
    generations = material.get('generations', {})
    if 'weak_topics' in generations and generations['weak_topics']:
        return jsonify(generations['weak_topics']), 200
        
    try:
        report = generate_weak_topic_report(mat_history, material['name'])
        update_study_material_generation(user['uid'], material_id, 'weak_topics', report)
        return jsonify(report), 200
    except Exception as e:
        return jsonify({"error": f"Failed to run diagnostic analyzer: {str(e)}"}), 500

@ai_bp.route('/chat', methods=['POST'])
def chat():
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized Access"}), 401
        
    data = request.json or {}
    material_id = data.get('materialId')
    message = data.get('message')
    history = data.get('history', [])
    
    if not material_id or not message:
        return jsonify({"error": "Missing materialId or message"}), 400
        
    material = get_study_material(user['uid'], material_id)
    if not material:
        return jsonify({"error": "Material not found"}), 404
        
    try:
        reply = chat_with_document(material['text'], history, message, material['name'])
        return jsonify({"reply": reply}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get reply: {str(e)}"}), 500
