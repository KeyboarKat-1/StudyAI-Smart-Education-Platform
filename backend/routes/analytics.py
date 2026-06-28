from flask import Blueprint, request, jsonify
from backend.services.firebase_service import verify_token, save_quiz_record, get_quiz_history, get_user_stats, log_user_activity, get_study_materials
from datetime import datetime

analytics_bp = Blueprint('analytics', __name__)

def get_authenticated_user():
    """Helper to verify Authorization Bearer token."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ', 1)[1]
    return verify_token(token)

@analytics_bp.route('/quiz-history', methods=['POST'])
def save_quiz():
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized Access"}), 401
        
    data = request.json or {}
    required = ['materialId', 'materialName', 'score', 'totalQuestions', 'quizType']
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400
        
    record = {
        "materialId": data['materialId'],
        "materialName": data['materialName'],
        "score": int(data['score']),
        "totalQuestions": int(data['totalQuestions']),
        "quizType": data['quizType'],
        "timestamp": datetime.now().isoformat()
    }
    
    try:
        saved_record = save_quiz_record(user['uid'], record)
        return jsonify(saved_record), 201
    except Exception as e:
        return jsonify({"error": f"Failed to save quiz performance: {str(e)}"}), 500

@analytics_bp.route('/quiz-history', methods=['GET'])
def list_quiz_history():
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized Access"}), 401
        
    try:
        history = get_quiz_history(user['uid'])
        return jsonify(history), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve quiz logs: {str(e)}"}), 500

@analytics_bp.route('/activity', methods=['POST'])
def log_activity():
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized Access"}), 401
        
    data = request.json or {}
    description = data.get('description')
    if not description:
        return jsonify({"error": "Missing description"}), 400
        
    try:
        stats = log_user_activity(user['uid'], description)
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": f"Failed to log activity: {str(e)}"}), 500

@analytics_bp.route('/dashboard', methods=['GET'])
def get_dashboard_data():
    user = get_authenticated_user()
    if not user:
        return jsonify({"error": "Unauthorized Access"}), 401
        
    try:
        stats = get_user_stats(user['uid'])
        quiz_records = get_quiz_history(user['uid'])
        materials = get_study_materials(user['uid'])
        
        # Calculate statistics
        total_quizzes = len(quiz_records)
        total_materials = len(materials)
        
        avg_score = 0
        if total_quizzes > 0:
            total_pct = sum((r['score'] / r['totalQuestions'] * 100) if r['totalQuestions'] > 0 else 0 for r in quiz_records)
            avg_score = round(total_pct / total_quizzes)
            
        # Compile SVG/Chart progress plot data (last 7 quizzes, sorted chronological)
        chart_records = quiz_records[:7]
        chart_records.reverse()
        progress_chart = []
        for i, r in enumerate(chart_records):
            d_obj = datetime.fromisoformat(r['timestamp'])
            pct = round((r['score'] / r['totalQuestions']) * 100) if r['totalQuestions'] > 0 else 0
            progress_chart.append({
                "index": i + 1,
                "label": d_obj.strftime("%b %d"),
                "score": pct,
                "type": r.get('quizType', 'MCQ').upper(),
                "docName": r.get('materialName', 'Document')
            })
            
        # Build adaptive study recommendations
        recommendations = []
        if total_materials == 0:
            recommendations.append({
                "title": "Build your Library",
                "desc": "Upload a PDF, DOCX, or TXT study document to launch your personalized AI study guides.",
                "action": "upload"
            })
        
        # If user has materials but no quiz history
        if total_materials > 0 and total_quizzes == 0:
            recommendations.append({
                "title": "Take your First Practice Quiz",
                "desc": f"Challenge yourself on '{materials[0]['name']}' with an AI practice quiz to diagnostic your baseline.",
                "action": "quiz",
                "materialId": materials[0]['id']
            })
            
        # If average score is low
        if total_quizzes > 0 and avg_score < 70:
            # Find the material they struggled with most
            worst_quiz = min(quiz_records, key=lambda x: (x['score']/x['totalQuestions'] if x['totalQuestions'] > 0 else 1))
            recommendations.append({
                "title": "Review Weak Topics",
                "desc": f"Your score was low on '{worst_quiz['materialName']}'. Review the AI Weak Topic analysis and key summaries.",
                "action": "weak_topics",
                "materialId": worst_quiz['materialId']
            })
            
        # Always suggest keeping up streaks
        streak = stats.get('streakCount', 0)
        if streak > 0:
            recommendations.append({
                "title": "Maintain your Streak!",
                "desc": f"You are on a {streak}-day streak! Upload a new document or chat with your study assistant to keep it burning.",
                "action": "chat",
                "materialId": materials[0]['id'] if total_materials > 0 else None
            })
        else:
            if total_materials > 0:
                recommendations.append({
                    "title": "Ignite your Study Streak",
                    "desc": f"Review some flashcards or take a quick T/F quiz on '{materials[0]['name']}' to start your streak today.",
                    "action": "flashcards",
                    "materialId": materials[0]['id']
                })
                
        # Fill standard recommendation if list is short
        if len(recommendations) < 2 and total_materials > 0:
            recommendations.append({
                "title": "Personalize Study Plan",
                "desc": f"Generate a structured 7-day calendar schedule to master the topics inside '{materials[0]['name']}'.",
                "action": "schedule",
                "materialId": materials[0]['id']
            })

        return jsonify({
            "streakCount": streak,
            "averageScore": avg_score,
            "totalQuizzes": total_quizzes,
            "totalDocuments": total_materials,
            "recentActivity": stats.get('activityLog', []),
            "progressChartData": progress_chart,
            "adaptiveRecommendations": recommendations[:3] # Max 3 recommendations
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve dashboard metrics: {str(e)}"}), 500
