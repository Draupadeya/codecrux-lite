# SparkLess Admin Portal Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   SparkLess Admin Portal                      │
│                  (Django Admin Interface)                     │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    ┌────────┐         ┌────────┐        ┌─────────┐
    │ Users  │         │Student │        │Candidate│
    │        │         │Profile │        │         │
    └────────┘         └────────┘        └─────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
            ┌──────────────────────────┐
            │   Django Database        │
            │   (SQLite/PostgreSQL)    │
            └──────────────────────────┘
```

---

## Data Models

### 1. User Model (Django Built-in)
```
User
├── username (Roll Number for students)
├── password (DOB-YYYYMMDD for students)
├── email
├── is_staff (Faculty/Admin flag)
├── is_superuser (Admin flag)
└── is_active
```

### 2. StudentProfile Model
```
StudentProfile
├── user (OneToOneField → User)
├── full_name
├── roll_number (unique)
├── dob (Date of Birth)
└── created_at
```

### 3. Candidate Model (for exam registration)
```
Candidate
├── name
├── roll_number
├── email
├── photo (Face image)
├── authorized_embedding (Face recognition data)
├── blocked (bool)
├── blocked_reason
└── created_at
```

### 4. Session Model (exam tracking)
```
Session
├── candidate (FK → Candidate)
├── started_at
├── ended_at
├── verdict (clean/suspicious)
├── suspicion_score
├── blocked
└── active
```

### 5. Event Model (proctoring events)
```
Event
├── session (FK → Session)
├── event_type (face_mismatch, gaze_offscreen, etc.)
├── timestamp
├── score
├── frame_file (evidence photo)
├── audio_file (evidence audio)
└── details
```

---

## Setup Workflow

```
START
  │
  ├─► Delete existing users (optional)
  │     python manage.py setup_students --delete-all
  │
  ├─► Load students from CSV
  │     python manage.py setup_students --file students.csv
  │
  ├─► Create Faculty via Admin Panel
  │     http://localhost:786/admin/ → Users → Add User
  │
  ├─► Register Candidates for Exams
  │     http://localhost:786/admin/ → Candidates → Add Candidate
  │
  └─► Monitor Exams
        http://localhost:786/admin/ → Sessions/Events
```

---

## Login Flow

### Student Login
```
┌─────────────────────────────────────┐
│ Student Login Page                   │
│ (http://localhost:786/)             │
└─────────────────────────────────────┘
              │
              ├─ Input: Username (CS2024001)
              ├─ Input: Password (19990615 - DOB)
              │
              ▼
┌─────────────────────────────────────┐
│ Authentication                       │
│ views.handle_unified_login()        │
└─────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
STAFF LOGIN        STUDENT LOGIN
  (Faculty)          │
    │                ├─► Check StudentProfile
    │                │
    ▼                ├─► Verify DOB matches password
  Admin Panel        │
                     ▼
              ┌──────────────┐
              │ Dashboard    │
              │ (Student UI) │
              └──────────────┘
```

### Faculty Login
```
┌─────────────────────────────────────┐
│ Login Page                           │
└─────────────────────────────────────┘
      │
      ├─ Username: faculty_john
      ├─ Password: StrongPassword123
      │
      ▼
┌─────────────────────────────────────┐
│ Check: is_staff or is_superuser     │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│ Admin Panel Access                   │
│ http://localhost:786/admin/         │
└─────────────────────────────────────┘
```

---

## Admin Panel Structure

```
/admin/
├── Users
│   ├── Add User
│   ├── Edit User
│   ├── Delete User
│   └── View StudentProfile (inline)
│
├── Student Profiles
│   ├── View all students
│   ├── See: Name, Roll No, DOB, Username
│   ├── Search & Filter
│   └── Edit profile
│
├── Candidates
│   ├── Register for exam
│   ├── Upload photo
│   ├── Generate face embedding
│   ├── Block/Unblock student
│   └── View status
│
├── Sessions
│   ├── Monitor exam sessions
│   ├── View start/end time
│   ├── Check verdict (clean/suspicious)
│   ├── View suspicion score
│   └── See blocked status
│
└── Events
    ├── View proctoring events
    ├── Filter by type
    ├── See frame evidence
    ├── Play audio evidence
    └── Check timestamp & score
```

---

## CSV Data Flow

```
sample_students.csv
    │
    ├─ roll_number, name, dob
    ├─ CS2024001, Raj Kumar, 1999-06-15
    ├─ CS2024002, Priya Singh, 2000-03-22
    │
    ▼
python manage.py setup_students --file students.csv
    │
    ├─ Parse CSV
    ├─ Validate DOB format
    ├─ Create User (username=roll_no, password=YYYYMMDD)
    ├─ Create StudentProfile (linked to User)
    │
    ▼
User (Django) + StudentProfile (Custom) Created
    │
    ├─ User: CS2024001, password: 19990615
    ├─ StudentProfile: Raj Kumar, DOB: 1999-06-15
    │
    ▼
Database Saved
```

---

## Exam Flow

```
1. REGISTRATION
   ├─ Admin adds student to Candidate model
   ├─ Admin uploads student photo
   ├─ System generates face embedding
   └─ Student marked ready for exam

2. EXAM START
   ├─ Student logs in (Roll No + DOB)
   ├─ System creates Session record
   ├─ Webcam + Microphone activated
   └─ Proctoring begins

3. MONITORING
   ├─ Detects face changes → Face Mismatch Event
   ├─ Detects gaze away → Gaze Offscreen Event
   ├─ Detects multiple faces → Multi-Face Event
   ├─ Detects other voices → Audio Others Event
   ├─ Detects gadgets → Device Detected Event
   └─ Each event logged with evidence (photo, audio)

4. EXAM END
   ├─ Student submits exam
   ├─ Session ended
   ├─ Verdict calculated (clean/suspicious)
   └─ Suspicion score computed

5. REVIEW
   ├─ Admin views Session in admin panel
   ├─ Reviews all Events
   ├─ Views evidence (photos, audio)
   ├─ Decides: Pass/Block
   └─ Updates student status
```

---

## Security Architecture

```
┌─────────────────────────────────────┐
│   Frontend Login Form                │
│   (CSRF Protected)                  │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   Backend Authentication             │
│   (Django Auth)                      │
│   - Check username                  │
│   - Verify password/DOB             │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   Session Created                    │
│   (HttpRequest.user)                │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   Authorization Check               │
│   - is_authenticated                │
│   - is_staff (for admin)            │
│   - is_superuser (for superadmin)   │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   Access Granted                    │
│   - Redirect to appropriate page    │
└─────────────────────────────────────┘
```

---

## File Organization

```
proctoring/
├── manage.py
├── proctoring/ (settings, urls, wsgi)
├── monitor/ (main app)
│   ├── admin.py (MODIFIED)
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   ├── templates/monitor/
│   │   ├── index.html (login page)
│   │   ├── student_dashboard.html
│   │   └── ...
│   ├── management/
│   │   ├── __init__.py
│   │   └── commands/
│   │       ├── __init__.py
│   │       └── setup_students.py
│   ├── migrations/
│   └── ...
├── courses/ (another app)
├── studymate/ (another app)
│
├── sample_students.csv (NEW)
├── setup_admin.bat (NEW)
├── setup_admin.ps1 (NEW)
│
├── README_ADMIN_PORTAL.md (NEW)
├── ADMIN_SETUP_GUIDE.md (NEW)
├── ADMIN_QUICK_START.md (NEW)
└── ADMIN_PORTAL_SETUP_COMPLETE.md (NEW)
```

---

## Credential Retrieval

### For Students
```
Roll Number: Look in StudentProfile.roll_number
Password: Date of Birth in YYYYMMDD format
          (Student should know their own DOB)
```

### For Faculty
```
Username: Set by admin when creating user
Password: Set by admin when creating user
          (Can be reset in admin panel)
```

---

## API Endpoints (For Future Enhancement)

```
POST /admin/setup-students/
     - Create bulk students

POST /admin/create-faculty/
     - Create faculty account

GET /admin/users/
    - List all users

POST /api/authenticate/
     - Login endpoint

GET /admin/students/
    - List all students

GET /admin/sessions/
    - View exam sessions

GET /admin/events/
    - View proctoring events
```

---

## Environment Variables (Recommended for Production)

```
DJANGO_SECRET_KEY=your_secret_key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://user:password@localhost/sparkless
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
```

---

## Deployment Checklist

- [ ] Update SECRET_KEY in settings.py
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Use PostgreSQL instead of SQLite
- [ ] Set up HTTPS/SSL
- [ ] Configure email backend
- [ ] Run migrations: `python manage.py migrate`
- [ ] Create superuser: `python manage.py createsuperuser`
- [ ] Load students: `python manage.py setup_students --file students.csv`
- [ ] Collect static files: `python manage.py collectstatic`
- [ ] Use Gunicorn/uWSGI for production server
- [ ] Set up Nginx reverse proxy
- [ ] Enable CSRF protection
- [ ] Configure CORS if needed
- [ ] Set up logging and monitoring

---

This architecture provides a secure, scalable, and maintainable admin portal for managing students, faculty, and exam proctoring.

