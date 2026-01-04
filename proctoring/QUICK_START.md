# Quick Start Guide - Mood Analysis Feature

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
Open PowerShell and run:
```powershell
cd c:\sparkless\video_proctoring_project\proctoring
pip install deepface opencv-python pillow tensorflow
```

**Note:** First-time setup will download AI models (~100MB). This may take a few minutes.

### Step 2: Start the Flask Server
```powershell
python app.py
```

You should see:
```
✓ Loaded API Key: ...
🎓 StudyMate API Server
Gemini Model: gemini-2.5-flash
Server: http://127.0.0.1:5000
```

### Step 3: Test the Feature (Choose One Method)

#### Option A: Web Interface (Recommended)
1. Open `test_mood_analysis.html` in your browser:
   ```powershell
   start test_mood_analysis.html
   ```

2. Click "Start Webcam" (allow camera access)
3. Click "Analyze Mood" to see results

#### Option B: Python Test Script
In a new PowerShell window:
```powershell
cd c:\sparkless\video_proctoring_project\proctoring
python test_mood_analysis.py
```

This will:
- Check server status
- Capture and analyze a single frame
- Perform batch analysis of multiple frames

## 📊 Understanding the Results

### Engagement Score
- **70-100**: Highly engaged or engaged (good focus)
- **40-69**: Neutral or partially engaged (attention drifting)
- **20-39**: Confused or distracted (needs help)
- **0-19**: Frustrated or bored (take a break)

### Emotions Detected
- **Happy** 😊: Student is enjoying the content
- **Surprise** 😮: Student is interested/intrigued
- **Neutral** 😐: Passive watching
- **Sad** 😢: Student may be confused or struggling
- **Angry** 😠: Student may be frustrated
- **Fear** 😨: Student may be anxious
- **Disgust** 🤢: Student dislikes content

## 🎯 Integration Examples

### Example 1: Periodic Monitoring During Lectures
```javascript
// Check mood every 30 seconds during video playback
setInterval(async () => {
    const frameData = captureFrame(videoElement);
    const response = await fetch('http://127.0.0.1:5000/analyze-mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            image: frameData,
            timestamp: Date.now()
        })
    });
    
    const result = await response.json();
    
    if (result.engagement_status === 'bored' || result.engagement_status === 'distracted') {
        // Show alert or recommendation
        alert(result.recommendations[0]);
    }
}, 30000);
```

### Example 2: Post-Lecture Analytics
```python
# After lecture, analyze engagement patterns
def generate_engagement_report(student_id, video_id):
    # Get all captured frames from database
    frames = get_student_frames(student_id, video_id)
    
    # Batch analyze
    response = requests.post('http://127.0.0.1:5000/batch-analyze-mood', 
                           json={'frames': frames})
    result = response.json()
    
    # Generate report
    print(f"Student: {student_id}")
    print(f"Average Engagement: {result['average_engagement_score']}")
    print(f"Most Common Emotion: {result['most_common_emotion']}")
    
    # Identify low engagement periods
    for entry in result['engagement_timeline']:
        if entry['score'] < 40:
            print(f"Low engagement at {entry['timestamp']}: {entry['status']}")
```

## 🔧 Troubleshooting

### Issue: "Could not access webcam"
**Solution:**
- Check camera permissions in browser settings
- Ensure no other app is using the webcam
- Try refreshing the page

### Issue: "Cannot connect to server"
**Solution:**
- Verify Flask server is running
- Check it's on http://127.0.0.1:5000
- Look for errors in the server console

### Issue: "Analysis is slow"
**Solution:**
- Reduce image resolution before sending
- Enable GPU acceleration (requires CUDA setup)
- Analyze frames less frequently (e.g., every 30-60 seconds)

### Issue: "No face detected"
**Solution:**
- Ensure good lighting
- Face should be clearly visible
- Remove sunglasses/masks
- Position face in center of frame

## 📱 API Endpoints Quick Reference

### Analyze Single Frame
```bash
POST http://127.0.0.1:5000/analyze-mood
Body: {"image": "base64_data", "timestamp": "..."}
```

### Analyze Multiple Frames
```bash
POST http://127.0.0.1:5000/batch-analyze-mood
Body: {"frames": [{"image": "...", "timestamp": 0}, ...]}
```

### Health Check
```bash
GET http://127.0.0.1:5000/health
```

## 🎨 Customization

### Change Engagement Thresholds
Edit `app.py`, find `determine_engagement_status()`:
```python
if engagement_score >= 70:  # Change this value
    if dominant_emotion in ['happy', 'surprise']:
        return 'highly_engaged'
```

### Add Custom Recommendations
Edit `generate_engagement_recommendations()`:
```python
recommendations_map = {
    'bored': [
        "Your custom message here!",
        "Try taking a break!",
    ]
}
```

### Adjust Analysis Frequency
For real-time monitoring, adjust the interval:
```javascript
// Check every 15 seconds instead of 30
setInterval(analyzeMood, 15000);
```

## 📚 Next Steps

1. **Integrate with Django**: Store mood analysis results in database
2. **Dashboard**: Create admin dashboard to view all students' engagement
3. **Alerts**: Send notifications for consistently low engagement
4. **Reports**: Generate PDF reports with engagement analytics
5. **Real-time**: Use WebSockets for live monitoring

## 🆘 Need Help?

- Check the full documentation: `MOOD_ANALYSIS_README.md`
- Review the test files for examples
- Check Flask server console for error messages
- Verify all dependencies are installed: `pip list | grep -E "deepface|opencv|tensorflow"`

## ✨ Features Summary

✅ Real-time emotion detection (7 emotions)
✅ Engagement scoring (0-100 scale)
✅ 8 engagement states (from highly engaged to bored)
✅ Actionable recommendations
✅ Batch processing for historical analysis
✅ Age and gender estimation
✅ Easy-to-use REST API
✅ CORS-enabled for web integration
✅ Comprehensive error handling

---

**Ready to enhance your learning analytics? Start the server and test it now!** 🚀
