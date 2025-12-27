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
]
