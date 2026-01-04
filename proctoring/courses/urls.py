# courses/urls.py
from django.urls import path
from . import views

app_name = 'courses'

urlpatterns = [
    # Main courses portal
    path('', views.courses_portal, name='courses_portal'),
    
    # Static files
    path('style.css', views.serve_css, name='serve_css'),
    path('script.js', views.serve_js, name='serve_js'),
    
    # API endpoints
    path('api/process', views.process_video, name='process_video'),
    path('api/ask', views.ask_question, name='ask_question'),
    path('api/transcribe', views.transcribe_audio, name='transcribe_audio'),
    path('api/health', views.health, name='health'),
    path('api/analyze-face', views.analyze_face, name='analyze_face'),
    path('api/generate-notes-doc', views.generate_notes_doc, name='generate_notes_doc'),
    path('api/generate-challenge', views.generate_challenge, name='generate_challenge'),
    path('api/get-hint', views.get_hint, name='get_hint'),
]
