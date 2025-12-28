# SparkLess - Complete Actions Reference Guide

## 📚 Table of Contents
1. [System Overview](#system-overview)
2. [Quick Start](#quick-start)
3. [All Available Actions/Endpoints](#all-available-actions-endpoints)
4. [Backend Server Actions (Flask)](#backend-server-actions-flask)
5. [Video Proctoring Actions](#video-proctoring-actions)
6. [Frontend Actions](#frontend-actions)
7. [File Structure](#file-structure)
8. [Testing Procedures](#testing-procedures)
9. [Documentation Index](#documentation-index)

---

## System Overview

**SparkLess** is an AI-powered learning platform that combines:
- **StudyMate**: AI-powered course planning from YouTube videos
- **Proctoring System**: Advanced face detection and exam monitoring
- **Django-Flask Integration**: Unified authentication and course access

### Key Technologies
- **Backend**: Flask + Django
- **AI/ML**: Google Gemini API, DeepFace, OpenCV
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **APIs**: YouTube Transcript API, AssemblyAI

---

## Quick Start

### 1. Install Dependencies
```powershell
# Backend (StudyMate)
cd c:\sparkless\backend
pip install -r requirements.txt

# Video Proctoring
cd c:\sparkless\video_proctoring_project\proctoring
pip install -r requirements.txt
```

### 2. Start Both Servers
```powershell
# Terminal 1: Django (Port 8000)
cd c:\sparkless\video_proctoring_project\proctoring
python manage.py runserver 8000

# Terminal 2: Flask (Port 5000)
cd c:\sparkless\backend
python app.py
```

### 3. Access the Application
- **Main Entry**: http://localhost:8000/
- **Courses Portal**: http://localhost:5000/courses
- **Health Check**: http://localhost:5000/health

---

## All Available Actions/Endpoints

### Backend Server Actions (Flask - Port 5000)

#### 1. **Course Generation Actions**

##### `/generate-plan` (POST)
**Purpose**: Generate a personalized study plan from a YouTube video

**Action**: Analyzes YouTube video transcript and creates daily learning modules

**Request**:
```json
{
  "courseTitle": "Python Full Course",
  "courseLink": "https://www.youtube.com/watch?v=xyz123",
  "dailyStudyHours": 2
}
```

**Response**:
```json
{
  "courseTitle": "Python Full Course",
  "courseDescription": "AI-generated course overview...",
  "videoID": "xyz123",
  "dailyPlan": [
    {
      "day": 1,
      "title": "Module 1",
      "description": "Introduction to Python fundamentals...",
      "duration": 1.7,
      "quizDuration": 0.3,
      "totalDuration": 2.0,
      "startTime": 0,
      "endTime": 3600,
      "module": {
        "description": "Summary...",
        "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"]
      },
      "quiz": [],
      "completed": false
    }
  ],
  "streak": 0,
  "progress": 0
}
```

**What It Does**:
- Extracts YouTube video ID from URL
- Fetches video transcript with timestamps
- Splits content into daily modules (85% video, 15% quiz time)
- Generates AI summaries for each module
- Extracts 5 key learning points per module
- Creates personalized study schedule

---

##### `/generate-quiz` (POST)
**Purpose**: Generate quiz questions for a specific module

**Action**: Uses AI to create 5 multiple-choice questions based on module content

**Request**:
```json
{
  "moduleTitle": "Module 1: Python Basics",
  "keyPoints": [
    "Variables and data types",
    "Control flow structures",
    "Functions and scope",
    "Lists and dictionaries",
    "Error handling"
  ]
}
```

**Response**:
```json
[
  {
    "question": "What is the correct way to declare a variable in Python?",
    "options": {
      "A": "var x = 5",
      "B": "x = 5",
      "C": "int x = 5",
      "D": "declare x = 5"
    },
    "correct_answer": "B"
  }
]
```

**What It Does**:
- Analyzes module key points
- Generates contextual quiz questions
- Returns 5 multiple-choice questions
- Includes correct answers for validation

---

##### `/get-motivation` (POST)
**Purpose**: Get motivational message after module completion

**Action**: Generates encouraging feedback for completed modules

**Request**:
```json
{
  "moduleTitle": "Module 1",
  "courseTitle": "Python Full Course"
}
```

**Response**:
```json
{
  "message": "🎉 Excellent work! You've completed Module 1 in Python Full Course. Keep building your knowledge!"
}
```

---

#### 2. **Document Generation Actions**

##### `/generate-notes-doc` (POST)
**Purpose**: Generate downloadable study notes in .docx format

**Action**: Creates formatted Word document with module summary and key points

**Request**:
```json
{
  "moduleTitle": "Module 1: Introduction",
  "summary": "This module covers...",
  "keyPoints": ["Point 1", "Point 2", "Point 3"]
}
```

**Response**:
```json
{
  "file_blob": "504b0304...",  // Hex-encoded .docx file
  "file_name": "Module_1_Introduction.docx"
}
```

**What It Does**:
- Creates professional Word document
- Includes module title, summary, and key points
- Returns as downloadable blob
- Fallback to .txt if python-docx unavailable

---

#### 3. **Practice Challenge Actions**

##### `/generate-challenge` (POST)
**Purpose**: Create coding challenges for hands-on practice

**Action**: Generates web development exercises with HTML/CSS/JS

**Request**:
```json
{
  "moduleTitle": "Module 2: Web Basics",
  "keyPoints": ["HTML structure", "CSS styling", "JS events"]
}
```

**Response**:
```json
{
  "type": "web",
  "title": "Build a Mini Page: Module 2",
  "question": "Create a simple web page with heading, button, and alert...",
  "starting_code": {
    "html": "<h1>Your Title</h1>\n<button id=\"actionBtn\">Click Me</button>",
    "css": "body { font-family: sans-serif; padding: 1rem; }",
    "js": "document.getElementById('actionBtn').addEventListener('click', () => alert('Hello!'));"
  },
  "solution": { /* Same structure */ }
}
```

**What It Does**:
- Creates interactive coding exercises
- Provides starting code templates
- Includes solution for validation
- Supports HTML, CSS, and JavaScript

---

##### `/get-hint` (POST)
**Purpose**: Provide intelligent hints for coding challenges

**Action**: Analyzes user code and suggests improvements

**Request**:
```json
{
  "challenge_question": "Create a web page...",
  "user_code": {
    "html": "<div>Test</div>",
    "css": "",
    "js": ""
  },
  "solution": { /* Reference solution */ },
  "try_count": 2
}
```

**Response**:
```json
{
  "hint": "Add a main heading using <h1>. Include a <button> element. Set a readable font in CSS."
}
```

**What It Does**:
- Compares user code with solution
- Identifies missing elements
- Provides progressive hints
- Encourages best practices

---

#### 4. **Face Detection & Attention Monitoring Actions**

##### `/analyze-face` (POST)
**Purpose**: Analyze webcam frame for student attention and engagement

**Action**: Detects face, attention level, distractions, and potential cheating

**Request**:
```json
{
  "frame": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response**:
```json
{
  "face_present": true,
  "multiple_faces": false,
  "phone_detected": false,
  "phone_candidates": 0,
  "attention_score": 0.875,
  "distracted": false,
  "bored": false,
  "metrics": {
    "center_offset": 0.123,
    "blur_var": 245.67,
    "brightness": 128.5,
    "faces_count": 1,
    "phone_boxes": [],
    "frame_size": [640, 480]
  }
}
```

**What It Does**:
- Detects face presence using Haar cascades
- Calculates attention score (0-1)
- Detects multiple faces (cheating indicator)
- Identifies phone-like objects
- Measures boredom through motion analysis
- Provides detailed metrics for logging

**Key Metrics Explained**:
- `face_present`: Boolean - Is student's face visible?
- `attention_score`: 0-1 - How centered and focused is the student?
- `distracted`: Boolean - Is student looking away?
- `bored`: Boolean - Is student still with low visual activity?
- `phone_detected`: Boolean - Potential phone in frame?
- `multiple_faces`: Boolean - More than one person detected?

---

#### 5. **Integration Actions**

##### `/courses` (GET)
**Purpose**: Entry point for Django-redirected students

**Action**: Serves StudyMate frontend with user context from Django

**Query Parameters**:
- `user`: Username from Django authentication
- `session_id`: Django session ID for continuity

**Response**: HTML page with injected user context

**What It Does**:
- Receives user info from Django
- Stores session data
- Injects user context into frontend
- Serves StudyMate course portal
- Maintains session across platforms

**Example URL**:
```
http://localhost:5000/courses?user=john_doe&session_id=abc123xyz
```

---

##### `/health` (GET)
**Purpose**: Health check and system status

**Action**: Returns server status and configuration info

**Response**:
```json
{
  "status": "healthy",
  "message": "StudyMate API is running",
  "timestamp": "2025-12-27 10:30:45",
  "integration": "Django @ http://localhost:8000",
  "cors": "Enabled for all origins"
}
```

---

##### `/` (GET)
**Purpose**: Root endpoint - serves home page

**Action**: Redirects to courses or shows API info

**What It Does**:
- Checks for Django session
- Serves index.html if available
- Returns API info if direct access

---

### Video Proctoring Actions (Flask - App.py)

#### 6. **Advanced Face Analysis Actions**

##### `/detect-faces` (POST)
**Purpose**: Advanced face detection with DeepFace

**Action**: Deep learning-based face analysis for proctoring

**Request**:
```json
{
  "frame": "data:image/jpeg;base64,..."
}
```

**Response**:
```json
{
  "faces_detected": 1,
  "face_regions": [
    {
      "x": 120,
      "y": 80,
      "w": 200,
      "h": 200,
      "confidence": 0.95
    }
  ],
  "status": "success"
}
```

**What It Does**:
- Uses DeepFace for accurate detection
- Provides face coordinates
- Returns confidence scores
- Supports multiple detection backends

---

##### `/analyze-mood` (POST)
**Purpose**: Deep emotion and engagement analysis

**Action**: Analyzes emotions, age, gender, and engagement from webcam

**Request**:
```json
{
  "frame": "data:image/jpeg;base64,..."
}
```

**Response**:
```json
{
  "dominant_emotion": "happy",
  "emotions": {
    "angry": 0.02,
    "disgust": 0.01,
    "fear": 0.03,
    "happy": 0.78,
    "sad": 0.05,
    "surprise": 0.06,
    "neutral": 0.05
  },
  "engagement_score": 0.82,
  "engagement_status": "highly_engaged",
  "age": 24,
  "gender": "Man",
  "recommendations": [
    "Great engagement! Keep up the excellent focus.",
    "Your positive emotions enhance learning."
  ],
  "timestamp": "2025-12-27T10:30:45"
}
```

**What It Does**:
- Analyzes 7 emotion categories
- Estimates age and gender
- Calculates engagement score
- Provides learning recommendations
- Timestamps each analysis

**Engagement Levels**:
- `highly_engaged` (0.7-1.0): Happy, surprised
- `moderately_engaged` (0.4-0.7): Neutral
- `low_engagement` (0-0.4): Sad, angry, fearful

---

##### `/batch-analyze-mood` (POST)
**Purpose**: Analyze multiple frames for trend analysis

**Action**: Batch processing of mood analysis for reporting

**Request**:
```json
{
  "frames": [
    "data:image/jpeg;base64,...",
    "data:image/jpeg;base64,...",
    "data:image/jpeg;base64,..."
  ]
}
```

**Response**:
```json
{
  "total_frames": 3,
  "successful_analyses": 3,
  "failed_analyses": 0,
  "results": [ /* Array of individual mood analyses */ ],
  "summary": {
    "average_engagement": 0.78,
    "dominant_emotions": ["happy", "neutral", "happy"],
    "overall_mood": "positive"
  }
}
```

**What It Does**:
- Processes multiple frames efficiently
- Calculates average engagement
- Identifies emotional trends
- Useful for session summaries

---

### Frontend Actions (User Interface)

#### 7. **User Interface Actions**

##### Course Creation
- **Action**: Add new YouTube course
- **Trigger**: Click "Add Course" button
- **Input**: Course title, YouTube URL, daily study hours
- **Result**: Generates AI-powered study plan

##### Module Viewing
- **Action**: View module details
- **Trigger**: Click on module card
- **Display**: Summary, key points, start/end times
- **Options**: Start video, take quiz, download notes

##### Video Playback
- **Action**: Watch course video segment
- **Trigger**: Click "Start Video"
- **Features**: Embedded YouTube player with time ranges
- **Tracking**: Progress monitoring, time spent

##### Quiz Taking
- **Action**: Take module quiz
- **Trigger**: Click "Take Quiz" after video
- **Features**: 5 MCQ questions, instant feedback
- **Scoring**: Real-time score calculation

##### Note Download
- **Action**: Download study notes
- **Trigger**: Click "Download Notes"
- **Format**: .docx with summary and key points
- **Content**: Module-specific formatted notes

##### Practice Challenges
- **Action**: Complete coding exercises
- **Trigger**: Click "Practice Challenge"
- **Features**: Live code editor (HTML/CSS/JS)
- **Help**: AI-powered hints system

##### Face Detection Testing
- **Action**: Test webcam and face detection
- **Page**: `test_face_analysis.html`
- **Features**: Live preview, emotion display, engagement metrics
- **Output**: Real-time attention monitoring

##### Camera Testing
- **Action**: Test camera functionality
- **Page**: `camera_test.html`
- **Features**: Camera selection, resolution test
- **Purpose**: Proctoring setup verification

---

## File Structure

```
c:\sparkless\
│
├── backend/                      # Flask Backend (StudyMate)
│   ├── app.py                   # Main Flask server
│   ├── requirements.txt         # Python dependencies
│   ├── transcripts/             # Cached video transcripts
│   └── audio/                   # Audio processing files
│
├── frontend/                     # Frontend UI
│   ├── index.html               # Main course portal
│   ├── script.js                # Frontend logic
│   ├── style.css                # Styling
│   ├── camera_test.html         # Camera testing page
│   └── test_face_analysis.html  # Face detection testing
│
├── video_proctoring_project/    # Django + Proctoring
│   └── proctoring/
│       ├── app.py               # Flask proctoring server
│       ├── manage.py            # Django management
│       └── requirements.txt     # Dependencies
│
├── docs/                         # Comprehensive Documentation
│   ├── START_HERE.md            # Quick start guide
│   ├── EXECUTIVE_SUMMARY.md     # Project overview
│   ├── FACE_DETECTION_*.md      # Face detection docs
│   ├── EXAM_FLOW_*.md           # Exam system docs
│   └── [50+ documentation files]
│
└── README.md                     # Main project README
```

---

## Testing Procedures

### 1. Course Generation Testing
```powershell
# Test endpoint
curl -X POST http://localhost:5000/generate-plan \
  -H "Content-Type: application/json" \
  -d '{
    "courseTitle": "Test Course",
    "courseLink": "https://www.youtube.com/watch?v=xyz",
    "dailyStudyHours": 2
  }'
```

**Expected**: JSON with course plan and modules

---

### 2. Face Detection Testing
```powershell
# Open test page
start http://localhost:5000/../frontend/test_face_analysis.html
```

**Test Steps**:
1. Allow camera access
2. Position face in frame
3. Verify detection overlay
4. Check emotion display
5. Monitor engagement score

**Expected Results**:
- ✅ Face detected with bounding box
- ✅ Emotions displayed in real-time
- ✅ Engagement score updates
- ✅ Alerts for distractions

---

### 3. Django-Flask Integration Testing
```powershell
# 1. Login to Django
start http://localhost:8000/

# 2. Click "Go To Course"
# Should redirect to: http://localhost:5000/courses?user=USERNAME&session_id=...

# 3. Verify course portal loads
```

**Expected**: User context passed, courses accessible

---

### 4. Quiz Generation Testing
1. Create a course
2. Navigate to any module
3. Click "Take Quiz"
4. Verify 5 questions load
5. Answer questions
6. Check score calculation

**Expected**: AI-generated contextual questions

---

### 5. Camera & Proctoring Testing
```powershell
# Test camera functionality
start http://localhost:5000/../frontend/camera_test.html
```

**Test Checklist**:
- [ ] Camera selection works
- [ ] Live preview displays
- [ ] Face detection activates
- [ ] Multiple face detection works
- [ ] Phone detection triggers
- [ ] Attention score accurate
- [ ] Distraction alerts appear

---

## API Response Codes

### Success Codes
- `200 OK`: Request successful
- `201 Created`: Resource created

### Error Codes
- `400 Bad Request`: Invalid input data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

### CORS Headers
All endpoints include CORS headers for cross-origin access:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

---

## Environment Variables

Required environment variables (create `.env` file):

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# AssemblyAI (optional)
ASSEMBLYAI_API_KEY=your_assemblyai_key_here

# Flask Security
SECRET_KEY=your-secret-key-change-in-production
```

---

## Documentation Index

### Quick Start Guides
- [START_HERE.md](docs/START_HERE.md) - Begin here
- [QUICK_START_SPLIT_SCREEN.md](docs/QUICK_START_SPLIT_SCREEN.md) - UI guide
- [COMMAND_REFERENCE.md](docs/COMMAND_REFERENCE.md) - All commands

### Feature Documentation
- [FACE_DETECTION_START_HERE.md](docs/FACE_DETECTION_START_HERE.md) - Face detection
- [PROCTORING_FEATURES_SUMMARY.md](docs/PROCTORING_FEATURES_SUMMARY.md) - Proctoring features
- [EXAM_FLOW_SYSTEM.md](docs/EXAM_FLOW_SYSTEM.md) - Exam workflow

### Implementation Guides
- [FACE_DETECTION_IMPLEMENTATION.md](docs/FACE_DETECTION_IMPLEMENTATION.md) - How it works
- [SPLIT_SCREEN_UI_IMPLEMENTATION.md](docs/SPLIT_SCREEN_UI_IMPLEMENTATION.md) - UI details
- [ARCHITECTURE_DIAGRAM.md](docs/ARCHITECTURE_DIAGRAM.md) - System architecture

### Testing & Verification
- [COMPREHENSIVE_TESTING_GUIDE.md](docs/COMPREHENSIVE_TESTING_GUIDE.md) - Full testing
- [FACE_DETECTION_TESTING_GUIDE.md](docs/FACE_DETECTION_TESTING_GUIDE.md) - Face tests
- [TESTING_AND_VERIFICATION.md](docs/TESTING_AND_VERIFICATION.md) - General testing

### Deployment
- [DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) - Pre-deployment
- [READY_TO_DEPLOY.md](docs/READY_TO_DEPLOY.md) - Deploy status
- [FINAL_CHECKLIST.md](docs/FINAL_CHECKLIST.md) - Final checks

### Status & Summaries
- [EXECUTIVE_SUMMARY.md](docs/EXECUTIVE_SUMMARY.md) - Project overview
- [COMPLETE_DELIVERY_SUMMARY.md](docs/COMPLETE_DELIVERY_SUMMARY.md) - What's delivered
- [FINAL_STATUS_REPORT.md](docs/FINAL_STATUS_REPORT.md) - Current status

---

## Common Actions Quick Reference

| Action | Method | Endpoint | Purpose |
|--------|--------|----------|---------|
| Create Course Plan | POST | `/generate-plan` | Generate study plan from YouTube |
| Generate Quiz | POST | `/generate-quiz` | Create quiz questions |
| Analyze Face | POST | `/analyze-face` | Check attention/distractions |
| Analyze Mood | POST | `/analyze-mood` | Deep emotion analysis |
| Download Notes | POST | `/generate-notes-doc` | Get .docx notes |
| Get Challenge | POST | `/generate-challenge` | Practice coding exercise |
| Get Hint | POST | `/get-hint` | AI coding help |
| Access Courses | GET | `/courses` | Course portal (from Django) |
| Health Check | GET | `/health` | Server status |

---

## Troubleshooting

### Issue: CORS Errors
**Solution**: Verify both servers are running on correct ports (8000 & 5000)

### Issue: Face Detection Not Working
**Solution**: 
1. Check camera permissions in browser
2. Verify OpenCV and DeepFace installed
3. Test with `camera_test.html`

### Issue: Quiz Not Generating
**Solution**: 
1. Verify GEMINI_API_KEY in `.env`
2. Check API quota limits
3. Review console logs for errors

### Issue: Course Plan Fails
**Solution**: 
1. Verify YouTube URL is valid and public
2. Check video has English captions
3. Ensure yt-dlp is installed

---

## Support & Resources

### Error Logs
- Flask logs: Console output where `app.py` runs
- Django logs: Console output where `manage.py runserver` runs

### API Documentation
- Gemini API: https://ai.google.dev/docs
- DeepFace: https://github.com/serengil/deepface
- YouTube Transcript API: https://pypi.org/project/youtube-transcript-api/

---

## Version Information

- **Project**: SparkLess v1.0
- **Last Updated**: December 27, 2025
- **Python**: 3.8+
- **Flask**: 2.x
- **Django**: 3.x+

---

## Contributors & Maintainers

For questions or issues, refer to the comprehensive documentation in the `/docs` folder.

**Key Documentation Files**: 50+ markdown files covering all aspects of the system.

---

*This document provides a complete reference of all actions available in the SparkLess system. For specific implementation details, refer to the documentation index above.*
