import os
import json
import re
from backend import config

# Try to initialize Groq client
client = None
if config.GROQ_ENABLED:
    try:
        from groq import Groq
        client = Groq(api_key=config.GROQ_API_KEY)
    except Exception as e:
        print(f"Failed to initialize Groq client: {e}. Falling back to Mock AI.")
        config.GROQ_ENABLED = False

def clean_json_response(text):
    """Utility to clean code fences or extra text around a JSON response."""
    # Search for json block
    match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
    if match:
        return match.group(1).strip()
    
    # If no fence, try to find the outer brackets
    match = re.search(r'(\[.*\]|\{.*\})', text, re.DOTALL)
    if match:
        return match.group(1).strip()
        
    return text.strip()

# --- AI Methods ---

def generate_summary(text, title="the document"):
    """Generates a structured markdown summary of the text."""
    if not text:
        return "No text available to summarize."
        
    prompt = (
        f"You are an expert AI Study Assistant. Summarize the following study material titled '{title}'.\n"
        "Provide a high-quality, comprehensive summary in Markdown format with the following structure:\n"
        "1. **Core Overview** (A high-level 2-3 sentence overview)\n"
        "2. **Key Concepts & Definitions** (Bullet points of key terms and concepts)\n"
        "3. **Detailed Breakdown** (Structured sections highlighting the core contents of the text)\n"
        "4. **Study Takeaways** (3-5 actionable study takeaways or conclusions)\n\n"
        "Keep it highly readable, clear, and professional. Use formatting like bold text, bullet points, and headers.\n\n"
        f"--- STUDY MATERIAL TEXT ---\n{text[:12000]}"
    )
    
    if config.GROQ_ENABLED:
        try:
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a professional academic summary generator. Format your output as clean, organized Markdown."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2048
            )
            return completion.choices[0].message.content.strip()
        except Exception as e:
            print(f"Groq API Error in summary generation: {e}. Falling back to mock summary.")
            
    return _generate_mock_summary(text, title)

def generate_flashcards(text, title="the document"):
    """Generates a list of Q&A flashcards based on the text."""
    if not text:
        return []
        
    prompt = (
        f"You are an expert tutor. Analyze the following study material titled '{title}' and generate 6-10 high-quality flashcards for studying.\n"
        "You must return ONLY a JSON array of objects. Do not write any introduction, code blocks, or explanation. The JSON format must be exactly:\n"
        "[\n"
        "  {\n"
        "    \"question\": \"Question about a key concept...\",\n"
        "    \"answer\": \"Clear, concise answer...\"\n"
        "  }\n"
        "]\n\n"
        f"--- STUDY MATERIAL TEXT ---\n{text[:12000]}"
    )
    
    if config.GROQ_ENABLED:
        try:
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a structured tutor that outputs ONLY valid JSON arrays. Do not include markdown formatting or backticks around the JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=1500
            )
            raw_content = clean_json_response(completion.choices[0].message.content)
            return json.loads(raw_content)
        except Exception as e:
            print(f"Groq API Error in flashcards generation: {e}. Falling back to mock flashcards.")
            
    return _generate_mock_flashcards(text, title)

def generate_quiz(text, title="the document", quiz_type="mcq"):
    """Generates a list of questions based on text (types: mcq, tf, short_answer)."""
    if not text:
        return []

    system_content = "You are a structured academic test maker that outputs ONLY valid JSON arrays. Do not include markdown formatting or backticks around the JSON."
    
    if quiz_type == "mcq":
        prompt = (
            f"Analyze this study material titled '{title}' and generate 5 multiple choice questions.\n"
            "Return ONLY a JSON array of objects with structure:\n"
            "[\n"
            "  {\n"
            "    \"question\": \"The question?\",\n"
            "    \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n"
            "    \"correctIndex\": 0,\n"
            "    \"explanation\": \"Detailed rationale...\"\n"
            "  }\n"
            "]\n\n"
            f"--- TEXT ---\n{text[:12000]}"
        )
    elif quiz_type == "tf":
        prompt = (
            f"Analyze this study material titled '{title}' and generate 5 True/False questions.\n"
            "Return ONLY a JSON array of objects with structure:\n"
            "[\n"
            "  {\n"
            "    \"question\": \"Fact statement?\",\n"
            "    \"options\": [\"True\", \"False\"],\n"
            "    \"correctIndex\": 0,\n"
            "    \"explanation\": \"Detailed rationale...\"\n"
            "  }\n"
            "]\n\n"
            f"--- TEXT ---\n{text[:12000]}"
        )
    else: # short_answer
        prompt = (
            f"Analyze this study material titled '{title}' and generate 3 conceptual short-answer questions.\n"
            "Return ONLY a JSON array of objects with structure:\n"
            "[\n"
            "  {\n"
            "    \"question\": \"Core question prompt?\",\n"
            "    \"sampleAnswer\": \"A perfect model answer...\",\n"
            "    \"keyPoints\": [\"Required key term or detail 1\", \"Required detail 2\"],\n"
            "    \"explanation\": \"Background concept explanation...\"\n"
            "  }\n"
            "]\n\n"
            f"--- TEXT ---\n{text[:12000]}"
        )

    if config.GROQ_ENABLED:
        try:
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=2000
            )
            raw_content = clean_json_response(completion.choices[0].message.content)
            return json.loads(raw_content)
        except Exception as e:
            print(f"Groq API Error in quiz ({quiz_type}) generation: {e}. Falling back to mock.")
            
    return _generate_mock_quiz(text, title, quiz_type)

def evaluate_short_answer(question, sample_answer, user_answer):
    """Grades a user's short answer response compared to the sample answer."""
    prompt = (
        "You are an academic grader. Evaluate the student's answer against the question and the model sample answer.\n"
        f"Question: \"{question}\"\n"
        f"Model Answer: \"{sample_answer}\"\n"
        f"Student Answer: \"{user_answer}\"\n\n"
        "Analyze factual accuracy, missing critical details, and overall logic. "
        "Return ONLY a JSON object with this exact structure:\n"
        "{\n"
        "  \"score\": 8, // Integer from 0 to 10\n"
        "  \"feedback\": \"Constructive feedback detailing what they did well and where they can improve.\",\n"
        "  \"missingPoints\": [\"Detail or term they should have mentioned\"],\n"
        "  \"corrections\": \"Grammar corrections or factual misconceptions to fix (or empty string if none)\"\n"
        "}"
    )

    if config.GROQ_ENABLED:
        try:
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a structured grading assistant that outputs ONLY valid JSON. Do not include markdown code blocks."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=800
            )
            raw_content = clean_json_response(completion.choices[0].message.content)
            return json.loads(raw_content)
        except Exception as e:
            print(f"Groq API Error in SA evaluation: {e}. Falling back to mock grading.")

    # Local Mock Grading Heuristic
    return _generate_mock_grading(question, sample_answer, user_answer)

def generate_study_schedule(text, title="the document"):
    """Generates a structured 7-day study schedule based on text."""
    prompt = (
        f"You are an academic planner. Create a personalized, structured 7-day study plan to master the material titled '{title}'.\n"
        "You must return ONLY a JSON array of days. Do not write any intro/outro. Structure must be exactly:\n"
        "[\n"
        "  {\n"
        "    \"day\": 1,\n"
        "    \"topic\": \"Focus Topic Name\",\n"
        "    \"description\": \"Description of the core concepts to study on this day.\",\n"
        "    \"checklist\": [\n"
        "      \"Read summary section X\",\n"
        "      \"Take practice quiz on Y\"\n"
        "    ]\n"
        "  }\n"
        "]\n\n"
        f"--- STUDY TEXT ---\n{text[:12000]}"
    )

    if config.GROQ_ENABLED:
        try:
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a structured planning agent that outputs ONLY valid JSON arrays. Do not include markdown formatting."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=2000
            )
            raw_content = clean_json_response(completion.choices[0].message.content)
            return json.loads(raw_content)
        except Exception as e:
            print(f"Groq API Error in schedule generation: {e}. Falling back to mock.")

    return _generate_mock_schedule(text, title)

def generate_weak_topic_report(quiz_history, title="the document"):
    """Analyses user quiz history and generates a weak topic diagnostics report."""
    history_summary = []
    for r in quiz_history[-5:]: # Last 5 records
        history_summary.append(f"- Quiz Type: {r.get('quizType')}, Score: {r.get('score')}/{r.get('totalQuestions')}, Timestamp: {r.get('timestamp')}")
    
    prompt = (
        f"You are a learning diagnostic system. Analyze this student's recent quiz performance history on the document '{title}':\n"
        f"{chr(10).join(history_summary)}\n\n"
        "Synthesize their weak spots and make recommendations. "
        "You must return ONLY a JSON object. Do not include markdown. Format:\n"
        "{\n"
        "  \"weakTopics\": [\n"
        "    {\n"
        "      \"topicName\": \"Identified Concept/Topic Name\",\n"
        "      \"percentageScore\": 40, // Estimated accuracy\n"
        "      \"recommendedReview\": \"Read specific page details or study card deck #2\"\n"
        "    }\n"
        "  ],\n"
        "  \"summary\": \"Overall diagnostic overview summary...\"\n"
        "}"
    )

    if config.GROQ_ENABLED and len(history_summary) > 0:
        try:
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a learning diagnostic assistant that outputs ONLY valid JSON. Do not include markdown formatting."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            raw_content = clean_json_response(completion.choices[0].message.content)
            return json.loads(raw_content)
        except Exception as e:
            print(f"Groq API Error in weak topics: {e}. Falling back to mock.")

    return _generate_mock_weak_topics(quiz_history, title)

def chat_with_document(text, history, message, title="the document"):
    """Answers a user message in context of the document."""
    system_prompt = (
        "You are 'StudyAI', an advanced AI Study Companion. You are helping a student study a document.\n"
        f"The document is titled: '{title}'.\n"
        "Answer the user's questions truthfully and clearly using the provided document text. "
        "If the answer cannot be found in the document, use your general knowledge but clearly state that it is not mentioned in the source document.\n"
        "Keep responses helpful, structured, concise, and encourage learning.\n\n"
        f"--- DOCUMENT TEXT ---\n{text[:15000]}"
    )
    
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-8:]:
        messages.append({"role": msg['role'], "content": msg['content']})
    messages.append({"role": "user", "content": message})
    
    if config.GROQ_ENABLED:
        try:
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.5,
                max_tokens=800
            )
            return completion.choices[0].message.content.strip()
        except Exception as e:
            print(f"Groq API Error in chat: {e}. Falling back to mock chat.")
            
    return _generate_mock_chat(text, history, message, title)


# --- Heuristic Fallback Methods ---

def _extract_sentences(text, count=10):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    cleaned = []
    for s in sentences:
        s = s.strip()
        if len(s) > 20 and not s.startswith("--- Page"):
            cleaned.append(s)
    return cleaned[:count]

def _generate_mock_summary(text, title):
    sentences = _extract_sentences(text, 8)
    overview = sentences[0] if len(sentences) > 0 else "This document contains study materials uploaded by the user."
    if len(sentences) > 1:
        overview += " " + sentences[1]
    concepts = [f"- **{(' '.join(s.split()[:2])).strip('.,')}**: {s}" for s in sentences[2:5]] if len(sentences) > 4 else ["- **Core Concept**: Text details."]
    breakdown_items = [f"#### Key Discussion Point\n{s}" for s in sentences[5:8]]
    return f"""# Study Summary: {title}
> [!NOTE]
> **Running in Local Fallback Mode**. Heuristic summary generator active.

## 1. Core Overview
{overview}

## 2. Key Concepts & Definitions
{chr(10).join(concepts)}

## 3. Detailed Breakdown
{chr(10).join(breakdown_items)}

## 4. Study Takeaways
- Review core terms identified in the document list.
- Challenge yourself with custom quizzes.
- Leverage the schedule tab to organize your learning path.
"""

def _generate_mock_flashcards(text, title):
    sentences = _extract_sentences(text, 6)
    flashcards = []
    for s in sentences:
        words = s.split()
        if len(words) > 5:
            flashcards.append({
                "question": f"What key detail is highlighted regarding: '{' '.join(words[:3])}'?",
                "answer": s
            })
    if not flashcards:
        flashcards = [
            {"question": "What is StudyAI?", "answer": "An intelligent web tool that facilitates automated summarizing, custom quizzes, and document chatting."},
            {"question": "How to unlock Llama 3.3?", "answer": "Define the GROQ_API_KEY environment variable on the Flask backend environment."}
        ]
    return flashcards

def _generate_mock_quiz(text, title, quiz_type):
    sentences = _extract_sentences(text, 5)
    quiz = []
    
    if quiz_type == "mcq":
        for s in sentences:
            words = s.split()
            keyword = words[0].strip(".,") if len(words) > 0 else "Concept"
            quiz.append({
                "question": f"Which statement best matches the document description: '{s}'?",
                "options": [
                    f"It details the importance of {keyword}.",
                    f"It contradicts research on {keyword}.",
                    f"It claims {keyword} is irrelevant.",
                    f"It proves {keyword} is static."
                ],
                "correctIndex": 0,
                "explanation": f"The document literally notes: '{s}'."
            })
    elif quiz_type == "tf":
        for i, s in enumerate(sentences):
            is_true = i % 2 == 0
            stmt = s if is_true else f"Factual error: {s} is generally considered false."
            quiz.append({
                "question": f"True or False: {stmt}",
                "options": ["True", "False"],
                "correctIndex": 0 if is_true else 1,
                "explanation": f"The document states: '{s}'."
            })
    else: # short_answer
        for s in sentences:
            words = s.split()
            kw = " ".join(words[:2]).strip(".,")
            quiz.append({
                "question": f"Explain the context and implications of the document snippet relating to '{kw}':",
                "sampleAnswer": s,
                "keyPoints": [kw.lower(), words[-1].lower() if len(words) > 2 else "details"],
                "explanation": f"This tests details on '{s}'."
            })
            
    if not quiz:
        # Fallbacks
        if quiz_type == "mcq":
            quiz = [{"question": "Is this a fallback?", "options": ["Yes", "No", "Maybe", "None"], "correctIndex": 0, "explanation": "This is fallback."}]
        elif quiz_type == "tf":
            quiz = [{"question": "StudyAI helps learning.", "options": ["True", "False"], "correctIndex": 0, "explanation": "True."}]
        else:
            quiz = [{"question": "Briefly describe your goals for this document.", "sampleAnswer": "To review terms and concepts.", "keyPoints": ["review", "concepts"], "explanation": "Personal study evaluation."}]
            
    return quiz

def _generate_mock_grading(question, sample_answer, user_answer):
    # Dumb heuristic: count overlapping lowercase words
    q_words = set(re.findall(r'\w+', user_answer.lower()))
    a_words = set(re.findall(r'\w+', sample_answer.lower()))
    overlap = q_words.intersection(a_words)
    
    score = min(2 + len(overlap) * 2, 10)
    if len(user_answer.strip()) < 5:
        score = 0
        
    feedback = "Running in Local Mock Grading Mode. "
    if score >= 8:
        feedback += "Great answer! You captured the main keywords from the reference text."
    elif score >= 5:
        feedback += "Decent answer. You touched on some concepts, but missed key factual bounds."
    else:
        feedback += "Your response is incomplete or misses the reference context. Try incorporating more vocabulary."
        
    missing = [w for w in list(a_words)[:3] if w not in q_words and len(w) > 4]
    
    return {
        "score": score,
        "feedback": feedback,
        "missingPoints": missing if missing else ["Context details"],
        "corrections": "Factual alignment checks recommended." if score < 7 else ""
    }

def _generate_mock_schedule(text, title):
    sentences = _extract_sentences(text, 7)
    schedule = []
    
    for i in range(1, 8):
        focus = sentences[i-1] if len(sentences) >= i else "General overview review."
        words = focus.split()
        topic = " ".join(words[:3]).strip(".,") if len(words) > 2 else f"Section {i}"
        
        schedule.append({
            "day": i,
            "topic": f"Mastering {topic}",
            "description": f"Focus your study on: '{focus}'",
            "checklist": [
                f"Analyze vocabulary relating to {topic}",
                f"Practice flashcards deck, current day targets",
                f"Discuss concepts in Chat assistant window"
            ]
        })
    return schedule

def _generate_mock_weak_topics(quiz_history, title):
    if not quiz_history:
        return {
            "weakTopics": [
                {"topicName": "General Concepts", "percentageScore": 60, "recommendedReview": "Take your first quiz to diagnose weak spots."}
            ],
            "summary": "No quiz data available yet. Complete a quiz to receive diagnostic weak spot analysis."
        }
        
    # Analyze history
    avg_score = 0
    tf_scores = []
    mcq_scores = []
    
    for r in quiz_history:
        pct = (r['score'] / r['totalQuestions']) * 100 if r['totalQuestions'] > 0 else 0
        avg_score += pct
        if r.get('quizType') == 'tf':
            tf_scores.append(pct)
        else:
            mcq_scores.append(pct)
            
    avg_score /= len(quiz_history)
    
    weak_topics = []
    if mcq_scores and sum(mcq_scores)/len(mcq_scores) < 70:
        weak_topics.append({
            "topicName": "Detailed Keyword Comprehension",
            "percentageScore": int(sum(mcq_scores)/len(mcq_scores)),
            "recommendedReview": "Review the summary and definitions tab to memorize key terminology differences."
        })
    if tf_scores and sum(tf_scores)/len(tf_scores) < 70:
        weak_topics.append({
            "topicName": "Factual Verification",
            "percentageScore": int(sum(tf_scores)/len(tf_scores)),
            "recommendedReview": "Carefully re-read paragraph summaries to spot subtle modifications in true/false statements."
        })
        
    if not weak_topics:
        weak_topics.append({
            "topicName": "Advanced Contextual Applications",
            "percentageScore": 75,
            "recommendedReview": "Practice Short-Answer quizzes to strengthen synthesis skills."
        })
        
    return {
        "weakTopics": weak_topics,
        "summary": f"Based on your recent average score of {int(avg_score)}% across {len(quiz_history)} quiz sessions, you show solid core concepts but can refine specific detail accuracy."
    }

def _generate_mock_chat(text, history, message, title):
    msg_words = [w.lower() for w in re.findall(r'\w+', message) if len(w) > 3]
    sentences = _extract_sentences(text, 30)
    matching_sentences = [s for s in sentences if any(w in s.lower() for w in msg_words)]
    
    response = f"I am running in **Local Mock Mode** (no Groq key config).\n\n"
    if matching_sentences:
        response += f"Regarding your query about '{' '.join(msg_words[:2])}', the document states:\n\n> \"{matching_sentences[0]}\"\n\nFeel free to ask other conceptual questions."
    else:
        response += f"I analyzed your question against **{title}**.\n\nI couldn't find an exact keyword match. Re-read: \"{sentences[0] if sentences else 'Study details'}\"."
    return response
