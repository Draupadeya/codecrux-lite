from django.urls import path
from . import views

urlpatterns = [
    path('courses/', views.courses_portal, name='courses_portal'),
    path('static/<str:filename>', views.serve_frontend_static, name='serve_frontend_static'),
    path('api/generate-plan/', views.generate_plan, name='generate_plan'),
    path('api/generate-quiz/', views.generate_quiz_view, name='generate_quiz'),
    path('api/get-motivation/', views.get_motivation, name='get_motivation'),
    path('api/analyze-face/', views.analyze_face, name='analyze_face'),
    path('api/generate-notes-doc/', views.generate_notes_doc, name='generate_notes_doc'),
    path('api/generate-challenge/', views.generate_challenge, name='generate_challenge'),
    path('api/get-hint/', views.get_hint, name='get_hint'),
]
