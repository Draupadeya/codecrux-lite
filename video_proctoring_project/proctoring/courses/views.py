# courses/views.py
import os
import re
import json
import subprocess
import urllib.parse
import datetime
from pathlib import Path
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from youtube_transcript_api import YouTubeTranscriptApi
import requests
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables!")

print(f"✓ Loaded API Key: {GEMINI_API_KEY[:10]}...")

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
TRANSCRIPTS_DIR = BASE_DIR / "backend" / "transcripts"
TRANSCRIPTS_DIR.mkdir(exist_ok=True)

AUDIO_DIR = BASE_DIR / "backend" / "audio"
AUDIO_DIR.mkdir(exist_ok=True)

FRONTEND_PATH = BASE_DIR / "frontend"

# --- Helper Functions ---

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
        
        context_text = full_transcript_text[:5000] if len(full_transcript_text) > 5000 else full_transcript_text
        
        prompt = f"""Analyze this video course transcript and provide a 2-4 sentence overview of what concepts and topics are taught.

Course Title: {course_title}

Transcript Sample:
{context_text}

Provide ONLY the overview text, no additional formatting or labels."""

        response = model.generate_content(prompt)
        overview = response.text.strip()
        
        return overview
    
    except Exception as e:
        print(f"Error generating course overview: {e}")
        return f"An overview of {course_title}"

def create_segments(video_id, video_duration):
    """Create segments for the entire video."""
    SEGMENT_SIZE = 180
    num_segments = (video_duration + SEGMENT_SIZE - 1) // SEGMENT_SIZE
    
    segments = []
    for i in range(num_segments):
        start_time = i * SEGMENT_SIZE
        end_time = min((i + 1) * SEGMENT_SIZE, video_duration)
        segments.append({
            "index": i + 1,
            "start": start_time,
            "end": end_time
        })
    
    return segments

def get_segment_transcript(transcript_list, start_time, end_time):
    """Extract transcript for a specific segment."""
    if not transcript_list:
        return ""
    
    segment_texts = [
        entry['text'] 
        for entry in transcript_list 
        if start_time <= entry['start'] < end_time
    ]
    
    return " ".join(segment_texts)

def generate_segment_explanation(segment_text, segment_index, course_title):
    """Generate explanation for a segment."""
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        prompt = f"""You are teaching the course: "{course_title}"

Explain this segment (Part {segment_index}) in a clear and concise way:

Transcript:
{segment_text}

Provide a 3-5 sentence explanation covering:
1. What topic is being discussed
2. Key concepts explained
3. Any important examples or points mentioned

Keep it educational and easy to understand."""

        response = model.generate_content(prompt)
        explanation = response.text.strip()
        
        return explanation
    
    except Exception as e:
        print(f"Error generating explanation for segment {segment_index}: {e}")
        return f"Content for segment {segment_index}"

# --- Django Views ---

def courses_portal(request):
    """Entry point for courses portal - serves frontend"""
    try:
        user = request.user.username if request.user.is_authenticated else 'Guest'
        
        print(f"\n✓ User '{user}' accessed courses portal")
        
        # Serve the StudyMate frontend (index.html)
        frontend_file = FRONTEND_PATH / 'index.html'
        if frontend_file.exists():
            with open(frontend_file, 'r', encoding='utf-8') as f:
                content = f.read()
                # Inject user context into the HTML
                content = content.replace(
                    '<script src="script.js"></script>',
                    f'<script>window.djangoUser = "{user}";</script>\n    <script src="script.js"></script>'
                )
            return HttpResponse(content, content_type='text/html')
        else:
            return JsonResponse({"error": "Frontend file not found"}, status=404)
    
    except Exception as e:
        print(f"❌ Error loading courses portal: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)

def serve_css(request):
    """Serve CSS file"""
    css_file = FRONTEND_PATH / 'style.css'
    if css_file.exists():
        with open(css_file, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/css')
    return HttpResponse("", status=404, content_type='text/css')

def serve_js(request):
    """Serve JavaScript file"""
    js_file = FRONTEND_PATH / 'script.js'
    if js_file.exists():
        with open(js_file, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='application/javascript')
    return HttpResponse("", status=404, content_type='application/javascript')

@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def process_video(request):
    """Process YouTube video and create course structure"""
    if request.method == "OPTIONS":
        response = HttpResponse("")
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response
    
    try:
        data = json.loads(request.body)
        url = data.get("url")
        course_title = data.get("courseTitle", "Untitled Course")
        
        if not url:
            return JsonResponse({"error": "Missing URL"}, status=400)
        
        video_id = extract_youtube_id(url)
        if not video_id:
            return JsonResponse({"error": "Invalid YouTube URL"}, status=400)
        
        print(f"\n📹 Processing video: {video_id}")
        print(f"   Title: {course_title}")
        
        # Get video duration
        video_duration = get_video_duration(video_id)
        print(f"   Duration: {video_duration} seconds")
        
        # Get transcript with timestamps
        transcript_list = get_transcript_with_timestamps(video_id)
        
        # Get full transcript text
        if transcript_list:
            full_transcript = " ".join([entry['text'] for entry in transcript_list])
        else:
            full_transcript = get_transcript_text(video_id)
        
        # Generate course overview
        print("   Generating course overview...")
        course_overview = generate_course_overview(full_transcript, course_title)
        
        # Create segments
        segments = create_segments(video_id, video_duration)
        print(f"   Created {len(segments)} segments")
        
        # Generate explanations for each segment
        print("   Generating segment explanations...")
        for segment in segments:
            segment_text = get_segment_transcript(
                transcript_list, 
                segment['start'], 
                segment['end']
            )
            
            if not segment_text and full_transcript:
                chars_per_second = len(full_transcript) / video_duration
                start_char = int(segment['start'] * chars_per_second)
                end_char = int(segment['end'] * chars_per_second)
                segment_text = full_transcript[start_char:end_char]
            
            explanation = generate_segment_explanation(
                segment_text, 
                segment['index'],
                course_title
            )
            
            segment['explanation'] = explanation
            print(f"      Segment {segment['index']}: ✓")
        
        response_data = {
            "success": True,
            "videoId": video_id,
            "courseTitle": course_title,
            "courseOverview": course_overview,
            "duration": video_duration,
            "segments": segments,
            "totalSegments": len(segments)
        }
        
        print(f"✅ Successfully processed: {course_title}\n")
        
        response = JsonResponse(response_data)
        response["Access-Control-Allow-Origin"] = "*"
        return response
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        response = JsonResponse({"error": str(e)}, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response

@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def ask_question(request):
    """Answer questions about course content"""
    if request.method == "OPTIONS":
        response = HttpResponse("")
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response
    
    try:
        data = json.loads(request.body)
        question = data.get("question")
        video_id = data.get("videoId")
        course_title = data.get("courseTitle", "this course")
        current_time = data.get("currentTime", 0)
        
        if not question or not video_id:
            return JsonResponse({"error": "Missing question or videoId"}, status=400)
        
        print(f"\n❓ Question: {question}")
        print(f"   Video: {video_id} at {current_time}s")
        
        # Get transcript
        transcript_list = get_transcript_with_timestamps(video_id)
        
        if transcript_list:
            full_transcript = " ".join([entry['text'] for entry in transcript_list])
        else:
            transcript_path = TRANSCRIPTS_DIR / f"{video_id}.txt"
            if transcript_path.exists():
                full_transcript = transcript_path.read_text(encoding="utf-8")
            else:
                return JsonResponse({"error": "Transcript not found"}, status=404)
        
        # Get context around current time
        if transcript_list:
            context_start = max(0, current_time - 120)
            context_end = current_time + 120
            
            context_entries = [
                entry for entry in transcript_list
                if context_start <= entry['start'] <= context_end
            ]
            
            context_text = " ".join([entry['text'] for entry in context_entries])
        else:
            video_duration = get_video_duration(video_id)
            chars_per_second = len(full_transcript) / video_duration
            context_start = max(0, int((current_time - 120) * chars_per_second))
            context_end = int((current_time + 120) * chars_per_second)
            context_text = full_transcript[context_start:context_end]
        
        # Generate answer using Gemini
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        prompt = f"""You are a helpful tutor for the course: "{course_title}"

Student's Question: {question}

Relevant Course Content (around timestamp {current_time}s):
{context_text}

Provide a clear, concise answer based on the course content. If the answer isn't directly in the provided content, use your knowledge to explain the concept while noting it may not be explicitly covered in this part of the course.

Keep the answer conversational and educational."""

        response = model.generate_content(prompt)
        answer = response.text.strip()
        
        print(f"✅ Generated answer\n")
        
        response_data = {
            "success": True,
            "answer": answer
        }
        
        response = JsonResponse(response_data)
        response["Access-Control-Allow-Origin"] = "*"
        return response
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        response = JsonResponse({"error": str(e)}, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response

@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def transcribe_audio(request):
    """Transcribe audio using AssemblyAI"""
    if request.method == "OPTIONS":
        response = HttpResponse("")
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response
    
    try:
        if not ASSEMBLYAI_API_KEY:
            return JsonResponse({"error": "AssemblyAI API key not configured"}, status=500)
        
        audio_file = request.FILES.get('audio')
        
        if not audio_file:
            return JsonResponse({"error": "No audio file provided"}, status=400)
        
        print("\n🎤 Transcribing audio...")
        
        # Save audio file temporarily
        audio_path = AUDIO_DIR / f"temp_{datetime.datetime.now().timestamp()}.webm"
        with open(audio_path, 'wb') as f:
            for chunk in audio_file.chunks():
                f.write(chunk)
        
        print(f"   Saved audio: {audio_path}")
        
        # Upload to AssemblyAI
        headers = {"authorization": ASSEMBLYAI_API_KEY}
        
        with open(audio_path, 'rb') as f:
            upload_response = requests.post(
                "https://api.assemblyai.com/v2/upload",
                headers=headers,
                files={'file': f}
            )
        
        if upload_response.status_code != 200:
            audio_path.unlink()
            return JsonResponse({"error": "Failed to upload audio"}, status=500)
        
        upload_url = upload_response.json()['upload_url']
        print(f"   Uploaded to AssemblyAI")
        
        # Request transcription
        transcript_response = requests.post(
            "https://api.assemblyai.com/v2/transcript",
            headers=headers,
            json={"audio_url": upload_url}
        )
        
        if transcript_response.status_code != 200:
            audio_path.unlink()
            return JsonResponse({"error": "Failed to request transcription"}, status=500)
        
        transcript_id = transcript_response.json()['id']
        print(f"   Transcription ID: {transcript_id}")
        
        # Poll for completion
        import time
        while True:
            status_response = requests.get(
                f"https://api.assemblyai.com/v2/transcript/{transcript_id}",
                headers=headers
            )
            
            status_data = status_response.json()
            status = status_data['status']
            
            if status == 'completed':
                transcription_text = status_data['text']
                print(f"✅ Transcription complete: {transcription_text[:100]}...\n")
                audio_path.unlink()
                
                response = JsonResponse({
                    "success": True,
                    "text": transcription_text
                })
                response["Access-Control-Allow-Origin"] = "*"
                return response
            
            elif status == 'error':
                audio_path.unlink()
                return JsonResponse({"error": "Transcription failed"}, status=500)
            
            time.sleep(2)
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        response = JsonResponse({"error": str(e)}, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response

def health(request):
    """Health check endpoint"""
    return JsonResponse({
        "status": "healthy",
        "message": "StudyMate API is running (Django Integrated)",
        "timestamp": str(datetime.datetime.now()),
        "integration": "Unified Django Server",
        "port": "8000"
    })
