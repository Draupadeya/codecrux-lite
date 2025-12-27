# 🚀 How to Start StudyMate Properly

## ⚠️ IMPORTANT: Camera requires a local server!

**DO NOT** just double-click `index.html` - the camera won't work!

## ✅ Method 1: Using Python (Recommended)

Open PowerShell in the `frontend` folder and run:

```powershell
# If you have Python 3
python -m http.server 8080

# OR if the above doesn't work, try:
py -m http.server 8080
```

Then open in browser:
```
http://localhost:8080/index.html
```

## ✅ Method 2: Using VS Code Live Server Extension

1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## ✅ Method 3: Using Node.js

```powershell
# Install http-server globally (one time)
npm install -g http-server

# Start server in frontend folder
http-server -p 8080
```

Then open: `http://localhost:8080/index.html`

## 🎥 Testing Camera Access

1. **Start the server** using one of the methods above
2. Open `http://localhost:8080/camera_test.html` first to test camera
3. If camera works there, then open `http://localhost:8080/index.html`
4. Open a course and click "Watch Video"
5. **Look for the permission popup** in your browser
6. Click **"Allow"** when prompted
7. The camera preview should appear on the right side

## 🔍 Troubleshooting

### Black screen or "Camera initializing..."
1. **Press F12** to open browser console
2. Look for red error messages
3. Common issues:
   - Not using localhost (opened file directly)
   - Camera blocked in browser settings
   - Another app using the camera
   - No camera connected

### No permission popup
1. Click the **camera icon** in address bar
2. Set permission to "Allow"
3. Refresh the page

### "Permission denied" error
1. Go to browser settings
2. Find Privacy & Security → Camera
3. Add `http://localhost:8080` to allowed sites
4. Refresh the page

## 🎯 Quick Test

Before running StudyMate, test if your server is working:

1. Start server: `python -m http.server 8080`
2. Open browser console (F12)
3. Type: `console.log(window.location.href)`
4. You should see: `http://localhost:8080/...`
5. If you see `file:///...` - **you need to start a server!**
