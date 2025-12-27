# 🎓 Sparkless - Unified Exam & Course Management System

## ✅ Server Unification Complete!

This project now runs **both** the Exam Proctoring System and StudyMate Courses on a **single unified Django server**.

---

## 🚀 Quick Start

```powershell
cd C:\sparkless\video_proctoring_project\proctoring
python manage.py runserver
```

**Access at:** `http://localhost:8000/`

---

## 🎯 Features

### **📝 Exam Proctoring System**
- Real-time webcam monitoring
- Face detection with TensorFlow
- Advanced proctoring features:
  - Mouse tracking
  - Head pose detection
  - Object detection (phones, books)
  - Tab switching detection
  - 3-strike automatic blocking
- Exam flow with multiple steps
- Admin dashboard
- Evidence collection

### **📚 StudyMate Courses**
- YouTube video course processing
- AI-powered course segmentation
- Interactive Q&A using Gemini
- Audio transcription
- Progress tracking
- Course notes and quizzes

---

## 📍 Main URLs

| Feature | URL |
|---------|-----|
| **Main Page** | `http://localhost:8000/` |
| **Login** | `http://localhost:8000/login/` |
| **Exam Flow** | `http://localhost:8000/exam-flow/` |
| **Student Dashboard** | `http://localhost:8000/student-dashboard/` |
| **Admin Dashboard** | `http://localhost:8000/admin-dashboard/` |
| **Courses Portal** | `http://localhost:8000/courses/` |
| **API Health** | `http://localhost:8000/courses/api/health` |

---

## 📁 Project Structure

```
c:\sparkless\
├── backend/
│   ├── app.py (DEPRECATED - use Django instead)
│   ├── transcripts/
│   └── audio/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── video_proctoring_project/
│   └── proctoring/
│       ├── manage.py ⭐ (MAIN ENTRY POINT)
│       ├── db.sqlite3
│       │
│       ├── proctoring/ (Django settings)
│       │   ├── settings.py
│       │   └── urls.py
│       │
│       ├── monitor/ (Exam Proctoring App)
│       │   ├── views.py
│       │   ├── urls.py
│       │   ├── models.py
│       │   └── templates/
│       │
│       └── courses/ (StudyMate App) ✨ NEW
│           ├── views.py
│           ├── urls.py
│           └── apps.py
│
└── docs/
    ├── SERVER_UNIFICATION_COMPLETE.md
    ├── UNIFIED_SERVER_GUIDE.md
    ├── ADVANCED_PROCTORING_SYSTEM.md
    └── ... (more documentation)
```

---

## 🔧 Configuration

### **Environment Variables (.env)**
Create/update `.env` file in root (`c:\sparkless\.env`):

```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# AssemblyAI
ASSEMBLYAI_API_KEY=your_assemblyai_key_here
```

### **Database**
- **Type**: PostgreSQL
- **Database**: `Exam_db`
- **User**: `postgres`
- **Password**: (configured in settings.py)
- **Host**: `localhost`
- **Port**: `5432`

---

## 📖 Documentation

### **Complete Guides:**
1. **[SERVER_UNIFICATION_COMPLETE.md](docs/SERVER_UNIFICATION_COMPLETE.md)** - What was done
2. **[UNIFIED_SERVER_GUIDE.md](UNIFIED_SERVER_GUIDE.md)** - Setup and usage
3. **[ADVANCED_PROCTORING_SYSTEM.md](docs/ADVANCED_PROCTORING_SYSTEM.md)** - Proctoring features
4. **[FRONTEND_UPDATE_GUIDE.md](FRONTEND_UPDATE_GUIDE.md)** - Frontend migration
5. **[SPLIT_SCREEN_UI_README.md](SPLIT_SCREEN_UI_README.md)** - UI design

### **Quick References:**
- **[QUICK_START_SPLIT_SCREEN.md](docs/QUICK_START_SPLIT_SCREEN.md)** - Quick testing guide
- **[COMPLETE_DELIVERY_SUMMARY.md](docs/COMPLETE_DELIVERY_SUMMARY.md)** - Features overview
- **[EXECUTIVE_SUMMARY.md](docs/EXECUTIVE_SUMMARY.md)** - High-level overview

---

## ✅ What Changed (Nov 25, 2025)

### **Before:**
- Flask server on port 5000 (Courses)
- Django server on port 8000 (Exams)
- Needed to run 2 separate servers

### **After:**
- ✅ Unified Django server on port 8000
- ✅ Both systems integrated
- ✅ Single command to start
- ✅ No CORS issues
- ✅ Shared authentication

---

## 🛠️ Technologies

- **Backend**: Django 5.2.1, Python 3.12
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **AI/ML**:
  - Google Gemini (course processing, Q&A)
  - TensorFlow.js (face detection)
  - COCO-SSD (object detection)
  - face-api.js (facial landmarks)
  - AssemblyAI (audio transcription)
- **Database**: PostgreSQL
- **Video**: YouTube Transcript API, yt-dlp

---

## 🧪 Testing

### **Test Exam Proctoring:**
1. Start server: `python manage.py runserver`
2. Visit: `http://localhost:8000/exam-flow/`
3. Follow Steps 1-4
4. Test proctoring features:
   - Look away → Violation
   - Cover camera → Violation
   - Move mouse outside → Violation
   - 3rd violation → Exam blocked

### **Test Courses:**
1. Visit: `http://localhost:8000/courses/`
2. Add a YouTube course link
3. Process video
4. Watch segmented course
5. Ask questions

---

## 🐛 Troubleshooting

### **Port 8000 in use:**
```powershell
Get-Process python | Stop-Process
python manage.py runserver
```

### **Module not found:**
```powershell
pip install -r backend/requirements.txt
```

### **Database errors:**
```powershell
python manage.py migrate
```

---

## 📊 Key Features Completed

### **Exam Proctoring:**
- [x] Face detection with canvas visualization
- [x] Split-screen UI (CodeTantra/CodeChef style)
- [x] Mouse tracking
- [x] Head pose detection
- [x] Object detection (phones, books)
- [x] 3-strike automatic blocking
- [x] Real-time violation counter
- [x] Evidence logging
- [x] Admin monitoring dashboard

### **Courses:**
- [x] YouTube video processing
- [x] AI course segmentation
- [x] Interactive Q&A
- [x] Audio transcription
- [x] Progress tracking
- [x] Django integration

### **Integration:**
- [x] Unified server on port 8000
- [x] Single authentication system
- [x] Shared configuration
- [x] No CORS issues

---

## 🚀 Deployment

For production deployment:
1. Set `DEBUG = False` in settings.py
2. Configure `ALLOWED_HOSTS`
3. Use production WSGI server (Gunicorn)
4. Set up HTTPS
5. Configure static files
6. Use environment variables for secrets

---

## 📞 Support

For issues or questions:
1. Check documentation in `/docs/`
2. Review server logs
3. Verify `.env` configuration
4. Check database connection

---

## 🎉 Status

✅ **FULLY OPERATIONAL**

- Server: Running on port 8000
- Exam System: Complete with advanced proctoring
- Courses System: Integrated with Django
- Documentation: Comprehensive guides available

---

**Last Updated**: November 25, 2025
**Version**: 3.0 - Unified Server
**Status**: ✅ Production Ready

---

## 🏁 Quick Commands

```powershell
# Start server
cd C:\sparkless\video_proctoring_project\proctoring
python manage.py runserver

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Access admin
http://localhost:8000/admin/
```

---

🎊 **Enjoy your unified exam and course management system!**
