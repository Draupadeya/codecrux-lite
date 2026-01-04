from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum
from .models import Candidate, Session, Event, StudentProfile, Faculty, Course, CourseModule, Enrollment, ModuleProgress
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from django import forms

# -----------------------------
# Candidate Admin
# -----------------------------
@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('pk', 'name', 'roll_number', 'email', 'photo_thumbnail', 'has_embedding',
                    'created_at', 'updated_at', 'blocked', 'blocked_reason')
    readonly_fields = ('photo_thumbnail', 'created_at', 'updated_at')
    list_filter = ('blocked',)

    # Display photo thumbnail
    def photo_thumbnail(self, obj):
        if obj.photo:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit:cover;border-radius:50%;" />',
                obj.photo.url
            )
        return "-"
    photo_thumbnail.short_description = "Photo"

    # Show if embedding exists
    def has_embedding(self, obj):
        return bool(obj.authorized_embedding)
    has_embedding.boolean = True
    has_embedding.short_description = "Embedding"

    # Save model and generate embedding if photo exists
    def save_model(self, request, obj, form, change):
        if obj.photo:
            try:
                img_path = obj.photo.path
                embedding = DeepFace.represent(
                    img_path=img_path,
                    model_name="Facenet512",
                    enforce_detection=True
                )[0]['embedding']
                obj.authorized_embedding = embedding
            except Exception as e:
                print(f"Error generating embedding for {obj.name}: {e}")
        super().save_model(request, obj, form, change)

    # Custom action to unblock candidates
    actions = ['unblock_candidates']

    def unblock_candidates(self, request, queryset):
        updated = queryset.update(blocked=False, blocked_reason='')
        self.message_user(request, f"{updated} candidate(s) unblocked.")
    unblock_candidates.short_description = "Unblock selected candidates"


# -----------------------------
# Session Admin
# -----------------------------
@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('pk', 'candidate_name', 'started_at', 'ended_at', 'verdict', 'get_suspicion_score', 'blocked')
    readonly_fields = ('candidate_name', 'suspicion_score', 'started_at', 'ended_at')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(total_score=Sum('events__score'))

    def get_suspicion_score(self, obj):
        return getattr(obj, 'total_score', 0) or 0
    get_suspicion_score.short_description = "Suspicion Score"
    get_suspicion_score.admin_order_field = 'total_score'

    def candidate_name(self, obj):
        return obj.candidate.name if obj.candidate else "Unknown"
    candidate_name.short_description = "Candidate"


# -----------------------------
# Event Admin
# -----------------------------
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('pk', 'session_info_safe', 'event_type', 'score', 'frame_preview', 'audio_file_link', 'timestamp')
    readonly_fields = ('frame_preview', 'timestamp')

    def session_info_safe(self, obj):
        if obj.session:
            candidate_name = obj.session.candidate.name if obj.session.candidate else "Unknown"
            return f"Session {obj.session.id} - {candidate_name}"
        return "-"
    session_info_safe.short_description = "Session"

    def frame_preview(self, obj):
        if obj.frame_file:
            return format_html('<img src="{}" width="80" style="object-fit:cover;"/>', obj.frame_file.url)
        return "-"
    frame_preview.short_description = "Frame"

    def audio_file_link(self, obj):
        if obj.audio_file:
            return format_html('<a href="{}" target="_blank">Play Audio</a>', obj.audio_file.url)
        return "-"
    audio_file_link.short_description = "Audio"


# -----------------------------
# STUDENT MANAGEMENT
# -----------------------------
class StudentForm(forms.ModelForm):
    """Form for creating student with automatic User creation"""
    password = forms.CharField(widget=forms.PasswordInput, help_text="DOB format: YYYYMMDD (e.g., 19990615)")
    
    class Meta:
        model = StudentProfile
        fields = ('full_name', 'roll_number', 'dob')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            # Editing existing student
            self.fields['password'].widget = forms.HiddenInput()
            self.fields['password'].required = False

class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    can_delete = False
    verbose_name_plural = 'Student Information'
    fields = ('full_name', 'roll_number', 'dob', 'get_username')
    readonly_fields = ('get_username',)
    
    def get_username(self, obj):
        return obj.user.username if obj.user else "-"
    get_username.short_description = "Username"

@admin.register(StudentProfile)
class StudentAdmin(admin.ModelAdmin):
    form = StudentForm
    list_display = ('full_name', 'roll_number', 'get_username', 'dob', 'get_email')
    search_fields = ('full_name', 'roll_number', 'user__username')
    readonly_fields = ('get_username', 'get_email')
    
    fieldsets = (
        ('Student Information', {
            'fields': ('full_name', 'roll_number', 'dob')
        }),
        ('Login Credentials', {
            'fields': ('get_username', 'password'),
            'description': 'Username will be auto-generated from roll number. Password should be DOB in YYYYMMDD format.'
        }),
        ('Account', {
            'fields': ('get_email',),
            'classes': ('collapse',)
        }),
    )
    
    def get_username(self, obj):
        return obj.user.username if obj.user else "Not yet created"
    get_username.short_description = "Username (Roll Number)"
    
    def get_email(self, obj):
        return obj.user.email if obj.user else "-"
    get_email.short_description = "Email"
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new student
            password = form.cleaned_data.get('password', '')
            # Create User with roll_number as username
            user = User.objects.create_user(
                username=obj.roll_number,
                password=password,
                first_name=obj.full_name.split()[0] if obj.full_name else '',
                last_name=' '.join(obj.full_name.split()[1:]) if ' ' in obj.full_name else ''
            )
            obj.user = user
        super().save_model(request, obj, form, change)


# -----------------------------
# FACULTY MANAGEMENT
# -----------------------------
class FacultyForm(forms.ModelForm):
    """Custom form for faculty user creation"""
    first_name = forms.CharField(max_length=150, required=True, label='First Name')
    last_name = forms.CharField(max_length=150, required=False, label='Last Name')
    email = forms.EmailField(required=False)
    password = forms.CharField(widget=forms.PasswordInput, required=True)
    password_confirm = forms.CharField(widget=forms.PasswordInput, required=True, label='Confirm Password')
    
    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'email', 'password')
    
    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        password_confirm = cleaned_data.get('password_confirm')
        if password and password_confirm and password != password_confirm:
            raise forms.ValidationError("Passwords do not match!")
        return cleaned_data

class FacultyUserAdmin(UserAdmin):
    form = FacultyForm
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing existing user
            return ('username', 'password', 'date_joined', 'last_login')
        return ()
    
    def get_list_display(self, request):
        return ('username', 'first_name', 'last_name', 'email', 'is_staff', 'is_active')
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new user
            password = form.cleaned_data.get('password')
            obj.set_password(password)
            obj.is_staff = True  # Faculty users are staff by default
        super().save_model(request, obj, form, change)

# -----------------------------
# Faculty Admin
# -----------------------------
class FacultyForm(forms.ModelForm):
    """Custom form for Faculty with username and password"""
    username = forms.CharField(max_length=150, help_text="Login username")
    password = forms.CharField(widget=forms.PasswordInput, help_text="Password", required=False)
    password_confirm = forms.CharField(widget=forms.PasswordInput, label="Confirm Password", required=False)
    
    class Meta:
        model = Faculty
        fields = ('full_name', 'department', 'email', 'phone')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            # Editing existing faculty
            self.fields['username'].initial = self.instance.user.username if self.instance.user else ""
            self.fields['password'].required = False
            self.fields['password_confirm'].required = False
            self.fields['password'].help_text = "Leave blank to keep current password"
        else:
            # Creating new faculty
            self.fields['password'].required = True
            self.fields['password_confirm'].required = True
    
    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        password_confirm = cleaned_data.get('password_confirm')
        
        if not self.instance.pk:  # New faculty
            if password and password_confirm and password != password_confirm:
                raise forms.ValidationError("Passwords do not match!")
        else:  # Editing faculty
            if password or password_confirm:
                if password != password_confirm:
                    raise forms.ValidationError("Passwords do not match!")
        
        return cleaned_data

@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    form = FacultyForm
    list_display = ('full_name', 'get_username', 'department', 'email', 'phone', 'created_at')
    search_fields = ('full_name', 'email', 'department', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Faculty Information', {
            'fields': ('full_name', 'department', 'email', 'phone')
        }),
        ('Login Credentials', {
            'fields': ('username', 'password', 'password_confirm'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_username(self, obj):
        return obj.user.username if obj.user else "-"
    get_username.short_description = "Username"
    
    def save_model(self, request, obj, form, change):
        username = form.cleaned_data.get('username')
        password = form.cleaned_data.get('password')
        
        if not change:  # Creating new faculty
            # Create new user
            user = User.objects.create_user(
                username=username,
                password=password,
                email=form.cleaned_data.get('email', ''),
                first_name=obj.full_name.split()[0] if obj.full_name else '',
                last_name=' '.join(obj.full_name.split()[1:]) if ' ' in obj.full_name else '',
                is_staff=True,
                is_active=True
            )
            obj.user = user
        else:  # Editing existing faculty
            user = obj.user
            if username:
                user.username = username
            if password:
                user.set_password(password)
            if form.cleaned_data.get('email'):
                user.email = form.cleaned_data.get('email')
            user.first_name = obj.full_name.split()[0] if obj.full_name else ''
            user.last_name = ' '.join(obj.full_name.split()[1:]) if ' ' in obj.full_name else ''
            user.save()
        
        super().save_model(request, obj, form, change)


# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, FacultyUserAdmin)


# Add custom admin site header and title
admin.site.site_header = "SparkLess Admin Portal"
admin.site.site_title = "Student & Faculty Management"
admin.site.index_title = "Welcome to SparkLess Admin"


# -----------------------------
# Course Admin
# -----------------------------
class CourseModuleInline(admin.TabularInline):
    model = CourseModule
    extra = 1
    fields = ('order', 'title', 'description', 'video_url', 'duration_minutes')


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'faculty', 'category', 'level', 'is_published', 'enrollment_count', 'created_at')
    list_filter = ('is_published', 'level', 'category', 'faculty')
    search_fields = ('title', 'description', 'faculty__full_name')
    inlines = [CourseModuleInline]
    
    def enrollment_count(self, obj):
        return obj.enrollments.count()
    enrollment_count.short_description = "Students Enrolled"


@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'duration_minutes')
    list_filter = ('course',)
    ordering = ('course', 'order')


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'progress', 'completed', 'enrolled_at')
    list_filter = ('completed', 'course')
    search_fields = ('student__full_name', 'course__title')


@admin.register(ModuleProgress)
class ModuleProgressAdmin(admin.ModelAdmin):
    list_display = ('enrollment', 'module', 'completed', 'time_spent_minutes')
    list_filter = ('completed',)

