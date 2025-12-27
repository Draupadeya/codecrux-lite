# app.py
import os
import re
import json
import subprocess
import urllib.parse
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
from youtube_transcript_api import YouTubeTranscriptApi
import requests
import google.generativeai as genai
from dotenv import load_dotenv
import cv2
import numpy as np
from deepface import DeepFace
import base64
from io import BytesIO
from PIL import Image

# --- Load environment variables FIRST ---
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables!")

print(f"✓ Loaded API Key: {GEMINI_API_KEY[:10]}...")

# --- Setup ---
app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

genai.configure(api_key=GEMINI_API_KEY)

TRANSCRIPTS_DIR = Path("./transcripts")
TRANSCRIPTS_DIR.mkdir(exist_ok=True)

# --- Helper Functions ---

def analyze_learner_mood(frame_data):
    """
    Analyze learner's mood and engagement from webcam frame.
    Returns emotion analysis and engagement status.
    
    Args:
        frame_data: Base64 encoded image or image bytes
    
    Returns:
        dict: Analysis results including emotion, engagement level, and recommendations
    """
    try:
        # Decode base64 image if necessary
        if isinstance(frame_data, str):
            # Remove data URL prefix if present
            if ',' in frame_data:
                frame_data = frame_data.split(',')[1]
            img_bytes = base64.b64decode(frame_data)
            img = Image.open(BytesIO(img_bytes))
            img_array = np.array(img)
        else:
            img_array = frame_data
        
        # Convert RGB to BGR for OpenCV compatibility
        if len(img_array.shape) == 3 and img_array.shape[2] == 3:
            frame_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        else:
            frame_bgr = img_array
        
        # Perform emotion analysis using DeepFace
        analysis = DeepFace.analyze(
            frame_bgr, 
            actions=['emotion', 'age', 'gender'],
            enforce_detection=False,
            detector_backend='opencv'
        )
        
        # Handle both single face and multiple faces
        if isinstance(analysis, list):
            analysis = analysis[0]
        
        # Extract emotion data
        emotions = analysis.get('emotion', {})
        dominant_emotion = analysis.get('dominant_emotion', 'unknown')
        age = analysis.get('age', 'unknown')
        gender = analysis.get('dominant_gender', 'unknown')
        
        # Calculate engagement score based on emotions
        engagement_score = calculate_engagement_score(emotions, dominant_emotion)
        
        # Determine engagement status
        engagement_status = determine_engagement_status(engagement_score, dominant_emotion)
        
        # Generate recommendations
        recommendations = generate_engagement_recommendations(engagement_status, dominant_emotion)
        
        result = {
            'success': True,
            'dominant_emotion': dominant_emotion,
            'emotions': emotions,
            'engagement_score': engagement_score,
            'engagement_status': engagement_status,
            'recommendations': recommendations,
            'age': age,
            'gender': gender,
            'timestamp': None  # Will be set by caller if needed
        }
        
        return result
        
    except Exception as e:
        print(f"Mood analysis error: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Could not analyze mood. Please ensure face is visible and well-lit.'
        }

def calculate_engagement_score(emotions, dominant_emotion):
    """
    Calculate engagement score (0-100) based on emotion probabilities.
    Higher scores indicate better engagement.
    """
    # Engaged emotions (positive indicators)
    engaged_emotions = ['happy', 'surprise', 'neutral']
    # Disengaged emotions (negative indicators)
    disengaged_emotions = ['sad', 'angry', 'fear', 'disgust']
    
    engaged_score = sum(emotions.get(e, 0) for e in engaged_emotions)
    disengaged_score = sum(emotions.get(e, 0) for e in disengaged_emotions)
    
    # Weight neutral slightly less than happy
    if 'neutral' in emotions:
        engaged_score = engaged_score - (emotions['neutral'] * 0.3)
    
    # Calculate final score (0-100)
    engagement_score = max(0, min(100, engaged_score - disengaged_score))
    
    return round(engagement_score, 2)

def determine_engagement_status(engagement_score, dominant_emotion):
    """
    Determine engagement status based on score and dominant emotion.
    """
    if engagement_score >= 70:
        if dominant_emotion in ['happy', 'surprise']:
            return 'highly_engaged'
        else:
            return 'engaged'
    elif engagement_score >= 40:
        if dominant_emotion == 'neutral':
            return 'neutral'
        else:
            return 'partially_engaged'
    elif engagement_score >= 20:
        if dominant_emotion in ['sad', 'fear']:
            return 'confused'
        else:
            return 'distracted'
    else:
        if dominant_emotion in ['sad', 'angry']:
            return 'frustrated'
        else:
            return 'bored'

def generate_engagement_recommendations(status, emotion):
    """
    Generate actionable recommendations based on engagement status.
    """
    recommendations_map = {
        'highly_engaged': [
            "Excellent focus! Keep up the great work!",
            "You're doing fantastic! Stay on track.",
            "Great engagement! Continue with this momentum."
        ],
        'engaged': [
            "Good focus! You're learning well.",
            "Nice work! Keep this concentration going.",
            "You're doing well! Stay focused."
        ],
        'neutral': [
            "Try to stay more engaged with the content.",
            "Consider taking notes to increase engagement.",
            "Stay active in your learning process."
        ],
        'partially_engaged': [
            "Your attention seems to be drifting. Refocus on the material.",
            "Take a deep breath and reconnect with the content.",
            "Consider taking a short break if needed."
        ],
        'confused': [
            "You seem confused. Try rewatching this section.",
            "Don't hesitate to pause and review unclear concepts.",
            "Consider taking notes or looking up additional resources."
        ],
        'distracted': [
            "You appear distracted. Minimize external interruptions.",
            "Remove distractions and refocus on the lecture.",
            "Try to eliminate background noise and focus."
        ],
        'frustrated': [
            "Take a short break if you're feeling frustrated.",
            "It's okay to pause. Come back when you're ready.",
            "Don't give up! Sometimes stepping away helps."
        ],
        'bored': [
            "You seem bored. Try changing your study environment.",
            "Consider taking a 5-minute break to refresh.",
            "Speed up the video or skip to more interesting sections."
        ]
    }
    
    return recommendations_map.get(status, ["Stay focused on your learning goals."])

def extract_youtube_id(url):
    """Extracts YouTube video ID from standard or short URLs."""
    parsed = urllib.parse.urlparse(url)
    if parsed.hostname in ['www.youtube.com', 'youtube.com']:
        q = urllib.parse.parse_qs(parsed.query)
        return q.get('v', [None])[0]
    elif parsed.hostname in ['youtu.be']:
        return parsed.path[1:]
    return None

def get_video_duration(video_id):
    """Get video duration in seconds using yt-dlp"""
    try:
        result = subprocess.run([
            "yt-dlp",
            "--print", "duration",
            f"https://www.youtube.com/watch?v={video_id}"
        ], capture_output=True, text=True, check=True)
        
        duration = float(result.stdout.strip())
        return int(duration)
    except Exception as e:
        print(f"Could not get video duration: {e}")
        return 3600

def get_transcript_with_timestamps(video_id):
    """Get transcript with timestamps."""
    transcript_json_path = TRANSCRIPTS_DIR / f"{video_id}_timestamps.json"
    
    if transcript_json_path.exists():
        with open(transcript_json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
        with open(transcript_json_path, 'w', encoding='utf-8') as f:
            json.dump(transcript_list, f)
        return transcript_list
    except Exception as e:
        print(f"YouTubeTranscriptApi failed: {e}")
        return None

def get_transcript_text(video_id):
    """Get plain text transcript (fallback)"""
    transcript_path = TRANSCRIPTS_DIR / f"{video_id}.txt"
    
    if transcript_path.exists():
        return transcript_path.read_text(encoding="utf-8")

    try:
        subprocess.run([
            "yt-dlp",
            "--write-auto-subs",
            "--sub-lang", "en",
            "--skip-download",
            "-o", str(TRANSCRIPTS_DIR / f"{video_id}"),
            f"https://www.youtube.com/watch?v={video_id}"
        ], check=True, capture_output=True, text=True)

        vtt_files = list(TRANSCRIPTS_DIR.glob(f"{video_id}*.vtt"))
        if vtt_files:
            vtt_file = vtt_files[0]
            lines = vtt_file.read_text(encoding="utf-8").splitlines()
            full_text = " ".join(
                re.sub(r'<[^>]+>', '', line) 
                for line in lines 
                if line.strip() 
                and "-->" not in line 
                and not line.strip().isdigit() 
                and "WEBVTT" not in line
                and not line.startswith("NOTE")
            )
            transcript_path.write_text(full_text, encoding="utf-8")
            vtt_file.unlink()
            return full_text
    except Exception as e:
        print(f"yt-dlp failed: {e}")
    
    raise Exception("Could not fetch transcript")

def generate_course_overview(full_transcript_text, course_title):
    """Generate 2-4 line overview of the entire course."""
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Use first 5000 characters for course overview
        context_text = full_transcript_text[:5000] if len(full_transcript_text) > 5000 else full_transcript_text
        
        prompt = f"""Analyze this video course transcript and provide a 2-4 sentence overview of what concepts and topics are taught.

Course Title: {course_title}

Transcript Sample:
{context_text}

Focus on:
- Main topics covered
- Key skills students will learn
- The learning journey from start to finish

Return only the overview, no extra text."""

        response = model.generate_content(prompt)
        overview = response.text.strip()
        overview = re.sub(r'\n+', ' ', overview)
        overview = re.sub(r'\s+', ' ', overview)
        
        return overview
        
    except Exception as e:
        print(f"Course overview generation failed: {e}")
        return f"A comprehensive {course_title} covering essential concepts and practical skills."

def generate_module_summary(module_text, module_num, start_time, end_time):
    """Generate summary for a specific time segment of the video."""
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Convert seconds to readable time
        start_min = int(start_time / 60)
        end_min = int(end_time / 60)
        
        # Use more text for better context
        context_text = module_text[:4000] if len(module_text) > 4000 else module_text
        
        prompt = f"""Summarize what is taught in this specific segment (minutes {start_min}-{end_min}) of a video course in 3-4 clear sentences.

Focus on:
- What specific topics/concepts are covered in THIS segment
- What the student will learn by watching THIS part
- Any key skills or knowledge gained

Transcript from this time segment:
{context_text}

Return only the summary, no extra text."""

        response = model.generate_content(prompt)
        summary = response.text.strip()
        summary = re.sub(r'\n+', ' ', summary)
        summary = re.sub(r'\s+', ' ', summary)
        
        return summary
        
    except Exception as e:
        print(f"Module summary generation failed: {e}")
        sentences = [s.strip() for s in module_text.split('.') if len(s.strip()) > 30]
        return '. '.join(sentences[:3]) + '.' if sentences else f"Content covering minutes {start_min} to {end_min} of the course."

def extract_key_points(module_text):
    """Extract 5 clear, distinct key points from the transcript."""
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        context_text = module_text[:4000] if len(module_text) > 4000 else module_text
        
        prompt = f"""Extract exactly 5 key learning points from this video transcript segment.
Each point should be:
- A single clear concept or topic
- 10-20 words maximum
- Actionable and specific

Transcript:
{context_text}

Return only a JSON array of strings, no other text:
["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"]"""

        response = model.generate_content(prompt)
        points_text = response.text.strip()
        
        points_text = re.sub(r'^```json?\s*\n?', '', points_text, flags=re.MULTILINE)
        points_text = re.sub(r'\n?```\s*$', '', points_text, flags=re.MULTILINE)
        
        key_points = json.loads(points_text)
        
        if isinstance(key_points, list) and len(key_points) > 0:
            return key_points[:5]
        else:
            raise ValueError("Invalid format")
        
    except Exception as e:
        print(f"Key points extraction failed: {e}")
        sentences = [s.strip() for s in module_text.split('.') if 30 < len(s.strip()) < 150]
        return sentences[:5] if sentences else ["Understanding core concepts", "Practical implementation", "Best practices", "Common pitfalls", "Next steps"]

def split_transcript_with_timestamps(transcript_list, daily_study_minutes, video_duration, course_title):
    """Split transcript into modules with time-based AI summaries."""
    # 85% for video, 15% for quiz (applies to any daily study time)
    VIDEO_TIME_RATIO = 0.85
    QUIZ_TIME_RATIO = 0.15
    
    daily_study_seconds = daily_study_minutes * 60
    video_watch_seconds = int(daily_study_seconds * VIDEO_TIME_RATIO)
    quiz_seconds = int(daily_study_seconds * QUIZ_TIME_RATIO)
    
    # Calculate number of modules based on video watch time
    num_modules = max(1, int(video_duration / video_watch_seconds))
    seconds_per_module = video_duration / num_modules
    
    print(f"  📊 Time allocation per day:")
    print(f"     Total study time: {daily_study_minutes/60:.2f} hours")
    print(f"     Video watching: {video_watch_seconds/3600:.2f} hours (85%)")
    print(f"     Quiz time: {quiz_seconds/3600:.2f} hours (15%)")
    
    # Generate course overview from full transcript
    full_text = " ".join(seg['text'] for seg in transcript_list)
    course_overview = generate_course_overview(full_text, course_title)
    print(f"\n✓ Course Overview: {course_overview[:100]}...")
    
    modules = []
    
    for module_idx in range(num_modules):
        start_time = int(module_idx * seconds_per_module)
        end_time = int(min((module_idx + 1) * seconds_per_module, video_duration))
        
        # Get transcript segments for this time range
        module_segments = [
            seg for seg in transcript_list 
            if start_time <= seg['start'] < end_time
        ]
        
        module_text = " ".join(seg['text'] for seg in module_segments)
        
        print(f"\n  📝 Module {module_idx + 1}: {start_time}s - {end_time}s")
        print(f"     Generating time-based summary...")
        summary = generate_module_summary(module_text, module_idx + 1, start_time, end_time)
        print(f"     ✓ {summary[:80]}...")
        
        print(f"     Extracting key points...")
        key_points = extract_key_points(module_text)
        
        module_num = module_idx + 1
        # Calculate actual time spent on this module
        video_duration_hours = round(video_watch_seconds / 3600, 2)
        quiz_duration_hours = round(quiz_seconds / 3600, 2)
        total_duration_hours = round(daily_study_seconds / 3600, 2)
        
        modules.append({
            "day": module_num,
            "title": f"Module {module_num}",
            "description": summary,
            "duration": video_duration_hours,
            "quizDuration": quiz_duration_hours,
            "totalDuration": total_duration_hours,
            "motivation": "Stay focused!",
            "completed": False,
            "startTime": start_time,
            "endTime": end_time,
            "module": {
                "description": summary,
                "keyPoints": key_points
            },
            "quiz": []
        })
    
    return modules, course_overview

def split_transcript_without_timestamps(transcript_text, daily_study_minutes, video_duration, course_title):
    """Fallback: Split by word count with AI summaries."""
    VIDEO_TIME_RATIO = 0.85
    QUIZ_TIME_RATIO = 0.15
    
    words = transcript_text.split()
    total_words = len(words)
    
    daily_study_seconds = daily_study_minutes * 60
    video_watch_seconds = int(daily_study_seconds * VIDEO_TIME_RATIO)
    quiz_seconds = int(daily_study_seconds * QUIZ_TIME_RATIO)
    
    num_modules = max(1, int(video_duration / video_watch_seconds))
    
    print(f"  📊 Time allocation per day:")
    print(f"     Total study time: {daily_study_minutes/60:.2f} hours")
    print(f"     Video watching: {video_watch_seconds/3600:.2f} hours (85%)")
    print(f"     Quiz time: {quiz_seconds/3600:.2f} hours (15%)")
    
    words_per_module = total_words // num_modules
    seconds_per_module = video_duration // num_modules
    
    # Generate course overview
    course_overview = generate_course_overview(transcript_text, course_title)
    print(f"\n✓ Course Overview: {course_overview[:100]}...")
    
    modules = []
    
    for i in range(num_modules):
        start_word = i * words_per_module
        end_word = min((i + 1) * words_per_module, total_words)
        
        module_text = " ".join(words[start_word:end_word])
        module_num = i + 1
        
        start_time = i * seconds_per_module
        end_time = min((i + 1) * seconds_per_module, video_duration)
        
        print(f"\n  📝 Module {module_num}: {start_time}s - {end_time}s")
        print(f"     Generating time-based summary...")
        summary = generate_module_summary(module_text, module_num, start_time, end_time)
        print(f"     ✓ {summary[:80]}...")
        
        print(f"     Extracting key points...")
        key_points = extract_key_points(module_text)
        
        video_duration_hours = round(video_watch_seconds / 3600, 2)
        quiz_duration_hours = round(quiz_seconds / 3600, 2)
        total_duration_hours = round(daily_study_seconds / 3600, 2)
        
        modules.append({
            "day": module_num,
            "title": f"Module {module_num}",
            "description": summary,
            "duration": video_duration_hours,
            "quizDuration": quiz_duration_hours,
            "totalDuration": total_duration_hours,
            "motivation": "Stay focused!",
            "completed": False,
            "startTime": start_time,
            "endTime": end_time,
            "module": {
                "description": summary,
                "keyPoints": key_points
            },
            "quiz": []
        })
    
    return modules, course_overview

def generate_quiz(module_title, key_points):
    """Generate 5-question quiz using Gemini."""
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        key_points_text = "\n".join(f"- {point}" for point in key_points[:5])
        
        prompt = f"""Create exactly 5 multiple choice questions based on {module_title}.

Key points covered:
{key_points_text}

Return ONLY valid JSON (no markdown):
[
  {{
    "question": "Clear question?",
    "options": {{
      "A": "Option A",
      "B": "Option B",
      "C": "Option C",
      "D": "Option D"
    }},
    "correct_answer": "A"
  }}
]"""

        response = model.generate_content(prompt)
        quiz_text = response.text.strip()
        
        quiz_text = re.sub(r'^```json?\s*\n?', '', quiz_text, flags=re.MULTILINE)
        quiz_text = re.sub(r'\n?```\s*$', '', quiz_text, flags=re.MULTILINE)
        
        quiz = json.loads(quiz_text)
        return quiz[:5] if isinstance(quiz, list) else []
        
    except Exception as e:
        print(f"Quiz generation failed: {e}")
        return [{
            "question": f"What is a key concept from {module_title}?",
            "options": {
                "A": key_points[0] if len(key_points) > 0 else "Concept A",
                "B": key_points[1] if len(key_points) > 1 else "Concept B",
                "C": key_points[2] if len(key_points) > 2 else "Concept C",
                "D": "None of the above"
            },
            "correct_answer": "A"
        }]

# --- Routes ---

@app.route("/generate-plan", methods=["POST", "OPTIONS"])
def generate_plan():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response
        
    try:
        data = request.get_json()
        course_title = data.get("courseTitle", "Course")
        course_link = data.get("courseLink")
        daily_hours = float(data.get("dailyStudyHours", 1))
        
        video_id = extract_youtube_id(course_link)
        if not video_id:
            return jsonify({"error": "Invalid YouTube link"}), 400

        print(f"\n{'='*60}")
        print(f"📚 Processing: {course_title}")
        print(f"🎥 Video ID: {video_id}")
        print(f"⏱️  Daily study time: {daily_hours} hours")
        print(f"   ├─ Video watching: {daily_hours * 0.85:.2f} hours (85%)")
        print(f"   └─ Quiz time: {daily_hours * 0.15:.2f} hours (15%)")
        print(f"{'='*60}\n")
        
        video_duration = get_video_duration(video_id)
        print(f"✓ Video duration: {video_duration}s ({video_duration/60:.1f} minutes)")
        
        transcript_with_timestamps = get_transcript_with_timestamps(video_id)
        
        if transcript_with_timestamps:
            print(f"✓ Got transcript with timestamps: {len(transcript_with_timestamps)} segments")
            daily_plan, course_overview = split_transcript_with_timestamps(
                transcript_with_timestamps, 
                daily_hours * 60,
                video_duration,
                course_title
            )
        else:
            print("⚠ Using word-based splitting")
            transcript_text = get_transcript_text(video_id)
            print(f"✓ Got transcript: {len(transcript_text.split())} words")
            daily_plan, course_overview = split_transcript_without_timestamps(
                transcript_text,
                daily_hours * 60,
                video_duration,
                course_title
            )

        print(f"\n✓ Created {len(daily_plan)} modules\n")

        response_data = {
            "courseTitle": course_title,
            "courseDescription": course_overview,
            "videoID": video_id,
            "dailyPlan": daily_plan,
            "streak": 0,
            "progress": 0
        }
        
        print(f"✅ Plan generated successfully!\n")
        
        response = jsonify(response_data)
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        response = jsonify({"error": str(e)})
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response, 500

@app.route("/generate-quiz", methods=["POST", "OPTIONS"])
def generate_quiz_route():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response
        
    try:
        data = request.get_json()
        module_title = data.get("moduleTitle")
        key_points = data.get("keyPoints", [])
        
        print(f"📝 Generating quiz for: {module_title}")
        quiz = generate_quiz(module_title, key_points)
        print(f"✓ Generated {len(quiz)} questions")
        
        response = jsonify(quiz)
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
        
    except Exception as e:
        print(f"Error: {str(e)}")
        response = jsonify({"error": str(e)})
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response, 500

@app.route("/get-motivation", methods=["POST", "OPTIONS"])
def get_motivation():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response
        
    try:
        data = request.get_json()
        module_title = data.get("moduleTitle")
        course_title = data.get("courseTitle")
        
        message = f"🎉 Excellent work! You've completed {module_title} in {course_title}. Keep building your knowledge!"
        
        response = jsonify({"message": message})
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
        
    except Exception as e:
        response = jsonify({"error": str(e)})
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response, 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "message": "StudyMate API is running"})

@app.route("/detect-faces", methods=["POST", "OPTIONS"])
def detect_faces():
    """
    Endpoint to detect and count faces in an image.
    Used for exam proctoring to ensure only 1 person is present.
    Expects JSON with 'image' field containing base64 encoded image.
    """
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response
    
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                "success": False,
                "error": "No image data provided"
            }), 400
        
        image_data = data.get('image')
        timestamp = data.get('timestamp', None)
        exam_id = data.get('exam_id', None)
        
        # Decode base64 image
        if isinstance(image_data, str):
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            img_bytes = base64.b64decode(image_data)
            img = Image.open(BytesIO(img_bytes))
            img_array = np.array(img)
        else:
            img_array = image_data
        
        # Convert RGB to BGR for OpenCV compatibility
        if len(img_array.shape) == 3 and img_array.shape[2] == 3:
            frame_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        else:
            frame_bgr = img_array
        
        # Detect faces using DeepFace
        try:
            faces = DeepFace.extract_faces(
                frame_bgr,
                detector_backend='opencv',
                enforce_detection=False,
                align=True
            )
            
            face_count = len(faces) if faces else 0
            
            # Determine status
            if face_count == 0:
                status = "no_face"
                message = "No face detected. Please ensure your face is visible and well-lit."
                allowed = False
            elif face_count == 1:
                status = "valid"
                message = "Perfect! Exactly 1 person detected."
                allowed = True
            else:
                status = "multiple_faces"
                message = f"Multiple people detected ({face_count} faces). Please ensure only you are in frame."
                allowed = False
            
            result = {
                "success": True,
                "face_count": face_count,
                "status": status,
                "message": message,
                "allowed": allowed,
                "timestamp": timestamp,
                "exam_id": exam_id
            }
            
            print(f"👤 Face Detection: {face_count} face(s) detected - Status: {status}")
            
            response = jsonify(result)
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response
            
        except Exception as face_error:
            print(f"Face detection error: {str(face_error)}")
            # If detection fails, assume no face detected
            result = {
                "success": True,
                "face_count": 0,
                "status": "no_face",
                "message": "Could not detect faces. Please check camera and lighting.",
                "allowed": False,
                "timestamp": timestamp,
                "exam_id": exam_id
            }
            response = jsonify(result)
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response
        
    except Exception as e:
        print(f"Error in face detection endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        response = jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to process image for face detection"
        })
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response, 500

@app.route("/analyze-mood", methods=["POST", "OPTIONS"])
def analyze_mood():
    """
    Endpoint to analyze learner's mood and engagement from webcam frame.
    Expects JSON with 'image' field containing base64 encoded image.
    """
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response
    
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                "success": False,
                "error": "No image data provided"
            }), 400
        
        image_data = data.get('image')
        timestamp = data.get('timestamp', None)
        
        print(f"📸 Analyzing learner mood at timestamp: {timestamp}")
        
        # Analyze mood
        result = analyze_learner_mood(image_data)
        
        if result.get('success'):
            result['timestamp'] = timestamp
            print(f"✓ Emotion: {result['dominant_emotion']}, Status: {result['engagement_status']}, Score: {result['engagement_score']}")
        else:
            print(f"❌ Analysis failed: {result.get('error')}")
        
        response = jsonify(result)
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
        
    except Exception as e:
        print(f"Error in mood analysis endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        response = jsonify({
            "success": False,
            "error": str(e)
        })
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response, 500

@app.route("/batch-analyze-mood", methods=["POST", "OPTIONS"])
def batch_analyze_mood():
    """
    Endpoint to analyze multiple frames for engagement tracking over time.
    Expects JSON with 'frames' array containing objects with 'image' and 'timestamp'.
    """
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response
    
    try:
        data = request.get_json()
        
        if not data or 'frames' not in data:
            return jsonify({
                "success": False,
                "error": "No frames data provided"
            }), 400
        
        frames = data.get('frames', [])
        
        if not frames:
            return jsonify({
                "success": False,
                "error": "Empty frames array"
            }), 400
        
        print(f"📸 Analyzing {len(frames)} frames for mood tracking")
        
        results = []
        engagement_timeline = []
        
        for idx, frame_data in enumerate(frames):
            image = frame_data.get('image')
            timestamp = frame_data.get('timestamp', idx)
            
            if image:
                analysis = analyze_learner_mood(image)
                if analysis.get('success'):
                    analysis['timestamp'] = timestamp
                    results.append(analysis)
                    engagement_timeline.append({
                        'timestamp': timestamp,
                        'score': analysis['engagement_score'],
                        'status': analysis['engagement_status'],
                        'emotion': analysis['dominant_emotion']
                    })
        
        # Calculate overall statistics
        if results:
            avg_engagement = sum(r['engagement_score'] for r in results) / len(results)
            emotion_counts = {}
            for r in results:
                emotion = r['dominant_emotion']
                emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
            
            most_common_emotion = max(emotion_counts.items(), key=lambda x: x[1])[0]
            
            summary = {
                "success": True,
                "total_frames_analyzed": len(results),
                "average_engagement_score": round(avg_engagement, 2),
                "most_common_emotion": most_common_emotion,
                "emotion_distribution": emotion_counts,
                "engagement_timeline": engagement_timeline,
                "detailed_results": results
            }
        else:
            summary = {
                "success": False,
                "error": "No frames could be analyzed successfully"
            }
        
        print(f"✓ Batch analysis complete: {len(results)} frames processed")
        
        response = jsonify(summary)
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
        
    except Exception as e:
        print(f"Error in batch mood analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        response = jsonify({
            "success": False,
            "error": str(e)
        })
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response, 500

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🎓 StudyMate API Server")
    print("="*60)
    print(f"Gemini Model: {GEMINI_MODEL}")
    print(f"Server: http://127.0.0.1:5000")
    print("="*60 + "\n")
    app.run(debug=True, host='127.0.0.1', port=5000)