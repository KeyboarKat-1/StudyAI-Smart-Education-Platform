import os
import sys
import logging
from flask import Flask, jsonify
from flask_cors import CORS

# Add parent directory to path so imports work correctly when running directly
sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from backend import config

def create_app():
    app = Flask(__name__)
    app.config.from_object(config)
    
    # --------------------------------------------------------------------------
    # Centralized Logging Setup
    # --------------------------------------------------------------------------
    log_format = '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    log_handlers = [
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(config.DATA_FOLDER, 'app.log'), encoding='utf-8')
    ]
    logging.basicConfig(level=logging.INFO, format=log_format, handlers=log_handlers)
    
    app.logger.info("=========================================")
    app.logger.info("Initializing StudyAI Flask Application Server")
    app.logger.info(f"Mode Check: Firebase={config.FIREBASE_ENABLED}, Groq={config.GROQ_ENABLED}")
    app.logger.info("=========================================")

    # Configure CORS - Allow frontend local development server and Vercel domains
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Import and register Blueprints
    from backend.routes.materials import materials_bp
    from backend.routes.ai import ai_bp
    from backend.routes.analytics import analytics_bp
    
    app.register_blueprint(materials_bp, url_prefix='/api/materials')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    
    # --------------------------------------------------------------------------
    # Centralized Error Handlers
    # --------------------------------------------------------------------------
    @app.errorhandler(400)
    def bad_request(error):
        app.logger.warning(f"Bad request received: {str(error)}")
        return jsonify({
            "error": "Bad Request",
            "message": str(error.description) if hasattr(error, 'description') else str(error)
        }), 400

    @app.errorhandler(404)
    def route_not_found(error):
        app.logger.warning(f"Resource not found: {request_path_helper()}")
        return jsonify({
            "error": "Not Found",
            "message": "The requested resource could not be found on the server."
        }), 404

    @app.errorhandler(500)
    @app.errorhandler(Exception)
    def internal_server_error(error):
        app.logger.error(f"Internal server error triggered: {str(error)}", exc_info=True)
        return jsonify({
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. The technical team has been notified."
        }), 500

    def request_path_helper():
        try:
            from flask import request
            return request.path
        except Exception:
            return "unknown"
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        app.logger.info("Health check endpoint pinged.")
        return jsonify({
            "status": "healthy",
            "firebaseEnabled": config.FIREBASE_ENABLED,
            "groqEnabled": config.GROQ_ENABLED,
            "mode": "cloud" if config.FIREBASE_ENABLED and config.GROQ_ENABLED else "local-fallback"
        }), 200
        
    return app

if __name__ == '__main__':
    app = create_app()
    print(f"Starting StudyAI Flask backend on http://127.0.0.1:{config.PORT}...")
    app.run(host='0.0.0.0', port=config.PORT, debug=config.DEBUG)
else:
    app = create_app()
