# Learner Mood & Engagement Analysis

## Overview
This enhancement adds AI-powered mood and engagement analysis to the video proctoring system. It uses DeepFace to analyze facial expressions and determine whether learners are engaged, distracted, bored, or experiencing other emotional states during lectures.

## Features

### 🎯 Key Capabilities
- **Real-time Emotion Detection**: Analyzes 7 emotions (happy, sad, angry, surprise, fear, disgust, neutral)
- **Engagement Scoring**: Calculates engagement scores (0-100) based on emotional state
- **Smart Recommendations**: Provides actionable advice based on learner's current state
- **Batch Analysis**: Process multiple frames for engagement tracking over time
- **Comprehensive Insights**: Includes age and gender estimation for demographic analysis

### 📊 Engagement States
The system categorizes learners into 8 engagement states:

1. **Highly Engaged** (70-100 score + positive emotions)
   - Learner is very focused and interested
   - Showing happiness or surprise

2. **Engaged** (70-100 score)
   - Good focus and attention
   - Actively learning

3. **Neutral** (40-70 score + neutral emotion)
   - Passively watching
   - Neither engaged nor disengaged

4. **Partially Engaged** (40-70 score)
   - Attention is drifting
   - Needs refocusing

5. **Confused** (20-40 score + sad/fear)
   - Struggling with content
   - May need review or help

6. **Distracted** (20-40 score)
   - Not focused on content
   - External interruptions likely

7. **Frustrated** (0-20 score + sad/angry)
   - Experiencing difficulty
   - May need a break

8. **Bored** (0-20 score)
   - Lost interest
   - Content may not be engaging

## API Endpoints

### 1. Single Frame Analysis
```http
POST /analyze-mood
Content-Type: application/json

{
  "image": "base64_encoded_image_data",
  "timestamp": "2025-12-20T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "dominant_emotion": "happy",
  "emotions": {
    "angry": 0.5,
    "disgust": 0.2,
    "fear": 0.8,
    "happy": 85.3,
    "sad": 1.2,
    "surprise": 5.0,
    "neutral": 7.0
  },
  "engagement_score": 82.5,
  "engagement_status": "highly_engaged",
  "recommendations": [
    "Excellent focus! Keep up the great work!",
    "You're doing fantastic! Stay on track.",
    "Great engagement! Continue with this momentum."
  ],
  "age": 24,
  "gender": "Man",
  "timestamp": "2025-12-20T10:30:00Z"
}
```

### 2. Batch Frame Analysis
```http
POST /batch-analyze-mood
Content-Type: application/json

{
  "frames": [
    {
      "image": "base64_encoded_image_data",
      "timestamp": 0
    },
    {
      "image": "base64_encoded_image_data",
      "timestamp": 30
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "total_frames_analyzed": 2,
  "average_engagement_score": 75.5,
  "most_common_emotion": "happy",
  "emotion_distribution": {
    "happy": 1,
    "neutral": 1
  },
  "engagement_timeline": [
    {
      "timestamp": 0,
      "score": 82.5,
      "status": "highly_engaged",
      "emotion": "happy"
    },
    {
      "timestamp": 30,
      "score": 68.5,
      "status": "engaged",
      "emotion": "neutral"
    }
  ],
  "detailed_results": [...]
}
```

## Installation & Setup

### 1. Install Required Packages
```powershell
pip install deepface opencv-python pillow tensorflow
```

### 2. Verify DeepFace Installation
```powershell
python -c "from deepface import DeepFace; print('DeepFace installed successfully')"
```

### 3. Start the Flask Server
```powershell
cd c:\sparkless\video_proctoring_project\proctoring
python app.py
```

The server will start on `http://127.0.0.1:5000`

### 4. Test the Feature
Open `test_mood_analysis.html` in your browser:
```powershell
start test_mood_analysis.html
```

## Usage Examples

### JavaScript Integration
```javascript
// Capture frame from video element
function captureFrame(videoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
}

// Analyze mood
async function analyzeLearnerMood(videoElement) {
    const frameData = captureFrame(videoElement);
    
    const response = await fetch('http://127.0.0.1:5000/analyze-mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            image: frameData,
            timestamp: new Date().toISOString()
        })
    });
    
    const result = await response.json();
    
    if (result.success) {
        console.log('Emotion:', result.dominant_emotion);
        console.log('Engagement:', result.engagement_status);
        console.log('Score:', result.engagement_score);
        console.log('Recommendations:', result.recommendations);
    }
}
```

### Python Integration
```python
import cv2
import base64
import requests

# Capture frame from webcam
cap = cv2.VideoCapture(0)
ret, frame = cap.read()

# Encode frame as base64
_, buffer = cv2.imencode('.jpg', frame)
frame_base64 = base64.b64encode(buffer).decode('utf-8')

# Send to API
response = requests.post('http://127.0.0.1:5000/analyze-mood', json={
    'image': f'data:image/jpeg;base64,{frame_base64}',
    'timestamp': '2025-12-20T10:30:00Z'
})

result = response.json()
print(f"Engagement: {result['engagement_status']}")
print(f"Score: {result['engagement_score']}")
```

## Integration with Existing Proctoring System

### Monitor Student Engagement During Exams
```python
# In monitor/views.py or analyzer.py
from app import analyze_learner_mood

def check_student_engagement(frame):
    """Analyze student engagement during exam"""
    result = analyze_learner_mood(frame)
    
    if result.get('success'):
        engagement_status = result['engagement_status']
        
        # Alert if student seems distracted or bored
        if engagement_status in ['distracted', 'bored', 'frustrated']:
            # Log event or send alert
            print(f"⚠️ Low engagement detected: {engagement_status}")
            
        return result
    return None
```

### Real-time Monitoring Dashboard
You can extend the existing `admin_dashboard.html` to display:
- Real-time engagement scores for all students
- Emotion distribution graphs
- Alerts for disengaged students
- Historical engagement trends

## Configuration

### Adjust Engagement Thresholds
In `app.py`, modify the `determine_engagement_status` function:
```python
def determine_engagement_status(engagement_score, dominant_emotion):
    # Customize these thresholds based on your needs
    if engagement_score >= 70:  # Change from 70 to your desired value
        return 'highly_engaged'
    # ... etc
```

### Customize Recommendations
Edit the `generate_engagement_recommendations` function:
```python
recommendations_map = {
    'bored': [
        "Your custom recommendation here",
        "Another helpful tip",
    ]
}
```

## Performance Considerations

### Frame Rate
- **Single Frame**: ~1-2 seconds per analysis
- **Batch Analysis**: Better for multiple frames
- **Recommended**: Analyze every 5-10 seconds during lectures

### Optimization Tips
1. **Reduce Image Size**: Resize frames to 640x480 before sending
2. **Queue Processing**: Use background workers for batch analysis
3. **Caching**: Cache repeated frames to avoid duplicate processing
4. **GPU Acceleration**: Enable TensorFlow GPU support for faster processing

## Troubleshooting

### Common Issues

**1. "Could not analyze mood" Error**
- Ensure face is visible and well-lit
- Check webcam permissions
- Verify DeepFace is installed correctly

**2. Slow Analysis**
- Reduce image resolution
- Use GPU acceleration if available
- Consider analyzing fewer frames per minute

**3. CORS Errors**
- Verify Flask server is running
- Check CORS headers in app.py
- Try accessing from the same origin

**4. DeepFace Model Download**
- First run will download required models (~100MB)
- Ensure stable internet connection
- Models are cached after first download

## Future Enhancements

- [ ] Multi-face tracking for group sessions
- [ ] Attention heatmaps showing focus areas
- [ ] Integration with Django models for persistent storage
- [ ] Real-time WebSocket notifications
- [ ] Mobile app support
- [ ] Advanced analytics dashboard
- [ ] Exportable engagement reports

## License
This feature is part of the video proctoring project and follows the same license.

## Support
For issues or questions, please refer to the main project documentation or create an issue in the project repository.
