from django.db import models
from django.contrib.auth.models import User

# ------------------------------
# Student profile for login
# ------------------------------
class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=128)
    dob = models.DateField()  # Date of Birth
    roll_number = models.CharField(max_length=50, unique=True, null=False, blank=False)
    def __str__(self):
        return self.full_name


# ------------------------------
# Faculty profile for login
# ------------------------------
class Faculty(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='faculty_profile')
    full_name = models.CharField(max_length=128)
    designation = models.CharField(max_length=128, blank=True, null=True)  # e.g., Professor, Associate Professor
    department = models.CharField(max_length=128, blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.full_name} ({self.user.username})"
    
    class Meta:
        verbose_name_plural = "Faculty"


# ------------------------------
# Candidate monitored for exam
# ------------------------------
class Candidate(models.Model):
    name = models.CharField(max_length=128)
    roll_number = models.CharField(max_length=50, unique=True, null=False, blank=False)
    email = models.EmailField(blank=True, null=True, unique=True)
    photo = models.ImageField(upload_to="candidate_photos/", blank=True, null=True)
    authorized_embedding = models.JSONField(blank=True, null=True)  # Face embeddings
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # --- Block system ---
    blocked = models.BooleanField(default=False)  # True if blocked by proctoring
    blocked_reason = models.TextField(blank=True, null=True)  # Reason for blocking

    def __str__(self):
        return f"{self.name} ({self.roll_number})"


# ------------------------------
# Exam / monitoring session
# ------------------------------
class Session(models.Model):
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sessions"
    )
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    verdict = models.CharField(
        max_length=16,
        choices=[("clean", "Clean"), ("suspicious", "Suspicious")],
        default="clean",
    )
    suspicion_score = models.FloatField(default=0.0)
    blocked = models.BooleanField(default=False)  # Block candidate if >3 suspicious events
    created_at = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)  # ✅ Add this line
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Session {self.id} - {self.candidate.name if self.candidate else 'Unknown'}"


# ------------------------------
# Suspicious / proctoring events
# ------------------------------
class Event(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="events")
    timestamp = models.DateTimeField(auto_now_add=True)
    event_type = models.CharField(
        max_length=64,
        choices=[
            ("face_mismatch", "Face Mismatch"),
            ("gaze_offscreen", "Gaze Offscreen"),
            ("multi_face", "Multiple Faces Detected"),
            ("audio_others", "Other Voices Detected"),
            ("device_detected", "Gadget Detected"),
        ],
    )
    details = models.TextField(blank=True)
    score = models.FloatField(default=0.0)  # Suspicion score for this event
    frame_file = models.ImageField(upload_to="evidence/frames/", null=True, blank=True)
    audio_file = models.FileField(upload_to="evidence/audio/", null=True, blank=True)

    def __str__(self):
        return f"{self.get_event_type_display()} - {self.timestamp.strftime('%H:%M:%S')}"


# ------------------------------
# Course created by Faculty
# ------------------------------
class Course(models.Model):
    title = models.CharField(max_length=256)
    description = models.TextField(blank=True, null=True)
    thumbnail = models.ImageField(upload_to="course_thumbnails/", blank=True, null=True)
    video_url = models.URLField(blank=True, null=True)  # YouTube URL for course intro/content
    study_hours = models.FloatField(default=4)  # Total hours students should study this course
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='courses')
    duration = models.CharField(max_length=50, blank=True, null=True)  # e.g., "4 weeks", "12 hours"
    level = models.CharField(max_length=50, choices=[
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ], default='beginner')
    category = models.CharField(max_length=128, blank=True, null=True)  # e.g., "Web Development", "Data Science"
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.faculty.full_name}"
    
    @property
    def modules_count(self):
        """Calculate number of modules based on study hours (~30 min per module)"""
        return max(1, int(self.study_hours * 2))

    class Meta:
        ordering = ['-created_at']


# ------------------------------
# Course Module/Chapter
# ------------------------------
class CourseModule(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=256)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    video_url = models.URLField(blank=True, null=True)
    content = models.TextField(blank=True, null=True)  # Rich text content
    duration_minutes = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.order}. {self.title}"

    class Meta:
        ordering = ['order']


# ------------------------------
# Student Enrollment in Course
# ------------------------------
class Enrollment(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    progress = models.FloatField(default=0.0)  # 0-100 percentage
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ['student', 'course']

    def __str__(self):
        return f"{self.student.full_name} - {self.course.title} ({self.progress}%)"


# ------------------------------
# Module Progress Tracking
# ------------------------------
class ModuleProgress(models.Model):
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='module_progress')
    module = models.ForeignKey(CourseModule, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(blank=True, null=True)
    time_spent_minutes = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ['enrollment', 'module']

    def __str__(self):
        return f"{self.enrollment.student.full_name} - {self.module.title}"


# ------------------------------
# Exam created by Faculty
# ------------------------------
class Exam(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    title = models.CharField(max_length=256)
    description = models.TextField(blank=True, null=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='exams', null=True, blank=True)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='exams')
    topic = models.CharField(max_length=256, blank=True, null=True)  # Topic for AI generation
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    total_marks = models.PositiveIntegerField(default=100)
    passing_marks = models.PositiveIntegerField(default=40)
    duration_minutes = models.PositiveIntegerField(default=60)
    scheduled_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    is_published = models.BooleanField(default=False)
    is_proctored = models.BooleanField(default=True)  # Enable proctoring
    shuffle_questions = models.BooleanField(default=False)
    show_results = models.BooleanField(default=True)  # Show results after submission
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.faculty.full_name}"
    
    @property
    def total_questions(self):
        return self.questions.count()
    
    @property
    def mcq_count(self):
        return self.questions.filter(question_type='mcq').count()
    
    @property
    def coding_count(self):
        return self.questions.filter(question_type='coding').count()

    class Meta:
        ordering = ['-created_at']


# ------------------------------
# Question in an Exam
# ------------------------------
class Question(models.Model):
    QUESTION_TYPE_CHOICES = [
        ('mcq', 'Multiple Choice'),
        ('coding', 'Coding'),
    ]
    
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='questions')
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='mcq')
    question_text = models.TextField()
    marks = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=0)
    
    # MCQ specific fields
    option_a = models.CharField(max_length=512, blank=True, null=True)
    option_b = models.CharField(max_length=512, blank=True, null=True)
    option_c = models.CharField(max_length=512, blank=True, null=True)
    option_d = models.CharField(max_length=512, blank=True, null=True)
    correct_option = models.CharField(max_length=1, blank=True, null=True)  # A, B, C, or D
    
    # Coding specific fields
    programming_language = models.CharField(max_length=50, blank=True, null=True)  # python, javascript, etc.
    starter_code = models.TextField(blank=True, null=True)  # Initial code template
    solution_code = models.TextField(blank=True, null=True)  # Reference solution
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}..."

    class Meta:
        ordering = ['order']


# ------------------------------
# Test Cases for Coding Questions
# ------------------------------
class TestCase(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='test_cases')
    input_data = models.TextField()  # Input for the test case
    expected_output = models.TextField()  # Expected output
    is_sample = models.BooleanField(default=False)  # Show to student as sample
    order = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Test {self.order} for Q{self.question.order}"

    class Meta:
        ordering = ['order']


# ------------------------------
# Student Exam Assignment
# ------------------------------
class ExamAssignment(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='exam_assignments')
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='assignments')
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'exam']

    def __str__(self):
        return f"{self.student.full_name} - {self.exam.title}"


# ------------------------------
# Student Exam Attempt
# ------------------------------
class ExamAttempt(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('evaluated', 'Evaluated'),
    ]
    
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='exam_attempts')
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='attempts')
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    score = models.FloatField(null=True, blank=True)
    total_marks_obtained = models.FloatField(default=0)
    percentage = models.FloatField(null=True, blank=True)
    passed = models.BooleanField(null=True, blank=True)
    
    # Proctoring flags
    tab_switches = models.PositiveIntegerField(default=0)
    suspicious_activities = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ['student', 'exam']

    def __str__(self):
        return f"{self.student.full_name} - {self.exam.title} ({self.status})"


# ------------------------------
# Student Answer for a Question
# ------------------------------
class StudentAnswer(models.Model):
    attempt = models.ForeignKey(ExamAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    
    # MCQ answer
    selected_option = models.CharField(max_length=1, blank=True, null=True)  # A, B, C, or D
    
    # Coding answer
    submitted_code = models.TextField(blank=True, null=True)
    
    is_correct = models.BooleanField(null=True, blank=True)
    marks_obtained = models.FloatField(default=0)
    
    # For coding - test case results
    test_cases_passed = models.PositiveIntegerField(default=0)
    total_test_cases = models.PositiveIntegerField(default=0)
    
    answered_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['attempt', 'question']

    def __str__(self):
        return f"Answer for Q{self.question.order} by {self.attempt.student.full_name}"
