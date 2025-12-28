from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from .models import StudentProfile

class LoginAPI(APIView):
    def post(self, request):
        username = request.data.get('email') # Using email as username for now, or map it
        password = request.data.get('password')
        
        # Try to find user by email if username fails
        if '@' in username:
            try:
                user_obj = User.objects.get(email=username)
                username = user_obj.username
            except User.DoesNotExist:
                pass

        user = authenticate(username=username, password=password)
        if user:
            login(request, user)
            return Response({
                "status": "success",
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "id": user.id
                }
            })
        return Response({"status": "error", "message": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class UserInfoAPI(APIView):
    def get(self, request):
        if request.user.is_authenticated:
            return Response({
                "username": request.user.username,
                "email": request.user.email,
                "is_staff": request.user.is_staff
            })
        return Response({"error": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
