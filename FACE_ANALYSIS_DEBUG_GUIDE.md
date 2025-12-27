# 🔧 StudyMate Face Analysis - Complete Debug Guide

## ✅ What I Fixed

I've improved the face analysis with:
1. **Better error messages** - Tells you exactly what went wrong
2. **More debugging logs** - Console shows detailed information
3. **Improved video setup** - Ensures webcam is properly initialized
4. **Error handling** - Catches issues before they crash

---

## 🚀 Quick Test Steps

### Step 1: Start Flask Server
```powershell
cd c:\sparkless\backend
python app.py
```

**Verify output shows:**
```
🎓 StudyMate API Server
Server: http://127.0.0.1:5000
```

### Step 2: Use Debug Test Page (RECOMMENDED)
Open in browser:
```
c:\sparkless\frontend\test_face_analysis.html
```

This page lets you:
- ✅ Check if Flask server is running
- ✅ Test webcam independently
- ✅ Test face analysis API directly
- ✅ See detailed error messages

**Steps in test page:**
1. Click "Check Flask Server"
2. Click "Start Webcam"
3. Click "Send Frame to API"
4. See detailed results!

### Step 3: Test in Main StudyMate App
1. Open browser: `http://127.0.0.1:5000/`
2. Add a course (any YouTube URL)
3. Click on course card
4. Click "▶ Watch Video" button
5. **Allow camera permission when prompted**
6. Look for attention badge below video

---

## 🐛 Debugging with Console

Open Developer Console: **F12** or **Right-click → Inspect → Console tab**

### Expected Logs When Starting Video

```
🎥 Starting attention tracking...
Current URL: http://127.0.0.1:5000/
✓ Attention badge elements found
Requesting camera permission...
✓ Camera stream obtained
Waiting for video to load...
✓ Video metadata loaded
  - Video size: 640x480
Starting video playback...
✓ Video playing
Setting up analysis intervals...
✅ Attention tracking started successfully!
  - Frames will be sent to server every 2 seconds
  - Check your webcam indicator to verify video is being captured
```

### Expected Logs Every 2 Seconds

```
Face analysis result: {
  face_present: true,
  attention_score: 0.856,
  distracted: false,
  bored: false,
  ...
}
Attention status updated: ✅ Attentive (86%)
```

### Error Examples and Solutions

#### Error: "Attention badge elements not found in DOM!"
**Cause**: HTML elements missing
**Solution**: Check that index.html has:
```html
<div id="attention-status" class="attention-badge hidden">
    <span id="attention-text">Analyzing attention...</span>
</div>
```

#### Error: "Camera permission denied"
**Cause**: Browser permission not granted
**Solution**: 
1. Click "Allow" when permission prompt appears
2. Or check Settings → Camera → Allow StudyMate

#### Error: "API error 404"
**Cause**: Flask server not running
**Solution**:
```powershell
cd c:\sparkless\backend
python app.py
```

#### Error: "Video loading timeout"
**Cause**: Webcam failed to initialize
**Solution**:
1. Check camera is not in use by other apps
2. Restart browser
3. Check camera permissions

---

## 📋 Checklist to Get It Working

- [ ] **Flask Server Running**
  ```powershell
  cd c:\sparkless\backend
  python app.py
  # Should show: Server: http://127.0.0.1:5000
  ```

- [ ] **Browser Can Access Server**
  Open: `http://127.0.0.1:5000/`
  Should show StudyMate app

- [ ] **Camera Permission Allowed**
  Click "Allow" when browser asks for camera

- [ ] **Open Browser Console** (F12)
  Look for logs starting with 🎥

- [ ] **Add Course and Click Watch Video**
  Should see logs and attention badge

---

## 🔍 What Happens Step-by-Step

### When You Click "▶ Watch Video"

```javascript
showVideoPlayer()
  ↓
Load notes
  ↓
startAttentionTracking()
  ↓
Create hidden video element
  ↓
Request camera: getUserMedia()
  ↓
User clicks "Allow" (if prompted)
  ↓
Append video to DOM
  ↓
Wait for video metadata to load
  ↓
Play video
  ↓
Start capturing frames every 2 seconds
  ↓
Send to /analyze-face API
  ↓
Update attention badge on screen
```

---

## 🎯 File Locations

| File | Purpose | Status |
|------|---------|--------|
| `backend/app.py` | Flask server + API | ✅ Working |
| `frontend/index.html` | Main UI + badge HTML | ✅ Working |
| `frontend/script.js` | Face tracking logic | ✅ Fixed |
| `frontend/style.css` | Badge styling | ✅ Working |
| `frontend/test_face_analysis.html` | Debug test page | ✅ New |

---

## 🧪 Test with curl (Optional)

Test the API directly without UI:

```powershell
# Create a test script in PowerShell
$api = "http://127.0.0.1:5000"

# Check if server is running
curl.exe "$api/health"

# Should respond with:
# {"status":"healthy","message":"StudyMate API is running"}
```

---

## ❓ Still Not Working?

### Run the Debug Test Page First!

Open: `c:\sparkless\frontend\test_face_analysis.html`

This will tell you:
1. Is Flask server running? ✅ / ❌
2. Is webcam working? ✅ / ❌
3. Can it reach the API? ✅ / ❌
4. What's the exact error? (Shows full details)

---

## 📝 Files Changed

### `frontend/script.js`
- **Lines 202-221**: Added error handling to showVideoPlayer()
- **Lines 1167-1258**: Completely rewrote startAttentionTracking() with:
  - Detailed console logging
  - Error messages
  - Video validation
  - Timeout handling
  - Permission checking
  
---

## ⚡ Performance Tips

### If face analysis is slow:
1. Check browser console for warnings
2. Ensure good lighting (helps face detection)
3. Make sure face is centered and visible
4. Try moving closer to camera

### If badge updates slowly:
1. It updates every 2 seconds (by design)
2. First update happens 1.5 seconds after video starts
3. If it's longer, check console for errors

---

## 🎉 Success Signs

When face analysis is working, you should see:
1. ✅ Console logs starting with 🎥
2. ✅ "Attention tracking started successfully" message
3. ✅ Colored badge below video player
4. ✅ Badge updates every 2 seconds
5. ✅ Webcam indicator light on your camera

---

## 🚨 If Nothing Works

1. **Open test page first**: `test_face_analysis.html`
   - This tells you exactly what's broken

2. **Check Flask is running**:
   ```powershell
   cd c:\sparkless\backend
   python app.py
   ```

3. **Check camera works**:
   - Open Photos or Skype to test camera
   - Grant permission when asked

4. **Open browser console** (F12)
   - Look for red error messages
   - Copy them and share for help

5. **Check URL is correct**:
   - Should be: `http://127.0.0.1:5000/`
   - NOT: `http://localhost:5000/`
   - NOT: `https://` (no S)

---

## 📞 Quick Support

**Issue**: "Please allow webcam access" alert
- **Solution**: Click "Allow" on browser permission prompt

**Issue**: Badge never appears
- **Solution**: Check console (F12) for errors, use test page

**Issue**: "Cannot connect to server"
- **Solution**: Make sure Flask server is running

**Issue**: Webcam not working
- **Solution**: Check other apps aren't using it, restart browser

---

**Last Updated**: December 20, 2025
**Files Modified**: `frontend/script.js`, `frontend/test_face_analysis.html`
**Status**: ✅ Ready for Testing
