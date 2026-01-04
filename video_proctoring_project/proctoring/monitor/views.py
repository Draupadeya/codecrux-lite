import io, base64, uuid
import numpy as np
import json
import datetime
from PIL import Image

from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpRequest
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.views.decorators.http import require_http_methods 
from django.db.models import Sum, Avg
from deepface import DeepFace 
from django.views.decorators.csrf import csrf_protect

# NOTE: Ensure your models are imported correctly from your app's models.py
from .models import Candidate, Session, Event, StudentProfile
from . import analyzer # Assuming 'analyzer' contains analyze_audio/analyze_frame logic

# Get the custom or default User model
User = get_user_model() 

# ==========================
# Base Index and Authentication Router
# ==========================


# ==========================
# Base Index and Authentication Router
# ==========================

def index(request: HttpRequest):
    # Retrieve and remove the login error message from the session
    login_error = request.session.pop('login_error', None)
    
    if request.user.is_authenticated:
        return redirect('post_login_redirect')
        
    context = {}
    if login_error:
        context['error'] = login_error
        
    return render(request, "monitor/index.html", context)


@csrf_protect # Crucial for handling browser POST data
def handle_unified_login(request: HttpRequest):
    """Handles POST requests from the unified login form."""
    if request.method == "POST":
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)
        
        # 2. If standard authentication fails, attempt manual DOB check
        if user is None:
            # ... (Manual DOB check logic remains the same) ...
            try:
                user = User.objects.get(username=username)
                if not user.is_staff and not user.is_superuser:
                    profile = getattr(user, 'studentprofile', None)
                    if profile and profile.date_of_birth:
                        dob_string = profile.date_of_birth.strftime('%Y%m%d') 
                        if password != dob_string:
                            user = None
                    else:
                        user = None
            except User.DoesNotExist:
                user = None
            except Exception as e:
                print(f"Error during manual DOB authentication: {e}")
                user = None 
        
        # 3. Final Check and Routing
        if user is not None:
            login(request, user)
            return redirect('post_login_redirect')
        
        # If authentication failed (user is None)
        request.session['login_error'] = "Invalid credentials. Please check your username/roll number and password."
        return redirect('index') # Use redirect for clean Post/Redirect/Get
    
    # If accessed via GET (should be handled by the index view's redirect)
    return redirect('index')


# ... (rest of authentication/dashboard views: redirect_to_dashboard, student_dashboard, admin_dashboard, user_logout) ...

# ==========================
# Proctor Block/Unblock API Views (Restored and Correct)
# ==========================

@staff_member_required
@require_http_methods(["POST"])
@csrf_exempt # API views use csrf_exempt because they don't send form tokens
def proctor_block_view(request):
    """Handles API request to block a candidate and all active sessions."""
    try:
        data = json.loads(request.body)
        candidate_id = data.get('candidate_id')
        reason = data.get('reason', 'Manual block by Proctor') 
        
        if not candidate_id:
            return JsonResponse({'status': 'error', 'message': 'Missing candidate ID.'}, status=400)

        # 1. Block the candidate (permanent status)
        candidate = Candidate.objects.get(id=candidate_id)
        candidate.blocked = True
        candidate.blocked_reason = reason
        candidate.save()

        # 2. Block all active sessions for this candidate
        Session.objects.filter(candidate=candidate, ended_at__isnull=True).update(
            blocked=True,
            verdict='blocked',
            ended_at=datetime.datetime.now()
        )
        
        return JsonResponse({'status': 'success', 'message': f'Candidate {candidate_id} blocked successfully.'})

    except Candidate.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': f'Candidate ID {candidate_id} not found.'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON format.'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'An error occurred: {str(e)}'}, status=500)


@staff_member_required
@require_http_methods(["POST"])
@csrf_exempt # API views use csrf_exempt because they don't send form tokens
def proctor_unblock_view(request):
    """Handles API request to unblock a candidate."""
    try:
        data = json.loads(request.body)
        candidate_id = data.get('candidate_id')
        
        if not candidate_id:
            return JsonResponse({'status': 'error', 'message': 'Missing candidate ID.'}, status=400)

        # 1. Unblock the candidate (permanent status)
        candidate = Candidate.objects.get(id=candidate_id)
        candidate.blocked = False
        candidate.blocked_reason = "" # Clear the reason
        candidate.save()
        
        # 2. Update any pending sessions back to clean/unblocked
        Session.objects.filter(candidate=candidate, ended_at__isnull=True, blocked=True).update(
             blocked=False,
             verdict='clean'
        )
        
        return JsonResponse({'status': 'success', 'message': f'Candidate {candidate_id} unblocked successfully.'})

    except Candidate.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': f'Candidate ID {candidate_id} not found.'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON format.'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'An error occurred: {str(e)}'}, status=500)@login_required
def redirect_to_dashboard(request: HttpRequest):
    """Routes the authenticated user after login redirect."""
    if request.user.is_staff or request.user.is_superuser:
        return redirect('admin_dashboard') 
    else:
        # Redirect to Django StudyMate
        return redirect('courses_portal')


def user_logout(request):
    """Logs the user out and redirects to the index/login page."""
    logout(request)
    return redirect('index') 

# ==========================
# Protected Dashboards and Core Logic
# ==========================

@login_required
def student_dashboard(request: HttpRequest):
    user = request.user
    candidate = None
    
    # --- 1. Fetch Candidate Profile and Block Status (Safeguarded) ---
    try:
        profile = getattr(user, 'studentprofile', None)
        if not profile:
             # Logged-in user has no profile (Data Integrity Error)
             return redirect('user_logout')

        if hasattr(profile, 'roll_number'):
            # Fetch Candidate using the roll_number
            candidate = Candidate.objects.get(roll_number=profile.roll_number)
            
            if candidate.blocked:
                if 'current_session' in request.session:
                    del request.session['current_session']
                return redirect('blocked_page') 
        else:
             # Logged-in user has profile but no roll_number field
             return redirect('user_logout')

    except Candidate.DoesNotExist:
        # User is logged in, but Candidate record is missing.
        print(f"Data Error: Logged-in user {user.username} Candidate record missing.")
        return redirect('user_logout')
    except Exception as e:
        print(f"Unhandled Error in dashboard: {e}")
        return redirect('user_logout') 

    # --- 2. Fetch or Create Current Session ---
    session = Session.objects.filter(candidate=candidate, active=True).first()
    if not session:
         session = Session.objects.create(candidate=candidate, active=True) 

    # --- 3. Check Statuses and Set current_session ---
    mic_tested = getattr(session, 'mic_tested', False) 
    webcam_tested = getattr(session, 'webcam_tested', False) 
    rules_confirmed = getattr(session, 'rules_confirmed', False) 
    
    mic_status = "complete" if mic_tested else "incomplete"
    webcam_status = "complete" if webcam_tested else "incomplete"
    rules_status = "complete" if rules_confirmed else "incomplete"
    
    all_checks_passed = mic_tested and webcam_tested and rules_confirmed
    
    if all_checks_passed and session:
        request.session['current_session'] = session.id
    else:
        if 'current_session' in request.session:
            del request.session['current_session']

    # --- 4. Prepare Context and Render ---
    total_checks = 3
    passed_checks = sum([1 for status in [mic_status, webcam_status, rules_status] if status == 'complete'])
    progress_percent = round((passed_checks / total_checks) * 100) if total_checks > 0 else 0
        
    context = {
        "session": session, 
        "mic_status": mic_status,
        "webcam_status": webcam_status,
        "rules_status": rules_status,
        "current_username": user.username,
        "passed_checks": passed_checks,
        "total_checks": total_checks,
        "progress_percent": progress_percent, 
    }
    
    return render(request, "monitor/student_dashboard.html", context)


def admin_dashboard(request):
    # Renders the admin monitoring dashboard
    from .models import Course, Enrollment, StudentProfile
    from django.db.models import Avg
    
    context = {}
    faculty = None
    
    # Get faculty profile if user is logged in and has one
    if request.user.is_authenticated:
        try:
            faculty = request.user.faculty_profile
            context['faculty'] = faculty
            context['faculty_name'] = faculty.full_name
            context['faculty_designation'] = faculty.designation or 'Faculty'
            # Get initials for avatar
            names = faculty.full_name.split()
            initials = ''.join([n[0].upper() for n in names[:2]]) if names else 'FA'
            context['faculty_initials'] = initials
        except:
            context['faculty_name'] = request.user.username
            context['faculty_initials'] = request.user.username[:2].upper()
            context['faculty_designation'] = 'Admin'
    
    # Get courses for this faculty
    if faculty:
        courses = Course.objects.filter(faculty=faculty)
        context['courses'] = courses
        context['recent_courses'] = courses[:3]
        context['total_courses'] = courses.count()
        
        # Get enrollments for faculty's courses
        enrollments = Enrollment.objects.filter(course__faculty=faculty)
        context['recent_enrollments'] = enrollments.select_related('student', 'course')[:10]
        context['total_enrollments'] = enrollments.count()
        
        # Get unique students enrolled in faculty's courses
        student_ids = enrollments.values_list('student_id', flat=True).distinct()
        context['total_students'] = student_ids.count()
        
        # Calculate average completion
        avg_completion = enrollments.aggregate(avg=Avg('progress'))['avg'] or 0
        context['avg_completion'] = round(avg_completion, 1)
        
        # Get ALL students from database with their enrollment stats
        all_students = StudentProfile.objects.all()
        for student in all_students:
            student_enrollments = student.enrollments.all()
            student.enrolled_count = student_enrollments.count()
            student.avg_progress = student_enrollments.aggregate(avg=Avg('progress'))['avg'] or 0
        context['students'] = all_students
    else:
        # For non-faculty admins, show all courses
        context['courses'] = Course.objects.all()
        context['recent_courses'] = Course.objects.all()[:3]
        context['total_courses'] = Course.objects.count()
        context['total_enrollments'] = Enrollment.objects.count()
        context['total_students'] = StudentProfile.objects.count()
        context['avg_completion'] = 0
        context['recent_enrollments'] = Enrollment.objects.select_related('student', 'course')[:10]
        # Get ALL students with enrollment stats
        all_students = StudentProfile.objects.all()
        for student in all_students:
            student_enrollments = student.enrollments.all()
            student.enrolled_count = student_enrollments.count()
            student.avg_progress = student_enrollments.aggregate(avg=Avg('progress'))['avg'] or 0
        context['students'] = all_students
    
    return render(request, 'monitor/admin_dashboard.html', context)


@staff_member_required
def proctor_view(request, candidate_id):
    """Renders the live monitoring page for a specific candidate."""
    candidate = get_object_or_404(Candidate, id=candidate_id)
    session = Session.objects.filter(candidate=candidate, ended_at__isnull=True).order_by('-started_at').first()

    return render(request, "monitor/proctor_view.html", {
        'candidate': candidate,
        'session': session,
    })
# ==========================
# Exam Rules Page
# ==========================
@login_required
@login_required
def exam_rules(request):
    session_id = request.session.get("current_session")
    session = Session.objects.filter(id=session_id).first()

    if request.method == "POST":
        # Check if the user accepted the rules (by form submission)
        if request.POST.get('rules_accepted'): 
            
            if session:
                # 🚨 ACTION: Update the session status to confirm rules 🚨
                # Assuming you have a 'rules_confirmed' field on the Session model.
                # If not, you should create one in your models.py.
                # For this fix, let's assume a 'rules_confirmed' boolean field exists.
                session.rules_confirmed = True 
                session.save()
            
            # 🚀 FINAL FIX: Redirect to the student dashboard 🚀
            return redirect('student_dashboard')

    # If GET request, just render the page
    return render(request, "monitor/exam_rules.html", {"session": session})


# ==========================
# Mic Test Page
# ==========================
@login_required
def mic_test(request):
    return render(request, "monitor/mic_test.html")


# ==========================
# Webcam Test Page
# ==========================
@login_required
def webcam_test(request):
    return render(request, "monitor/webcam_test.html")


# ==========================
# Start Exam Page
# ==========================
@login_required
def start_exam(request):
    """
    Loads the main exam page if a valid session ID is found in the user's 
    browser session. Otherwise, redirects to the dashboard.
    """
    
    # 1. Retrieve the session ID from the user's browser session
    session_id = request.session.get("current_session")
    
    # 2. Look up the Session object using the Django Model Manager
    # .filter() returns a QuerySet, .first() returns the object or None.
    try:
        session = Session.objects.filter(id=session_id).first()
    except Exception as e:
        # Optional: Log the error if the filter fails for unexpected reasons
        print(f"Error fetching session in start_exam: {e}")
        session = None

    if not session:
        # If no session ID was found in the browser, or the session object 
        # doesn't exist in the database, redirect the user to setup.
        return redirect('student_dashboard') # Assuming you have this URL name defined
        
    # 3. Render the exam template, passing the valid Session object
    # The exam template uses {{ session.id }} and other session attributes.
    return render(request, "monitor/start_exam.html", {"session": session})


# ==========================
# Blocked Page
# ==========================
@login_required
def blocked_page(request):
    return render(request, "monitor/blocked.html")


# ==========================
# Start Session API
# ==========================
@login_required
@csrf_exempt
def start_session(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    user = request.user
    profile = getattr(user, "studentprofile", None)
    if not profile:
        return JsonResponse({"error": "Profile not found"}, status=404)

    candidate, _ = Candidate.objects.get_or_create(
        roll_number=profile.roll_number,
        defaults={"name": profile.full_name, "email": user.email}
    )

    session = Session.objects.create(candidate=candidate)
    request.session["current_session"] = session.id

    return JsonResponse({"status": "ok", "session_id": session.id})


# ==========================
# End Session API
# ==========================
@login_required
@csrf_exempt
def end_session(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    session_id = request.POST.get("session_id")
    if not session_id or not session_id.isdigit():
        return JsonResponse({"error": "Invalid session ID"}, status=400)

    session = Session.objects.filter(id=int(session_id)).first()
    if not session:
        return JsonResponse({"error": "Session not found"}, status=404)

    # Mark the session as ended by setting ended_at
    session.ended_at = datetime.datetime.now()
    session.save()

    return JsonResponse({"status": "ok", "completed": True})


# ==========================
# Upload Audio (Mic Test) API
# ==========================
@login_required
@csrf_exempt
def upload_audio(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST method required"}, status=400)

    session_id = request.POST.get('session_id')
    if not session_id or not session_id.isdigit():
        return JsonResponse({"error": "Invalid session ID"}, status=400)

    session = Session.objects.filter(id=int(session_id)).first()
    if not session:
        return JsonResponse({"error": "Session not found"}, status=404)

    b64_audio = request.POST.get('audio')
    if not b64_audio:
        return JsonResponse({"error": "No audio data sent"}, status=400)

    try:
        header, data = b64_audio.split(',', 1) if ',' in b64_audio else (None, b64_audio)
        audio_bytes = base64.b64decode(data)
    except Exception as e:
        return JsonResponse({"error": f"Invalid audio data: {str(e)}"}, status=400)

    # Analyze audio with analyzer
    events = analyzer.analyze_audio(audio_bytes, session)

    for ev in events:
        Event.objects.create(
            session=session,
            event_type=ev.get("type", "audio"),
            details=ev.get("details", ""),
            score=ev.get("score", 0.0)
        )

    return JsonResponse({"status": "ok", "events": events})


# ==========================
# Start Exam / Upload Frame + Tab Switch Handling
# ==========================
@csrf_exempt
def upload_frame(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST method required"}, status=400)

    session_id = request.POST.get('session_id')
    if not session_id or not session_id.isdigit():
        return JsonResponse({"error": "Invalid session ID"}, status=400)

    session = Session.objects.get(id=int(session_id))

    # ----------------------
    # Handle tab switch event
    # ----------------------
    tab_switch = request.POST.get('tab_switch')
    if tab_switch == "true":
        Event.objects.create(
            session=session,
            event_type="tab_switch",
            details="User switched tab or minimized window",
            score=1.0
        )
        session.suspicion_score += 1
        if session.suspicion_score >= 3:
            session.verdict = "suspicious"
            session.blocked = True
            # Ensure Candidate block reason is explicitly set
            if session.candidate:
                session.candidate.blocked = True
                session.candidate.blocked_reason = "Exceeded suspicious activity threshold"
                session.candidate.save()
        session.save()
        return JsonResponse({"status": "ok", "events": [{"type": "tab_switch", "details": "User switched tab"}], "blocked": session.blocked})

    # ----------------------
    # Handle webcam frame
    # ----------------------
    b64 = request.POST.get('frame')
    if not b64:
        return JsonResponse({"error": "No frame sent"}, status=400)

    try:
        header, data = b64.split(',', 1) if ',' in b64 else (None, b64)
        img_bytes = base64.b64decode(data)
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        frame = np.array(img)[:, :, ::-1]  # RGB -> BGR
    except Exception as e:
        return JsonResponse({"error": f"Invalid image data: {str(e)}"}, status=400)

    # Analyze frame
    events = analyzer.analyze_frame(frame, session)

    # Save events to DB
    for ev in events:
        if 'frame' in ev:
            pil_img = Image.fromarray(ev['frame'][:, :, ::-1])
            buf = io.BytesIO()
            pil_img.save(buf, format='JPEG')
            buf.seek(0)
            name = f"{uuid.uuid4().hex}.jpg"
            django_file = InMemoryUploadedFile(buf, None, name, 'image/jpeg', buf.getbuffer().nbytes, None)
            Event.objects.create(
                session=session,
                event_type=ev['type'],
                details=ev.get('details', ''),
                frame_file=django_file,
                score=ev.get('score', 0.0)
            )
        else:
            Event.objects.create(
                session=session,
                event_type=ev['type'],
                details=ev.get('details', ''),
                score=ev.get('score', 0.0)
            )

    # Update suspicion score & block logic
    # NOTE: This uses inefficient session.events.all() for total_score, consider optimization.
    total_score = sum(e.score for e in session.events.all())
    session.suspicion_score = total_score
    if total_score >= 3:
        session.verdict = "suspicious"
        session.blocked = True
        if session.candidate:
            session.candidate.blocked = True
            session.candidate.blocked_reason = "Exceeded suspicious activity threshold"
            session.candidate.save()
    session.save()

    # Prepare JSON response
    events_serializable = []
    for ev in events:
        ev_copy = ev.copy()
        if 'frame' in ev_copy:
            pil_img = Image.fromarray(ev_copy['frame'][:, :, ::-1])
            buf = io.BytesIO()
            pil_img.save(buf, format='JPEG')
            buf.seek(0)
            ev_copy['frame'] = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
        events_serializable.append(ev_copy)

    return JsonResponse({'status': 'ok', 'events': events_serializable, 'blocked': session.blocked})


# ==========================
# Face Verification API (No Change)
# ==========================
@login_required
@csrf_exempt
def verify_face(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    session_id = request.POST.get('session_id')
    if not session_id or not session_id.isdigit():
        return JsonResponse({"error": "Invalid session ID"}, status=400)

    session = Session.objects.filter(id=int(session_id)).first()
    if not session:
        return JsonResponse({"error": "Session not found"}, status=404)

    b64_frame = request.POST.get('frame')
    if not b64_frame:
        return JsonResponse({"error": "No frame sent"}, status=400)

    try:
        header, data = b64_frame.split(',', 1) if ',' in b64_frame else (None, b64_frame)
        img_bytes = base64.b64decode(data)
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        frame = np.array(img)[:, :, ::-1]  # RGB -> BGR
    except Exception as e:
        return JsonResponse({"error": f"Invalid image data: {str(e)}"}, status=400)

    candidate = session.candidate
    if not candidate:
        return JsonResponse({"error": "Candidate not found"}, status=404)

    try:
        result = DeepFace.verify(
            np.array(img),
            candidate.photo.path,  # assuming you have a 'photo' field in Candidate model
            enforce_detection=False
        )
        verified = result.get('verified', False)
        confidence = result.get('distance', 0.0)
    except Exception as e:
        return JsonResponse({"error": f"Face verification failed: {str(e)}"}, status=500)

    Event.objects.create(
        session=session,
        event_type="face_verification",
        details=f"Verified: {verified}, Confidence: {confidence:.4f}",
        score=0.0 if verified else 1.0
    )

    return JsonResponse({"status": "ok", "verified": verified, "confidence": confidence})


# ==========================
# Report Event API
# ==========================
@login_required
@csrf_exempt
def report_event(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    try:
        # Try to parse JSON from request body
        data = json.loads(request.body) if request.body else {}
    except (json.JSONDecodeError, ValueError):
        # Fallback to form data if not JSON
        data = request.POST.dict()

    # Get session - for now, use the user's active session or create a default
    try:
        session_id = data.get('session_id') or request.POST.get('session_id')
        
        if session_id and str(session_id).isdigit():
            session = Session.objects.filter(id=int(session_id)).first()
            if not session:
                return JsonResponse({"error": "Session not found"}, status=404)
        else:
            # If no session_id provided, try to get/create one for current user
            from django.utils import timezone
            
            # Get candidate through StudentProfile -> roll_number -> Candidate
            try:
                profile = getattr(request.user, 'studentprofile', None)
                if not profile or not hasattr(profile, 'roll_number'):
                    return JsonResponse({"error": "User profile not found"}, status=400)
                
                candidate = Candidate.objects.get(roll_number=profile.roll_number)
            except Candidate.DoesNotExist:
                return JsonResponse({"error": "Candidate not found"}, status=404)
            
            session = Session.objects.filter(candidate=candidate, active=True).first()
            if not session:
                session = Session.objects.create(
                    candidate=candidate,
                    active=True,
                    started_at=timezone.now()
                )
    except Exception as e:
        print(f"Session error: {e}")
        return JsonResponse({"error": f"Session error: {str(e)}"}, status=400)

    event_type = data.get('event_type') or request.POST.get('event_type')
    details = data.get('description') or data.get('details') or request.POST.get('details', '')
    
    if not event_type:
        return JsonResponse({"error": "Event type required"}, status=400)

    try:
        Event.objects.create(
            session=session,
            event_type=event_type,
            details=str(details),
            score=0.0
        )
        print(f"✅ Event logged: {event_type} - {details}")
    except Exception as e:
        print(f"❌ Error creating event: {e}")
        return JsonResponse({"error": f"Failed to create event: {str(e)}"}, status=500)

    return JsonResponse({"status": "ok", "message": "Event reported"})


# ==========================
# Get Sessions API
# ==========================
@staff_member_required
def get_sessions(request):
    """
    API endpoint to fetch real-time session data for the Admin Dashboard.
    """
    try:
        # NOTE: Filter out completed sessions if dashboard should only show active/recent
        sessions = Session.objects.select_related('candidate').order_by('-started_at') 
        session_list = []

        for s in sessions:
            candidate = s.candidate
            
            # Safely get last event details
            last_event_type = "No alerts"
            last_event = s.events.order_by('-timestamp').first() 
            
            if last_event:
                last_event_type = f"{last_event.event_type.replace('_', ' ').title()}: {last_event.details}"

            session_list.append({
                "id": s.id,
                "candidate_id": candidate.id if candidate else None,
                "candidate_name": candidate.name if candidate else "Unidentified",
                "roll_number": candidate.roll_number if candidate else "N/A",
                "photo_url": candidate.photo.url if candidate and candidate.photo else "/static/img/default-avatar.png",
                "suspicion_score": s.suspicion_score or 0.0,
                "verdict": s.verdict or "clean",
                
                # Blocked status pulled from Candidate model for persistence
                "blocked": candidate.blocked if candidate else False, 
                "block_reason": candidate.blocked_reason if candidate else None,
                
                "last_event_type": last_event_type,
                "active": s.active,
                "started_at": s.started_at.strftime("%Y-%m-%d %H:%M:%S"),
                "ended_at": s.ended_at.strftime("%Y-%m-%d %H:%M:%S") if s.ended_at else "Active",
            })

        # Calculate summary statistics
        data = {
            "total_candidates": Candidate.objects.count(), 
            "active_sessions": Session.objects.filter(ended_at__isnull=True).count(),
            # Assuming Suspicious Events means sessions marked as 'suspicious' or 'blocked'
            "suspicious_events": Session.objects.filter(verdict__in=['suspicious', 'blocked']).count(),
            "clean_sessions": Session.objects.filter(verdict='clean', ended_at__isnull=True).count(),
            "sessions": session_list
        }
        
        return JsonResponse(data) 

    except Exception as e:
        print(f"Error in get_sessions view: {e}")
        return JsonResponse({"error": f"Internal API Error during processing: {str(e)}"}, status=500)
    # monitor/views.py (Insert this block)

# NOTE: Ensure json, datetime, and Candidate, Session models are imported.
# You need: import json, datetime 
# from .models import Candidate, Session 

@staff_member_required
@require_http_methods(["POST"])
@csrf_exempt
def proctor_block_view(request):
    """
    Handles API request to block a candidate and all active sessions.
    (This view was referenced in monitor/urls.py, line 48)
    """
    try:
        data = json.loads(request.body)
        candidate_id = data.get('candidate_id')
        reason = data.get('reason', 'Manual block by Proctor') 
        
        if not candidate_id:
            return JsonResponse({'status': 'error', 'message': 'Missing candidate ID.'}, status=400)

        # 1. Block the candidate (permanent status)
        candidate = Candidate.objects.get(id=candidate_id)
        candidate.blocked = True
        candidate.blocked_reason = reason
        candidate.save()

        # 2. Block all active sessions for this candidate
        Session.objects.filter(candidate=candidate, ended_at__isnull=True).update(
            blocked=True,
            verdict='blocked',
            ended_at=datetime.datetime.now()
        )
        
        return JsonResponse({'status': 'success', 'message': f'Candidate {candidate_id} blocked successfully.'})

    except Candidate.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': f'Candidate ID {candidate_id} not found.'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON format.'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'An error occurred: {str(e)}'}, status=500)


@staff_member_required
@require_http_methods(["POST"])
@csrf_exempt
def proctor_unblock_view(request):
    """
    Handles API request to unblock a candidate.
    """
    try:
        data = json.loads(request.body)
        candidate_id = data.get('candidate_id')
        
        if not candidate_id:
            return JsonResponse({'status': 'error', 'message': 'Missing candidate ID.'}, status=400)

        # 1. Unblock the candidate (permanent status)
        candidate = Candidate.objects.get(id=candidate_id)
        candidate.blocked = False
        candidate.blocked_reason = "" # Clear the reason
        candidate.save()
        
        # 2. Update any pending sessions back to clean/unblocked
        Session.objects.filter(candidate=candidate, ended_at__isnull=True, blocked=True).update(
             blocked=False,
             verdict='clean'
        )
        
        return JsonResponse({'status': 'success', 'message': f'Candidate {candidate_id} unblocked successfully.'})

    except Candidate.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': f'Candidate ID {candidate_id} not found.'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON format.'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'An error occurred: {str(e)}'}, status=500)
@login_required
def exam_flow(request: HttpRequest):
    """
    Master exam flow page with step-by-step progression:
    1. Mic Test
    2. Webcam Test
    3. Rules Acceptance
    4. Start Exam
    """
    user = request.user
    candidate = None
    
    # Fetch candidate profile
    try:
        profile = getattr(user, 'studentprofile', None)
        if not profile:
            return redirect('user_logout')

        if hasattr(profile, 'roll_number'):
            candidate = Candidate.objects.get(roll_number=profile.roll_number)
            
            if candidate.blocked:
                return redirect('blocked_page') 
        else:
            return redirect('user_logout')

    except Candidate.DoesNotExist:
        return redirect('user_logout')
    except Exception as e:
        print(f"Error in exam_flow: {e}")
        return redirect('user_logout')

    # Get or create current session
    session = Session.objects.filter(candidate=candidate, active=True).first()
    if not session:
        session = Session.objects.create(candidate=candidate, active=True)
    
    request.session['current_session'] = session.id
    
    context = {
        "session": session,
        "candidate": candidate,
        "user": user,
    }
    
    return render(request, "monitor/exam_flow.html", context)


@login_required
@require_http_methods(["POST"])
def mark_step_complete(request: HttpRequest):
    """API to mark a step complete in the exam flow."""
    try:
        data = json.loads(request.body)
        step = data.get('step')  # 'mic', 'webcam', 'rules'
        
        session_id = request.session.get('current_session')
        if not session_id:
            return JsonResponse({'status': 'error', 'message': 'No active session'}, status=400)
        
        session = Session.objects.get(id=session_id, candidate__studentprofile__user=request.user)
        
        if step == 'mic':
            session.mic_tested = True
        elif step == 'webcam':
            session.webcam_tested = True
        elif step == 'rules':
            session.rules_confirmed = True
        
        session.save()
        
        return JsonResponse({'status': 'success'})
    
    except Session.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Session not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
def practice_exam_redirect(request):
    return redirect("http://127.0.0.1:5000")


# ==========================
# Course API Endpoints
# ==========================
from .models import Course, CourseModule, Enrollment, ModuleProgress

@login_required
@require_http_methods(["POST"])
def create_course(request):
    """API to create a new course (Faculty only)"""
    try:
        # Check if user is faculty
        try:
            faculty = request.user.faculty_profile
        except:
            return JsonResponse({'error': 'Only faculty can create courses'}, status=403)
        
        data = json.loads(request.body)
        
        course = Course.objects.create(
            title=data.get('title'),
            description=data.get('description', ''),
            video_url=data.get('video_url', ''),
            study_hours=float(data.get('study_hours', 4)),
            category=data.get('category', ''),
            level=data.get('level', 'beginner'),
            duration=data.get('duration', ''),
            is_published=data.get('is_published', False),
            faculty=faculty
        )
        
        # Enroll selected students
        student_ids = data.get('student_ids', [])
        if student_ids:
            from .models import StudentProfile, Enrollment
            students = StudentProfile.objects.filter(id__in=student_ids)
            for student in students:
                Enrollment.objects.get_or_create(student=student, course=course)
        
        return JsonResponse({
            'status': 'success',
            'course': {
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'video_url': course.video_url,
                'study_hours': course.study_hours,
                'modules_count': course.modules_count,
                'category': course.category,
                'level': course.level,
                'is_published': course.is_published,
                'enrolled_students': len(student_ids)
            }
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def get_courses(request):
    """API to get all published courses"""
    try:
        courses = Course.objects.filter(is_published=True).select_related('faculty')
        
        courses_data = []
        for course in courses:
            courses_data.append({
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'category': course.category,
                'level': course.level,
                'duration': course.duration,
                'faculty_name': course.faculty.full_name,
                'modules_count': course.modules.count(),
                'students_count': course.enrollments.count(),
                'thumbnail': course.thumbnail.url if course.thumbnail else None
            })
        
        return JsonResponse({'courses': courses_data})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def get_course_detail(request, course_id):
    """API to get course details with modules"""
    try:
        course = Course.objects.get(id=course_id)
        
        modules_data = []
        for module in course.modules.all():
            modules_data.append({
                'id': module.id,
                'title': module.title,
                'description': module.description,
                'order': module.order,
                'video_url': module.video_url,
                'duration_minutes': module.duration_minutes
            })
        
        # Check if student is enrolled
        is_enrolled = False
        progress = 0
        if hasattr(request.user, 'studentprofile'):
            enrollment = Enrollment.objects.filter(
                student=request.user.studentprofile,
                course=course
            ).first()
            if enrollment:
                is_enrolled = True
                progress = enrollment.progress
        
        return JsonResponse({
            'course': {
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'category': course.category,
                'level': course.level,
                'duration': course.duration,
                'faculty_name': course.faculty.full_name,
                'is_published': course.is_published,
                'modules': modules_data,
                'is_enrolled': is_enrolled,
                'progress': progress
            }
        })
    except Course.DoesNotExist:
        return JsonResponse({'error': 'Course not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def auto_enroll_all_students(request, course_id):
    """API to auto-enroll all students in a published course"""
    try:
        course = Course.objects.get(id=course_id, is_published=True)
        students = StudentProfile.objects.all()
        
        enrolled_count = 0
        for student in students:
            enrollment, created = Enrollment.objects.get_or_create(
                student=student,
                course=course
            )
            if created:
                enrolled_count += 1
        
        return JsonResponse({
            'status': 'success',
            'message': f'Enrolled {enrolled_count} students in {course.title}',
            'total_enrolled': course.enrollments.count()
        })
    except Course.DoesNotExist:
        return JsonResponse({'error': 'Course not found or not published'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def auto_assign_exam_to_all(request, exam_id):
    """API to auto-assign an exam to all students"""
    try:
        exam = Exam.objects.get(id=exam_id, is_published=True)
        students = StudentProfile.objects.all()
        
        assigned_count = 0
        for student in students:
            assignment, created = ExamAssignment.objects.get_or_create(
                student=student,
                exam=exam
            )
            if created:
                assigned_count += 1
        
        return JsonResponse({
            'status': 'success',
            'message': f'Assigned {assigned_count} students to {exam.title}',
            'total_assigned': exam.assignments.count()
        })
    except Exam.DoesNotExist:
        return JsonResponse({'error': 'Exam not found or not published'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def enroll_student(request, course_id):
    """API to enroll student in a course"""
    try:
        # Check if user is a student
        try:
            student = request.user.studentprofile
        except:
            return JsonResponse({'error': 'Only students can enroll in courses'}, status=403)
        
        course = Course.objects.get(id=course_id, is_published=True)
        
        # Check if already enrolled
        enrollment, created = Enrollment.objects.get_or_create(
            student=student,
            course=course
        )
        
        if not created:
            return JsonResponse({'message': 'Already enrolled in this course'}, status=200)
        
        return JsonResponse({
            'status': 'success',
            'message': 'Successfully enrolled in course',
            'enrollment_id': enrollment.id
        })
    except Course.DoesNotExist:
        return JsonResponse({'error': 'Course not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def get_student_courses(request):
    """API to get courses enrolled by the student"""
    try:
        # Check if user is a student
        try:
            student = request.user.studentprofile
        except:
            return JsonResponse({'error': 'Student profile not found'}, status=403)
        
        enrollments = Enrollment.objects.filter(student=student).select_related('course', 'course__faculty')
        
        courses_data = []
        for enrollment in enrollments:
            course = enrollment.course
            courses_data.append({
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'category': course.category,
                'level': course.level,
                'duration': course.duration,
                'faculty_name': course.faculty.full_name,
                'modules_count': course.modules.count(),
                'progress': enrollment.progress,
                'completed': enrollment.completed,
                'enrolled_at': enrollment.enrolled_at.isoformat(),
                'thumbnail': course.thumbnail.url if course.thumbnail else None,
                'video_url': course.video_url
            })
        
        return JsonResponse({'courses': courses_data})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def get_student_courses_by_roll(request, roll_number):
    """API to get courses enrolled by student roll number - for frontend access"""
    try:
        # Find student by roll number
        try:
            student = StudentProfile.objects.get(roll_number=roll_number)
        except StudentProfile.DoesNotExist:
            return JsonResponse({'error': 'Student not found', 'courses': []}, status=200)
        
        enrollments = Enrollment.objects.filter(student=student).select_related('course', 'course__faculty')
        
        courses_data = []
        for enrollment in enrollments:
            course = enrollment.course
            if course.is_published:  # Only show published courses
                courses_data.append({
                    'id': course.id,
                    'title': course.title,
                    'description': course.description,
                    'category': course.category,
                    'level': course.level,
                    'duration': course.duration,
                    'study_hours': course.study_hours,
                    'faculty_name': course.faculty.full_name,
                    'modules_count': course.modules_count,  # Calculated from study_hours
                    'progress': enrollment.progress,
                    'completed': enrollment.completed,
                    'enrolled_at': enrollment.enrolled_at.isoformat(),
                    'thumbnail': course.thumbnail.url if course.thumbnail else None,
                    'video_url': course.video_url
                })
        
        return JsonResponse({'courses': courses_data, 'student_name': student.full_name})
    except Exception as e:
        return JsonResponse({'error': str(e), 'courses': []}, status=500)


# ==========================
# Exam API Endpoints
# ==========================
from .models import Exam, Question, TestCase, ExamAssignment, ExamAttempt, StudentAnswer, Enrollment
import requests
import os

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
MISTRAL_MODEL = "mistral-small-latest"

def _mistral_generate_exam(prompt, temperature=0.7, max_tokens=3000):
    """Call Mistral API to generate exam questions."""
    if not MISTRAL_API_KEY:
        raise ValueError("MISTRAL_API_KEY not configured - set environment variable")
    
    try:
        resp = requests.post(
            MISTRAL_API_URL,
            headers={
                "Authorization": f"Bearer {MISTRAL_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MISTRAL_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
            timeout=120,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    except Exception as exc:
        print(f"Mistral call failed: {exc}")
        return ""


@login_required
@require_http_methods(["POST"])
def create_exam(request):
    """API to create a new exam (Faculty only)"""
    try:
        # Check if user is faculty
        try:
            faculty = request.user.faculty_profile
        except:
            return JsonResponse({'error': 'Only faculty can create exams'}, status=403)
        
        data = json.loads(request.body)
        
        # Create the exam
        exam = Exam.objects.create(
            title=data.get('title'),
            description=data.get('description', ''),
            course_id=data.get('course_id') if data.get('course_id') else None,
            faculty=faculty,
            topic=data.get('topic', ''),
            difficulty=data.get('difficulty', 'medium'),
            total_marks=data.get('total_marks', 100),
            passing_marks=data.get('passing_marks', 40),
            duration_minutes=data.get('duration_minutes', 60),
            scheduled_date=data.get('scheduled_date'),
            end_date=data.get('end_date'),
            is_published=data.get('is_published', False),
            is_proctored=data.get('is_proctored', True),
            shuffle_questions=data.get('shuffle_questions', False),
            show_results=data.get('show_results', True)
        )
        
        # Add questions
        questions_data = data.get('questions', [])
        for idx, q_data in enumerate(questions_data):
            question = Question.objects.create(
                exam=exam,
                question_type=q_data.get('question_type', 'mcq'),
                question_text=q_data.get('question_text', ''),
                marks=q_data.get('marks', 1),
                order=idx + 1,
                option_a=q_data.get('option_a'),
                option_b=q_data.get('option_b'),
                option_c=q_data.get('option_c'),
                option_d=q_data.get('option_d'),
                correct_option=q_data.get('correct_option'),
                programming_language=q_data.get('programming_language'),
                starter_code=q_data.get('starter_code'),
                solution_code=q_data.get('solution_code')
            )
            
            # Add test cases for coding questions
            test_cases = q_data.get('test_cases', [])
            for tc_idx, tc_data in enumerate(test_cases):
                TestCase.objects.create(
                    question=question,
                    input_data=tc_data.get('input', ''),
                    expected_output=tc_data.get('output', ''),
                    is_sample=tc_data.get('is_sample', False),
                    order=tc_idx + 1
                )
        
        # Assign to students
        student_ids = data.get('student_ids', [])
        if student_ids:
            students = StudentProfile.objects.filter(id__in=student_ids)
            for student in students:
                ExamAssignment.objects.get_or_create(student=student, exam=exam)
        # If no explicit selection, auto-assign all students enrolled in the course
        elif exam.course_id:
            enrolled_students = StudentProfile.objects.filter(enrollments__course=exam.course).distinct()
            for student in enrolled_students:
                ExamAssignment.objects.get_or_create(student=student, exam=exam)
        
        return JsonResponse({
            'status': 'success',
            'exam': {
                'id': exam.id,
                'title': exam.title,
                'total_questions': exam.total_questions,
                'total_marks': exam.total_marks,
                'is_published': exam.is_published
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["DELETE"])
def delete_exam(request, exam_id):
    """API to delete an exam (Faculty only)"""
    try:
        # Check if user is faculty
        try:
            faculty = request.user.faculty_profile
        except:
            return JsonResponse({'error': 'Only faculty can delete exams'}, status=403)
        
        # Get the exam
        exam = get_object_or_404(Exam, id=exam_id, faculty=faculty)
        
        # Delete the exam (cascade will delete questions, test cases, etc.)
        exam_title = exam.title
        exam.delete()
        
        return JsonResponse({
            'status': 'success',
            'message': f'Exam "{exam_title}" deleted successfully'
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["DELETE"])
def delete_course(request, course_id):
    """API to delete a course (Faculty only)"""
    try:
        # Check if user is faculty
        try:
            faculty = request.user.faculty_profile
        except:
            return JsonResponse({'error': 'Only faculty can delete courses'}, status=403)
        
        # Course model is already imported at top of file
        # Get the course
        course = get_object_or_404(Course, id=course_id, faculty=faculty)
        
        # Delete the course (cascade will delete modules, enrollments, etc.)
        course_title = course.title
        course.delete()
        
        return JsonResponse({
            'status': 'success',
            'message': f'Course "{course_title}" deleted successfully'
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


# =====================================================
# Local Question Bank for AI-like Question Generation
# =====================================================
import random

QUESTION_BANK = {
    'python': {
        'mcq': {
            'easy': [
                {'question': 'What is the correct way to create a variable in Python?', 'option_a': 'var x = 5', 'option_b': 'x = 5', 'option_c': 'int x = 5', 'option_d': 'declare x = 5', 'correct': 'B'},
                {'question': 'Which of the following is used to define a function in Python?', 'option_a': 'function', 'option_b': 'def', 'option_c': 'func', 'option_d': 'define', 'correct': 'B'},
                {'question': 'What is the output of print(2 ** 3)?', 'option_a': '6', 'option_b': '8', 'option_c': '5', 'option_d': '9', 'correct': 'B'},
                {'question': 'Which data type is used to store a sequence of characters?', 'option_a': 'int', 'option_b': 'float', 'option_c': 'str', 'option_d': 'bool', 'correct': 'C'},
                {'question': 'What is the correct file extension for Python files?', 'option_a': '.python', 'option_b': '.py', 'option_c': '.pt', 'option_d': '.pyt', 'correct': 'B'},
                {'question': 'How do you insert comments in Python code?', 'option_a': '// comment', 'option_b': '/* comment */', 'option_c': '# comment', 'option_d': '-- comment', 'correct': 'C'},
                {'question': 'What is the output of print(type(5))?', 'option_a': 'int', 'option_b': '<class \'int\'>', 'option_c': 'integer', 'option_d': 'number', 'correct': 'B'},
                {'question': 'Which operator is used for floor division in Python?', 'option_a': '/', 'option_b': '//', 'option_c': '%', 'option_d': '**', 'correct': 'B'},
                {'question': 'What is the correct way to create a list in Python?', 'option_a': 'list = (1, 2, 3)', 'option_b': 'list = [1, 2, 3]', 'option_c': 'list = {1, 2, 3}', 'option_d': 'list = <1, 2, 3>', 'correct': 'B'},
                {'question': 'Which method is used to add an element to a list?', 'option_a': 'add()', 'option_b': 'append()', 'option_c': 'insert()', 'option_d': 'push()', 'correct': 'B'},
            ],
            'medium': [
                {'question': 'What is the output of print([1, 2, 3] + [4, 5])?', 'option_a': '[1, 2, 3, 4, 5]', 'option_b': '[5, 7, 3]', 'option_c': 'Error', 'option_d': '[[1, 2, 3], [4, 5]]', 'correct': 'A'},
                {'question': 'What does the "self" parameter represent in a class method?', 'option_a': 'The class itself', 'option_b': 'The instance of the class', 'option_c': 'A global variable', 'option_d': 'Nothing specific', 'correct': 'B'},
                {'question': 'Which of the following creates a dictionary?', 'option_a': 'd = []', 'option_b': 'd = ()', 'option_c': 'd = {}', 'option_d': 'd = <>', 'correct': 'C'},
                {'question': 'What is the output of "Hello"[1:4]?', 'option_a': 'Hel', 'option_b': 'ell', 'option_c': 'ello', 'option_d': 'Hell', 'correct': 'B'},
                {'question': 'Which keyword is used to handle exceptions in Python?', 'option_a': 'catch', 'option_b': 'except', 'option_c': 'handle', 'option_d': 'error', 'correct': 'B'},
                {'question': 'What is the output of len("Python")?', 'option_a': '5', 'option_b': '6', 'option_c': '7', 'option_d': 'Error', 'correct': 'B'},
                {'question': 'Which method removes the last element from a list?', 'option_a': 'remove()', 'option_b': 'pop()', 'option_c': 'delete()', 'option_d': 'discard()', 'correct': 'B'},
                {'question': 'What is a lambda function in Python?', 'option_a': 'A named function', 'option_b': 'An anonymous function', 'option_c': 'A recursive function', 'option_d': 'A generator function', 'correct': 'B'},
                {'question': 'What does the range(5) function return?', 'option_a': '[0, 1, 2, 3, 4, 5]', 'option_b': '[1, 2, 3, 4, 5]', 'option_c': 'range(0, 5)', 'option_d': '[0, 1, 2, 3, 4]', 'correct': 'C'},
                {'question': 'Which statement is used to exit a loop prematurely?', 'option_a': 'exit', 'option_b': 'break', 'option_c': 'stop', 'option_d': 'end', 'correct': 'B'},
            ],
            'hard': [
                {'question': 'What is the output of print(bool([]))?', 'option_a': 'True', 'option_b': 'False', 'option_c': 'None', 'option_d': 'Error', 'correct': 'B'},
                {'question': 'Which of the following is NOT a valid way to create an empty set?', 'option_a': 'set()', 'option_b': '{}', 'option_c': 'set([])', 'option_d': 'set(())', 'correct': 'B'},
                {'question': 'What is the time complexity of searching in a Python dictionary?', 'option_a': 'O(n)', 'option_b': 'O(1)', 'option_c': 'O(log n)', 'option_d': 'O(n²)', 'correct': 'B'},
                {'question': 'What is a decorator in Python?', 'option_a': 'A type of loop', 'option_b': 'A function that modifies another function', 'option_c': 'A data structure', 'option_d': 'A class method', 'correct': 'B'},
                {'question': 'What is the Global Interpreter Lock (GIL)?', 'option_a': 'A debugging tool', 'option_b': 'A mutex for thread safety', 'option_c': 'A memory management system', 'option_d': 'A syntax checker', 'correct': 'B'},
                {'question': 'What is the difference between deepcopy and shallow copy?', 'option_a': 'No difference', 'option_b': 'Deepcopy creates copies of nested objects', 'option_c': 'Shallow copy is faster', 'option_d': 'Deepcopy only works with lists', 'correct': 'B'},
                {'question': 'What does *args do in a function definition?', 'option_a': 'Accepts keyword arguments', 'option_b': 'Accepts variable positional arguments', 'option_c': 'Creates a pointer', 'option_d': 'Multiplies arguments', 'correct': 'B'},
                {'question': 'Which method is called when an object is created?', 'option_a': '__create__', 'option_b': '__init__', 'option_c': '__new__', 'option_d': '__start__', 'correct': 'B'},
            ]
        },
        'coding': {
            'easy': [
                {'problem': 'Write a function that returns the sum of two numbers.', 'starter_code': 'def add(a, b):\n    # Your code here\n    pass', 'solution': 'def add(a, b):\n    return a + b', 'test_cases': [{'input': '2, 3', 'output': '5', 'is_sample': True}, {'input': '0, 0', 'output': '0', 'is_sample': False}, {'input': '-1, 1', 'output': '0', 'is_sample': False}]},
                {'problem': 'Write a function that returns the square of a number.', 'starter_code': 'def square(n):\n    # Your code here\n    pass', 'solution': 'def square(n):\n    return n * n', 'test_cases': [{'input': '4', 'output': '16', 'is_sample': True}, {'input': '0', 'output': '0', 'is_sample': False}, {'input': '-3', 'output': '9', 'is_sample': False}]},
                {'problem': 'Write a function that checks if a number is even.', 'starter_code': 'def is_even(n):\n    # Your code here\n    pass', 'solution': 'def is_even(n):\n    return n % 2 == 0', 'test_cases': [{'input': '4', 'output': 'True', 'is_sample': True}, {'input': '7', 'output': 'False', 'is_sample': False}, {'input': '0', 'output': 'True', 'is_sample': False}]},
                {'problem': 'Write a function that returns the maximum of two numbers.', 'starter_code': 'def maximum(a, b):\n    # Your code here\n    pass', 'solution': 'def maximum(a, b):\n    return a if a > b else b', 'test_cases': [{'input': '5, 3', 'output': '5', 'is_sample': True}, {'input': '2, 8', 'output': '8', 'is_sample': False}, {'input': '4, 4', 'output': '4', 'is_sample': False}]},
            ],
            'medium': [
                {'problem': 'Write a function that reverses a string.', 'starter_code': 'def reverse_string(s):\n    # Your code here\n    pass', 'solution': 'def reverse_string(s):\n    return s[::-1]', 'test_cases': [{'input': '"hello"', 'output': '"olleh"', 'is_sample': True}, {'input': '"Python"', 'output': '"nohtyP"', 'is_sample': False}, {'input': '""', 'output': '""', 'is_sample': False}]},
                {'problem': 'Write a function that finds the factorial of a number.', 'starter_code': 'def factorial(n):\n    # Your code here\n    pass', 'solution': 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n-1)', 'test_cases': [{'input': '5', 'output': '120', 'is_sample': True}, {'input': '0', 'output': '1', 'is_sample': False}, {'input': '3', 'output': '6', 'is_sample': False}]},
                {'problem': 'Write a function that checks if a string is a palindrome.', 'starter_code': 'def is_palindrome(s):\n    # Your code here\n    pass', 'solution': 'def is_palindrome(s):\n    return s == s[::-1]', 'test_cases': [{'input': '"radar"', 'output': 'True', 'is_sample': True}, {'input': '"hello"', 'output': 'False', 'is_sample': False}, {'input': '"level"', 'output': 'True', 'is_sample': False}]},
                {'problem': 'Write a function that returns the nth Fibonacci number.', 'starter_code': 'def fibonacci(n):\n    # Your code here\n    pass', 'solution': 'def fibonacci(n):\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(2, n+1):\n        a, b = b, a + b\n    return b', 'test_cases': [{'input': '6', 'output': '8', 'is_sample': True}, {'input': '0', 'output': '0', 'is_sample': False}, {'input': '10', 'output': '55', 'is_sample': False}]},
            ],
            'hard': [
                {'problem': 'Write a function that finds all prime numbers up to n using the Sieve of Eratosthenes.', 'starter_code': 'def sieve_primes(n):\n    # Your code here\n    pass', 'solution': 'def sieve_primes(n):\n    if n < 2:\n        return []\n    sieve = [True] * (n + 1)\n    sieve[0] = sieve[1] = False\n    for i in range(2, int(n**0.5) + 1):\n        if sieve[i]:\n            for j in range(i*i, n + 1, i):\n                sieve[j] = False\n    return [i for i in range(n + 1) if sieve[i]]', 'test_cases': [{'input': '10', 'output': '[2, 3, 5, 7]', 'is_sample': True}, {'input': '20', 'output': '[2, 3, 5, 7, 11, 13, 17, 19]', 'is_sample': False}, {'input': '1', 'output': '[]', 'is_sample': False}]},
                {'problem': 'Write a function that implements binary search on a sorted list.', 'starter_code': 'def binary_search(arr, target):\n    # Your code here\n    pass', 'solution': 'def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1', 'test_cases': [{'input': '[1,2,3,4,5], 3', 'output': '2', 'is_sample': True}, {'input': '[1,2,3,4,5], 6', 'output': '-1', 'is_sample': False}, {'input': '[1], 1', 'output': '0', 'is_sample': False}]},
                {'problem': 'Write a function that merges two sorted lists into one sorted list.', 'starter_code': 'def merge_sorted(list1, list2):\n    # Your code here\n    pass', 'solution': 'def merge_sorted(list1, list2):\n    result = []\n    i = j = 0\n    while i < len(list1) and j < len(list2):\n        if list1[i] <= list2[j]:\n            result.append(list1[i])\n            i += 1\n        else:\n            result.append(list2[j])\n            j += 1\n    result.extend(list1[i:])\n    result.extend(list2[j:])\n    return result', 'test_cases': [{'input': '[1,3,5], [2,4,6]', 'output': '[1,2,3,4,5,6]', 'is_sample': True}, {'input': '[1,2], [3,4]', 'output': '[1,2,3,4]', 'is_sample': False}, {'input': '[], [1,2]', 'output': '[1,2]', 'is_sample': False}]},
            ]
        }
    },
    'javascript': {
        'mcq': {
            'easy': [
                {'question': 'Which keyword is used to declare a variable in JavaScript?', 'option_a': 'var', 'option_b': 'let', 'option_c': 'const', 'option_d': 'All of the above', 'correct': 'D'},
                {'question': 'What is the output of typeof null?', 'option_a': 'null', 'option_b': 'undefined', 'option_c': 'object', 'option_d': 'number', 'correct': 'C'},
                {'question': 'Which method adds an element to the end of an array?', 'option_a': 'push()', 'option_b': 'pop()', 'option_c': 'shift()', 'option_d': 'unshift()', 'correct': 'A'},
                {'question': 'How do you write a comment in JavaScript?', 'option_a': '# comment', 'option_b': '// comment', 'option_c': '<!-- comment -->', 'option_d': '** comment **', 'correct': 'B'},
                {'question': 'Which symbol is used for strict equality?', 'option_a': '==', 'option_b': '===', 'option_c': '=', 'option_d': '!=', 'correct': 'B'},
            ],
            'medium': [
                {'question': 'What is a closure in JavaScript?', 'option_a': 'A way to close the browser', 'option_b': 'A function with access to outer scope variables', 'option_c': 'A type of loop', 'option_d': 'An error handler', 'correct': 'B'},
                {'question': 'What does JSON stand for?', 'option_a': 'JavaScript Object Notation', 'option_b': 'Java Standard Object Notation', 'option_c': 'JavaScript Online Notation', 'option_d': 'Java Syntax Object Naming', 'correct': 'A'},
                {'question': 'Which method converts a JSON string to an object?', 'option_a': 'JSON.stringify()', 'option_b': 'JSON.parse()', 'option_c': 'JSON.convert()', 'option_d': 'JSON.object()', 'correct': 'B'},
                {'question': 'What is the output of console.log(1 + "2")?', 'option_a': '3', 'option_b': '12', 'option_c': 'NaN', 'option_d': 'Error', 'correct': 'B'},
                {'question': 'What is the purpose of the "this" keyword?', 'option_a': 'Refers to the current function', 'option_b': 'Refers to the current object', 'option_c': 'Creates a new variable', 'option_d': 'Defines a class', 'correct': 'B'},
            ],
            'hard': [
                {'question': 'What is the event loop in JavaScript?', 'option_a': 'A type of for loop', 'option_b': 'Mechanism for handling async operations', 'option_c': 'A debugging tool', 'option_d': 'A way to iterate arrays', 'correct': 'B'},
                {'question': 'What is the difference between call() and apply()?', 'option_a': 'No difference', 'option_b': 'call() takes arguments as array', 'option_c': 'apply() takes arguments as array', 'option_d': 'They work on different data types', 'correct': 'C'},
                {'question': 'What is prototypal inheritance?', 'option_a': 'Classical inheritance like Java', 'option_b': 'Objects inherit from other objects', 'option_c': 'A design pattern', 'option_d': 'A way to create functions', 'correct': 'B'},
            ]
        },
        'coding': {
            'easy': [
                {'problem': 'Write a function that returns the sum of two numbers.', 'starter_code': 'function add(a, b) {\n    // Your code here\n}', 'solution': 'function add(a, b) {\n    return a + b;\n}', 'test_cases': [{'input': '2, 3', 'output': '5', 'is_sample': True}, {'input': '0, 0', 'output': '0', 'is_sample': False}]},
                {'problem': 'Write a function that checks if a number is positive.', 'starter_code': 'function isPositive(n) {\n    // Your code here\n}', 'solution': 'function isPositive(n) {\n    return n > 0;\n}', 'test_cases': [{'input': '5', 'output': 'true', 'is_sample': True}, {'input': '-3', 'output': 'false', 'is_sample': False}]},
            ],
            'medium': [
                {'problem': 'Write a function that reverses an array.', 'starter_code': 'function reverseArray(arr) {\n    // Your code here\n}', 'solution': 'function reverseArray(arr) {\n    return arr.reverse();\n}', 'test_cases': [{'input': '[1, 2, 3]', 'output': '[3, 2, 1]', 'is_sample': True}, {'input': '[]', 'output': '[]', 'is_sample': False}]},
                {'problem': 'Write a function that finds the maximum element in an array.', 'starter_code': 'function findMax(arr) {\n    // Your code here\n}', 'solution': 'function findMax(arr) {\n    return Math.max(...arr);\n}', 'test_cases': [{'input': '[1, 5, 3]', 'output': '5', 'is_sample': True}, {'input': '[-1, -5]', 'output': '-1', 'is_sample': False}]},
            ],
            'hard': [
                {'problem': 'Write a function that flattens a nested array.', 'starter_code': 'function flatten(arr) {\n    // Your code here\n}', 'solution': 'function flatten(arr) {\n    return arr.flat(Infinity);\n}', 'test_cases': [{'input': '[[1, 2], [3, [4, 5]]]', 'output': '[1, 2, 3, 4, 5]', 'is_sample': True}]},
            ]
        }
    },
    'java': {
        'mcq': {
            'easy': [
                {'question': 'Which keyword is used to define a class in Java?', 'option_a': 'class', 'option_b': 'Class', 'option_c': 'define', 'option_d': 'struct', 'correct': 'A'},
                {'question': 'What is the default value of an int variable in Java?', 'option_a': 'null', 'option_b': '0', 'option_c': 'undefined', 'option_d': '1', 'correct': 'B'},
                {'question': 'Which method is the entry point of a Java program?', 'option_a': 'start()', 'option_b': 'main()', 'option_c': 'run()', 'option_d': 'init()', 'correct': 'B'},
            ],
            'medium': [
                {'question': 'What is the difference between == and .equals() in Java?', 'option_a': 'No difference', 'option_b': '== compares references, .equals() compares values', 'option_c': '.equals() compares references', 'option_d': 'They work the same for all types', 'correct': 'B'},
                {'question': 'What is polymorphism in Java?', 'option_a': 'Multiple inheritance', 'option_b': 'Ability to take many forms', 'option_c': 'Encapsulation', 'option_d': 'Data hiding', 'correct': 'B'},
            ],
            'hard': [
                {'question': 'What is the purpose of the volatile keyword?', 'option_a': 'Makes variable constant', 'option_b': 'Ensures visibility across threads', 'option_c': 'Prevents garbage collection', 'option_d': 'Improves performance', 'correct': 'B'},
            ]
        },
        'coding': {
            'easy': [
                {'problem': 'Write a method that returns the sum of two integers.', 'starter_code': 'public static int add(int a, int b) {\n    // Your code here\n    return 0;\n}', 'solution': 'public static int add(int a, int b) {\n    return a + b;\n}', 'test_cases': [{'input': '2, 3', 'output': '5', 'is_sample': True}]},
            ],
            'medium': [
                {'problem': 'Write a method that checks if a string is a palindrome.', 'starter_code': 'public static boolean isPalindrome(String s) {\n    // Your code here\n    return false;\n}', 'solution': 'public static boolean isPalindrome(String s) {\n    String reversed = new StringBuilder(s).reverse().toString();\n    return s.equals(reversed);\n}', 'test_cases': [{'input': '"radar"', 'output': 'true', 'is_sample': True}]},
            ],
            'hard': [
                {'problem': 'Write a method that implements binary search.', 'starter_code': 'public static int binarySearch(int[] arr, int target) {\n    // Your code here\n    return -1;\n}', 'solution': 'public static int binarySearch(int[] arr, int target) {\n    int left = 0, right = arr.length - 1;\n    while (left <= right) {\n        int mid = (left + right) / 2;\n        if (arr[mid] == target) return mid;\n        else if (arr[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}', 'test_cases': [{'input': '[1,2,3,4,5], 3', 'output': '2', 'is_sample': True}]},
            ]
        }
    },
    'data structures': {
        'mcq': {
            'easy': [
                {'question': 'What is the time complexity of accessing an element in an array by index?', 'option_a': 'O(n)', 'option_b': 'O(1)', 'option_c': 'O(log n)', 'option_d': 'O(n²)', 'correct': 'B'},
                {'question': 'Which data structure uses LIFO (Last In First Out)?', 'option_a': 'Queue', 'option_b': 'Stack', 'option_c': 'Array', 'option_d': 'Linked List', 'correct': 'B'},
                {'question': 'Which data structure uses FIFO (First In First Out)?', 'option_a': 'Stack', 'option_b': 'Queue', 'option_c': 'Tree', 'option_d': 'Graph', 'correct': 'B'},
            ],
            'medium': [
                {'question': 'What is the time complexity of inserting at the beginning of a linked list?', 'option_a': 'O(n)', 'option_b': 'O(1)', 'option_c': 'O(log n)', 'option_d': 'O(n²)', 'correct': 'B'},
                {'question': 'Which tree traversal visits nodes in Left-Root-Right order?', 'option_a': 'Preorder', 'option_b': 'Inorder', 'option_c': 'Postorder', 'option_d': 'Level order', 'correct': 'B'},
                {'question': 'What is a balanced binary search tree?', 'option_a': 'Tree with equal left and right subtrees', 'option_b': 'Tree where height difference is at most 1', 'option_c': 'Complete binary tree', 'option_d': 'Full binary tree', 'correct': 'B'},
            ],
            'hard': [
                {'question': 'What is the average time complexity of operations in a hash table?', 'option_a': 'O(n)', 'option_b': 'O(1)', 'option_c': 'O(log n)', 'option_d': 'O(n log n)', 'correct': 'B'},
                {'question': 'What is the space complexity of a recursive function with depth n?', 'option_a': 'O(1)', 'option_b': 'O(n)', 'option_c': 'O(log n)', 'option_d': 'O(n²)', 'correct': 'B'},
            ]
        },
        'coding': {
            'easy': [
                {'problem': 'Implement a function to check if parentheses are balanced.', 'starter_code': 'def is_balanced(s):\n    # Your code here\n    pass', 'solution': 'def is_balanced(s):\n    stack = []\n    for char in s:\n        if char == "(":\n            stack.append(char)\n        elif char == ")":\n            if not stack:\n                return False\n            stack.pop()\n    return len(stack) == 0', 'test_cases': [{'input': '"(())"', 'output': 'True', 'is_sample': True}, {'input': '"(()"', 'output': 'False', 'is_sample': False}]},
            ],
            'medium': [
                {'problem': 'Implement a queue using two stacks.', 'starter_code': 'class Queue:\n    def __init__(self):\n        self.stack1 = []\n        self.stack2 = []\n    \n    def enqueue(self, x):\n        # Your code here\n        pass\n    \n    def dequeue(self):\n        # Your code here\n        pass', 'solution': 'class Queue:\n    def __init__(self):\n        self.stack1 = []\n        self.stack2 = []\n    \n    def enqueue(self, x):\n        self.stack1.append(x)\n    \n    def dequeue(self):\n        if not self.stack2:\n            while self.stack1:\n                self.stack2.append(self.stack1.pop())\n        return self.stack2.pop() if self.stack2 else None', 'test_cases': [{'input': 'enqueue(1), enqueue(2), dequeue()', 'output': '1', 'is_sample': True}]},
            ],
            'hard': [
                {'problem': 'Find the kth smallest element in a BST.', 'starter_code': 'def kth_smallest(root, k):\n    # Your code here\n    pass', 'solution': 'def kth_smallest(root, k):\n    stack = []\n    current = root\n    count = 0\n    while stack or current:\n        while current:\n            stack.append(current)\n            current = current.left\n        current = stack.pop()\n        count += 1\n        if count == k:\n            return current.val\n        current = current.right\n    return None', 'test_cases': [{'input': 'BST: [3,1,4,null,2], k=1', 'output': '1', 'is_sample': True}]},
            ]
        }
    }
}

def _generate_questions_local(topic, num_mcq, num_coding, difficulty, programming_language, marks_per_mcq, marks_per_coding):
    """Generate questions from local question bank based on topic."""
    questions = []
    
    # Normalize topic to match question bank keys
    topic_lower = topic.lower().strip()
    
    # Find matching category in question bank
    matched_category = None
    for category in QUESTION_BANK.keys():
        if category in topic_lower or topic_lower in category:
            matched_category = category
            break
    
    # If no match, default to python or the programming language
    if not matched_category:
        if programming_language.lower() in QUESTION_BANK:
            matched_category = programming_language.lower()
        else:
            matched_category = 'python'
    
    category_bank = QUESTION_BANK.get(matched_category, QUESTION_BANK['python'])
    
    # Get MCQ questions
    if num_mcq > 0:
        mcq_pool = category_bank.get('mcq', {}).get(difficulty, [])
        if not mcq_pool:
            # Fall back to medium if specified difficulty not available
            mcq_pool = category_bank.get('mcq', {}).get('medium', [])
        
        selected_mcqs = random.sample(mcq_pool, min(num_mcq, len(mcq_pool)))
        for q in selected_mcqs:
            questions.append({
                'question_type': 'mcq',
                'question_text': q['question'],
                'option_a': q['option_a'],
                'option_b': q['option_b'],
                'option_c': q['option_c'],
                'option_d': q['option_d'],
                'correct_option': q['correct'],
                'marks': marks_per_mcq
            })
    
    # Get coding questions
    if num_coding > 0:
        coding_pool = category_bank.get('coding', {}).get(difficulty, [])
        if not coding_pool:
            coding_pool = category_bank.get('coding', {}).get('medium', [])
        
        selected_coding = random.sample(coding_pool, min(num_coding, len(coding_pool)))
        for q in selected_coding:
            questions.append({
                'question_type': 'coding',
                'question_text': q['problem'],
                'programming_language': programming_language,
                'starter_code': q['starter_code'],
                'solution_code': q['solution'],
                'test_cases': q['test_cases'],
                'marks': marks_per_coding
            })
    
    return questions


@login_required
@require_http_methods(["POST"])
def generate_exam_ai(request):
    """API to generate exam questions - uses local question bank (no external API needed)"""
    try:
        # Check if user is faculty
        try:
            faculty = request.user.faculty_profile
        except:
            return JsonResponse({'error': 'Only faculty can generate exams'}, status=403)
        
        data = json.loads(request.body)
        
        topic = data.get('topic', 'General Programming')
        num_mcq = data.get('num_mcq', 5)
        num_coding = data.get('num_coding', 2)
        difficulty = data.get('difficulty', 'medium')
        marks_per_mcq = data.get('marks_per_mcq', 2)
        marks_per_coding = data.get('marks_per_coding', 10)
        programming_language = data.get('programming_language', 'python')
        
        # Generate questions from local question bank
        questions = _generate_questions_local(
            topic=topic,
            num_mcq=num_mcq,
            num_coding=num_coding,
            difficulty=difficulty,
            programming_language=programming_language,
            marks_per_mcq=marks_per_mcq,
            marks_per_coding=marks_per_coding
        )
        
        return JsonResponse({
            'status': 'success',
            'questions': questions,
            'total_generated': len(questions),
            'source': 'local_question_bank'
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def get_faculty_exams(request):
    """API to get all exams created by the faculty"""
    try:
        try:
            faculty = request.user.faculty_profile
        except:
            return JsonResponse({'error': 'Faculty profile not found'}, status=403)
        
        exams = Exam.objects.filter(faculty=faculty).select_related('course')
        
        exams_data = []
        for exam in exams:
            exams_data.append({
                'id': exam.id,
                'title': exam.title,
                'description': exam.description,
                'course_title': exam.course.title if exam.course else None,
                'topic': exam.topic,
                'difficulty': exam.difficulty,
                'total_marks': exam.total_marks,
                'duration_minutes': exam.duration_minutes,
                'total_questions': exam.total_questions,
                'mcq_count': exam.mcq_count,
                'coding_count': exam.coding_count,
                'scheduled_date': exam.scheduled_date.isoformat() if exam.scheduled_date else None,
                'is_published': exam.is_published,
                'is_proctored': exam.is_proctored,
                'students_assigned': exam.assignments.count(),
                'students_attempted': exam.attempts.count(),
                'created_at': exam.created_at.isoformat()
            })
        
        return JsonResponse({'exams': exams_data})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def get_student_exams_by_roll(request, roll_number):
    """API to get exams assigned to a student - for frontend access"""
    try:
        try:
            student = StudentProfile.objects.get(roll_number=roll_number)
        except StudentProfile.DoesNotExist:
            return JsonResponse({'error': 'Student not found', 'exams': []}, status=200)
        
        from django.utils import timezone
        now = timezone.now()
        
        # Get assigned exams
        assignments = ExamAssignment.objects.filter(student=student).select_related('exam', 'exam__course', 'exam__faculty')
        
        upcoming_exams = []
        completed_exams = []
        
        for assignment in assignments:
            exam = assignment.exam
            if not exam.is_published:
                continue
            
            # Check if student has attempted this exam
            attempt = ExamAttempt.objects.filter(student=student, exam=exam).first()
            
            # Get questions for the exam
            questions = []
            for q in exam.questions.all():
                question_data = {
                    'id': q.id,
                    'question_type': q.question_type,
                    'question_text': q.question_text,
                    'marks': q.marks,
                    'order': q.order,
                }
                
                if q.question_type == 'mcq':
                    question_data['options'] = [q.option_a, q.option_b, q.option_c, q.option_d]
                    question_data['correct_option'] = q.correct_option
                elif q.question_type == 'coding':
                    question_data['programming_language'] = q.programming_language
                    question_data['starter_code'] = q.starter_code
                    question_data['test_cases'] = [
                        {
                            'input_data': tc.input_data,
                            'expected_output': tc.expected_output,
                            'is_sample': tc.is_sample
                        }
                        for tc in q.test_cases.all()
                    ]
                
                questions.append(question_data)
            
            exam_data = {
                'id': exam.id,
                'title': exam.title,
                'description': exam.description,
                'course_title': exam.course.title if exam.course else None,
                'faculty_name': exam.faculty.full_name,
                'topic': exam.topic,
                'difficulty': exam.difficulty,
                'total_marks': exam.total_marks,
                'passing_marks': exam.passing_marks,
                'duration_minutes': exam.duration_minutes,
                'total_questions': exam.total_questions,
                'mcq_count': exam.mcq_count,
                'coding_count': exam.coding_count,
                'scheduled_date': exam.scheduled_date.isoformat() if exam.scheduled_date else None,
                'end_date': exam.end_date.isoformat() if exam.end_date else None,
                'is_proctored': exam.is_proctored,
                'attempt_status': attempt.status if attempt else None,
                'score': attempt.score if attempt else None,
                'percentage': attempt.percentage if attempt else None,
                'passed': attempt.passed if attempt else None,
                'questions': questions
            }
            
            if attempt and attempt.status in ['submitted', 'evaluated']:
                completed_exams.append(exam_data)
            else:
                upcoming_exams.append(exam_data)
        
        return JsonResponse({
            'upcoming': upcoming_exams,
            'completed': completed_exams,
            'student_name': student.full_name
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e), 'exams': []}, status=500)


@login_required
def get_faculty_analytics(request):
    """Aggregate analytics for the faculty dashboard."""
    try:
        try:
            faculty = request.user.faculty_profile
        except Exception:
            return JsonResponse({'error': 'Only faculty can view analytics'}, status=403)

        exams = Exam.objects.filter(faculty=faculty)
        assignments = ExamAssignment.objects.filter(exam__in=exams)
        attempts = ExamAttempt.objects.filter(exam__in=exams, status__in=['submitted', 'evaluated'])

        total_attempts = attempts.count()
        total_assignments = assignments.count()

        avg_marks_obtained = attempts.aggregate(avg=Avg('total_marks_obtained'))['avg'] or 0
        avg_percentage = attempts.aggregate(avg=Avg('percentage'))['avg'] or 0
        avg_violations = attempts.aggregate(avg=Avg('suspicious_activities'))['avg'] or 0
        avg_tab_switches = attempts.aggregate(avg=Avg('tab_switches'))['avg'] or 0

        # Compute average time in seconds from timestamps (avoid DB duration math for clarity)
        total_time_seconds = 0
        timed_attempts = 0
        for attempt in attempts:
            if attempt.started_at and attempt.submitted_at:
                total_time_seconds += (attempt.submitted_at - attempt.started_at).total_seconds()
                timed_attempts += 1
        avg_time_seconds = (total_time_seconds / timed_attempts) if timed_attempts else 0

        # Completion rate = completed attempts / assignments
        completion_rate = (total_attempts / total_assignments * 100) if total_assignments else 0

        # Simple concentration score derived from violations + tab switches (lower violations -> higher score)
        concentration_score = max(0, min(100, 100 - (avg_violations * 10 + avg_tab_switches * 5)))

        return JsonResponse({
            'avg_marks_obtained': round(avg_marks_obtained, 2),
            'avg_percentage': round(avg_percentage, 2),
            'avg_time_seconds': round(avg_time_seconds, 2),
            'avg_violations': round(avg_violations, 2),
            'avg_tab_switches': round(avg_tab_switches, 2),
            'completion_rate': round(completion_rate, 2),
            'concentration_score': round(concentration_score, 2),
            'attempt_count': total_attempts,
            'assignment_count': total_assignments
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def change_password(request):
    """Change faculty user password."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)
    
    try:
        payload = json.loads(request.body.decode('utf-8'))
        current_password = payload.get('current_password')
        new_password = payload.get('new_password')
        
        if not current_password or not new_password:
            return JsonResponse({'error': 'Current and new passwords are required'}, status=400)
        
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'User not authenticated'}, status=401)
        
        # Check if current password is correct
        if not request.user.check_password(current_password):
            return JsonResponse({'error': 'Current password is incorrect'}, status=400)
        
        # Validate new password length
        if len(new_password) < 8:
            return JsonResponse({'error': 'New password must be at least 8 characters'}, status=400)
        
        # Set new password
        request.user.set_password(new_password)
        request.user.save()
        
        return JsonResponse({'success': True, 'message': 'Password changed successfully'})
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def submit_exam_attempt(request):
    """Record a student's exam submission (StudyMate frontend)."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)

    try:
        from django.utils import timezone

        payload = json.loads(request.body.decode('utf-8')) if request.body else {}
        exam_id = payload.get('exam_id')
        roll_number = payload.get('roll_number')

        if not exam_id or not roll_number:
            return JsonResponse({'error': 'exam_id and roll_number are required'}, status=400)

        exam = get_object_or_404(Exam, id=exam_id)
        student = get_object_or_404(StudentProfile, roll_number=roll_number)

        # Only allow assigned students to submit
        if not ExamAssignment.objects.filter(student=student, exam=exam).exists():
            return JsonResponse({'error': 'Student is not assigned to this exam'}, status=403)

        # Enforce single attempt
        existing_attempt = ExamAttempt.objects.filter(student=student, exam=exam).first()
        if existing_attempt and existing_attempt.status in ['submitted', 'evaluated']:
            return JsonResponse({'error': 'Exam already submitted'}, status=409)

        attempt = existing_attempt or ExamAttempt.objects.create(student=student, exam=exam, status='in_progress')

        # Extract payload details
        mcq_answers = payload.get('mcq_answers', {}) or {}
        coding_answers = payload.get('coding_answers', {}) or {}
        violation_count = payload.get('violation_count') or 0
        status = payload.get('status', 'submitted')
        time_taken_seconds = payload.get('time_taken_seconds') or 0

        total_marks_obtained = 0
        total_possible_marks = 0

        # Evaluate and store answers
        for question in exam.questions.all():
            total_possible_marks += question.marks or 0

            # Ensure we have a StudentAnswer row
            answer_obj, _ = StudentAnswer.objects.get_or_create(attempt=attempt, question=question)

            if question.question_type == 'mcq':
                selected_option = mcq_answers.get(str(question.id)) or mcq_answers.get(question.id)
                answer_obj.selected_option = selected_option
                if selected_option and question.correct_option:
                    is_correct = selected_option.strip().upper() == question.correct_option.strip().upper()
                else:
                    is_correct = False
                answer_obj.is_correct = is_correct
                answer_obj.marks_obtained = question.marks if is_correct else 0
                total_marks_obtained += answer_obj.marks_obtained
            else:
                submitted_code = coding_answers.get(str(question.id)) or coding_answers.get(question.id)
                answer_obj.submitted_code = submitted_code
                # Coding auto-evaluation not implemented; keep marks at current/default
                answer_obj.is_correct = None if submitted_code else False
                answer_obj.marks_obtained = answer_obj.marks_obtained or 0
                # Store test case counts for UI clarity
                answer_obj.total_test_cases = question.test_cases.count()
                answer_obj.test_cases_passed = 0

            answer_obj.save()

        # Calculate aggregates
        attempt.total_marks_obtained = total_marks_obtained
        attempt.score = total_marks_obtained
        attempt.percentage = (total_marks_obtained / exam.total_marks * 100) if exam.total_marks else 0
        attempt.passed = total_marks_obtained >= exam.passing_marks if exam.passing_marks is not None else None
        attempt.suspicious_activities = violation_count
        attempt.status = 'submitted' if status != 'blocked' else 'submitted'
        attempt.submitted_at = timezone.now()

        # Estimate start time from time taken if provided
        if time_taken_seconds:
            attempt.started_at = attempt.submitted_at - datetime.timedelta(seconds=time_taken_seconds)

        attempt.save()

        return JsonResponse({
            'message': 'Submission recorded',
            'score': attempt.score,
            'percentage': attempt.percentage,
            'passed': attempt.passed,
            'status': attempt.status
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


# ==========================
# StudyMate Frontend Views
# ==========================

def studymate_dashboard(request):
    """Serve the StudyMate student dashboard"""
    from django.conf import settings
    import os
    
    # Read the HTML file
    frontend_path = settings.BASE_DIR.parent.parent / 'frontend' / 'index.html'
    
    try:
        with open(frontend_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        from django.http import HttpResponse
        return HttpResponse(html_content, content_type='text/html')
    except FileNotFoundError:
        from django.http import HttpResponseNotFound
        return HttpResponseNotFound('StudyMate dashboard not found')


def proctored_exam_view(request):
    """Serve the proctored exam page"""
    from django.conf import settings
    import os
    
    # Read the HTML file
    frontend_path = settings.BASE_DIR.parent.parent / 'frontend' / 'proctored_exam.html'
    
    try:
        with open(frontend_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        from django.http import HttpResponse
        return HttpResponse(html_content, content_type='text/html')
    except FileNotFoundError:
        from django.http import HttpResponseNotFound
        return HttpResponseNotFound('Proctored exam page not found')


# ==========================
# Exam Monitoring APIs
# ==========================
@login_required
def get_exam_submissions(request, exam_id):
    """Get all submissions for an exam with scores (Faculty only)"""
    try:
        # Check if user is faculty
        try:
            faculty = request.user.faculty_profile
        except:
            return JsonResponse({'error': 'Only faculty can view submissions'}, status=403)
        
        exam = get_object_or_404(Exam, id=exam_id, faculty=faculty)
        
        # Get all assignments for this exam
        assignments = ExamAssignment.objects.filter(exam=exam).select_related('student')
        
        submissions_data = []
        for assignment in assignments:
            student = assignment.student
            
            # Get attempt if exists
            attempt = ExamAttempt.objects.filter(student=student, exam=exam).first()
            
            # Determine status
            if attempt:
                if attempt.status == 'submitted' or attempt.status == 'evaluated':
                    status = 'completed'
                else:
                    status = 'attempting'
            else:
                status = 'not_started'
            
            # Get violation count if exists
            violation_count = attempt.suspicious_activities if attempt else 0
            
            submissions_data.append({
                'student_name': student.full_name,
                'roll_number': student.roll_number,
                'status': status,
                'progress': int((attempt.percentage or 0)) if attempt else 0,
                'score': attempt.score if attempt else None,
                'percentage': attempt.percentage if attempt else None,
                'total_marks_obtained': attempt.total_marks_obtained if attempt else 0,
                'time_taken': (attempt.submitted_at - attempt.started_at).total_seconds() if attempt and attempt.submitted_at else 0,
                'passed': attempt.passed if attempt else None,
                'violation_count': violation_count,
                'submitted_at': attempt.submitted_at.isoformat() if attempt and attempt.submitted_at else None
            })
        
        total_assigned = assignments.count()
        
        return JsonResponse({
            'exam_title': exam.title,
            'course_name': exam.course.title if exam.course else 'Standalone Exam',
            'total_assigned': total_assigned,
            'submissions': submissions_data
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def get_student_exam_submission(request, exam_id, roll_number):
    """Get detailed submission for a specific student (Faculty only)"""
    try:
        # Check if user is faculty
        try:
            faculty = request.user.faculty_profile
        except:
            return JsonResponse({'error': 'Only faculty can view submissions'}, status=403)
        
        exam = get_object_or_404(Exam, id=exam_id, faculty=faculty)
        student = get_object_or_404(StudentProfile, roll_number=roll_number)
        
        attempt = ExamAttempt.objects.filter(student=student, exam=exam).first()
        
        if not attempt:
            return JsonResponse({
                'student_name': student.full_name,
                'roll_number': roll_number,
                'status': 'not_started',
                'message': 'Student has not started the exam'
            })
        
        # Get all answers
        answers_data = []
        for answer in attempt.answers.all():
            question = answer.question
            answers_data.append({
                'question_id': question.id,
                'question_text': question.question_text,
                'question_type': question.question_type,
                'marks': question.marks,
                'marks_obtained': answer.marks_obtained,
                'is_correct': answer.is_correct,
                'submitted_code': answer.submitted_code if question.question_type == 'coding' else None,
                'selected_option': answer.selected_option if question.question_type == 'mcq' else None,
                'correct_option': question.correct_option if question.question_type == 'mcq' else None,
                'test_cases_passed': answer.test_cases_passed,
                'total_test_cases': answer.total_test_cases
            })
        
        return JsonResponse({
            'student_name': student.full_name,
            'roll_number': roll_number,
            'status': 'completed' if attempt.status in ['submitted', 'evaluated'] else 'attempting',
            'score': attempt.score,
            'percentage': attempt.percentage,
            'total_marks_obtained': attempt.total_marks_obtained,
            'passed': attempt.passed,
            'started_at': attempt.started_at.isoformat(),
            'submitted_at': attempt.submitted_at.isoformat() if attempt.submitted_at else None,
            'tab_switches': attempt.tab_switches,
            'suspicious_activities': attempt.suspicious_activities,
            'answers': answers_data
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def export_exam_results(request, exam_id):
    """Export exam results as CSV (Faculty only)"""
    try:
        # Check if user is faculty
        try:
            faculty = request.user.faculty_profile
        except:
            return JsonResponse({'error': 'Only faculty can export results'}, status=403)
        
        exam = get_object_or_404(Exam, id=exam_id, faculty=faculty)
        
        # Get submissions
        assignments = ExamAssignment.objects.filter(exam=exam).select_related('student')
        
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="exam_{exam_id}_results.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Student Name', 'Roll Number', 'Status', 'Score', 'Percentage', 'Passed', 'Submitted At'])
        
        for assignment in assignments:
            student = assignment.student
            attempt = ExamAttempt.objects.filter(student=student, exam=exam).first()
            
            if attempt and attempt.status in ['submitted', 'evaluated']:
                writer.writerow([
                    student.full_name,
                    student.roll_number,
                    'Completed',
                    attempt.score or 'N/A',
                    f"{attempt.percentage}%" if attempt.percentage else 'N/A',
                    'Yes' if attempt.passed else 'No' if attempt.passed is not None else 'N/A',
                    attempt.submitted_at.strftime('%Y-%m-%d %H:%M:%S') if attempt.submitted_at else ''
                ])
            else:
                writer.writerow([
                    student.full_name,
                    student.roll_number,
                    'Not Completed',
                    'N/A', 'N/A', 'N/A', ''
                ])
        
        return response
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

