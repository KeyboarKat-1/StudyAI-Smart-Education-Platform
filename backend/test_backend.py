import os
import sys
import unittest
import json
import io

# Add parent dir to path
sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from backend.app import create_app
from backend import config

class StudyAITestCase(unittest.TestCase):
    def setUp(self):
        # Force local fallback modes for reliable unit tests
        config.FIREBASE_ENABLED = False
        config.GROQ_ENABLED = False
        
        self.app = create_app()
        self.client = self.app.test_client()
        
        # Mock token for test user
        self.headers = {
            'Authorization': 'Bearer mock-uid:tester@studyai.edu'
        }
        
    def tearDown(self):
        # Clean up mock database files
        for f in ['materials.json', 'quiz_history.json', 'users.json']:
            file_path = os.path.join(config.DATA_FOLDER, f)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass

    def test_health_check(self):
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['mode'], 'local-fallback')

    def test_full_lifecycle(self):
        # Create a mock text file
        file_data = {
            'file': (io.BytesIO(b"StudyAI is a smart education platform. It uses React and Flask. React is a javascript library. Flask is a python framework. We study hard!"), 'test_file.txt')
        }
        
        # 1. Upload Document
        response = self.client.post('/api/materials/upload', data=file_data, headers=self.headers, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 201)
        material = json.loads(response.data)
        material_id = material['id']
        
        # 2. Get AI Summary
        response = self.client.post('/api/ai/summary', json={"materialId": material_id}, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        
        # 3. Get AI Flashcards
        response = self.client.post('/api/ai/flashcards', json={"materialId": material_id}, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        
        # 4. Get TF Quiz
        response = self.client.post('/api/ai/quiz', json={"materialId": material_id, "quizType": "tf"}, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        quiz_data = json.loads(response.data)
        self.assertIn('quiz', quiz_data)
        
        # 5. Get Short Answer Quiz
        response = self.client.post('/api/ai/quiz', json={"materialId": material_id, "quizType": "short_answer"}, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        
        # 6. Evaluate Short Answer
        eval_payload = {
            "question": "What libraries does StudyAI use?",
            "sampleAnswer": "It uses React for frontend and Flask for backend.",
            "userAnswer": "React and Flask framework."
        }
        response = self.client.post('/api/ai/quiz/evaluate', json=eval_payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        eval_data = json.loads(response.data)
        self.assertIn('score', eval_data)
        self.assertIn('feedback', eval_data)
        
        # 7. Get Study Schedule
        response = self.client.post('/api/ai/schedule', json={"materialId": material_id}, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        sched_data = json.loads(response.data)
        self.assertIn('schedule', sched_data)
        
        # 8. Get Weak Topics (Initially empty history will return default analysis)
        response = self.client.post('/api/ai/weak-topics', json={"materialId": material_id}, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        
        # 9. Save Quiz History Record
        history_payload = {
            "materialId": material_id,
            "materialName": "test_file.txt",
            "score": 4,
            "totalQuestions": 5,
            "quizType": "mcq"
        }
        response = self.client.post('/api/analytics/quiz-history', json=history_payload, headers=self.headers)
        self.assertEqual(response.status_code, 201)
        
        # 10. Fetch Quiz History
        response = self.client.get('/api/analytics/quiz-history', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        history_list = json.loads(response.data)
        self.assertEqual(len(history_list), 1)
        self.assertEqual(history_list[0]['score'], 4)
        
        # 11. Fetch Dashboard Analytics
        response = self.client.get('/api/analytics/dashboard', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        dash = json.loads(response.data)
        self.assertEqual(dash['streakCount'], 1)
        self.assertEqual(dash['averageScore'], 80) # 4/5 * 100
        self.assertEqual(dash['totalDocuments'], 1)
        self.assertTrue(len(dash['progressChartData']) > 0)
        self.assertTrue(len(dash['recentActivity']) > 0)
        self.assertTrue(len(dash['adaptiveRecommendations']) > 0)
        
        # 12. Log Custom Activity
        response = self.client.post('/api/analytics/activity', json={"description": "Reviewed Flashcards for test_file.txt"}, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        
        # 13. Delete Document
        response = self.client.delete(f'/api/materials/{material_id}', headers=self.headers)
        self.assertEqual(response.status_code, 200)

if __name__ == '__main__':
    unittest.main()
