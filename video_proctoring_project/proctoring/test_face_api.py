"""
Quick test script to verify face detection API is working
Run this AFTER starting the Flask server (python app.py)
"""

import requests
import base64
from pathlib import Path

API_URL = "http://127.0.0.1:5000"

def test_health():
    """Test if server is running"""
    print("🔍 Testing server health...")
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running!")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Server returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Server not reachable: {str(e)}")
        print("   Make sure to run: python app.py")
        return False

def test_face_detection_with_sample():
    """Test face detection endpoint with a sample image"""
    print("\n🔍 Testing face detection endpoint...")
    
    # Create a dummy base64 image (1x1 pixel)
    # In real usage, this would be a webcam capture
    dummy_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    try:
        response = requests.post(
            f"{API_URL}/detect-faces",
            json={
                "image": dummy_image,
                "timestamp": "2025-12-20T10:30:00Z",
                "exam_id": "test_exam_001"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Face detection endpoint is working!")
            print(f"   Response: {result}")
            return True
        else:
            print(f"❌ API returned status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing face detection: {str(e)}")
        return False

def test_mood_analysis():
    """Test mood analysis endpoint"""
    print("\n🔍 Testing mood analysis endpoint...")
    
    dummy_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    try:
        response = requests.post(
            f"{API_URL}/analyze-mood",
            json={
                "image": dummy_image,
                "timestamp": "2025-12-20T10:30:00Z"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Mood analysis endpoint is working!")
            print(f"   Response keys: {result.keys()}")
            return True
        else:
            print(f"❌ API returned status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing mood analysis: {str(e)}")
        return False

def main():
    print("="*60)
    print("🧪 Face Detection API Test Suite")
    print("="*60)
    print("\n⚠️  Make sure Flask server is running first:")
    print("   cd video_proctoring_project/proctoring")
    print("   python app.py\n")
    
    # Run tests
    health_ok = test_health()
    
    if health_ok:
        face_ok = test_face_detection_with_sample()
        mood_ok = test_mood_analysis()
        
        print("\n" + "="*60)
        print("📊 Test Results Summary")
        print("="*60)
        print(f"Server Health:     {'✅ PASS' if health_ok else '❌ FAIL'}")
        print(f"Face Detection:    {'✅ PASS' if face_ok else '❌ FAIL'}")
        print(f"Mood Analysis:     {'✅ PASS' if mood_ok else '❌ FAIL'}")
        print("="*60)
        
        if health_ok and face_ok and mood_ok:
            print("\n🎉 All tests passed! Face detection API is ready to use.")
            print("\n📝 Next steps:")
            print("   1. Open test_face_detection.html in your browser")
            print("   2. Test with real webcam")
            print("   3. Integrate into your Django exam flow")
        else:
            print("\n⚠️  Some tests failed. Check the errors above.")
    else:
        print("\n❌ Cannot proceed with tests - server is not running.")
        print("\n🔧 To start the server:")
        print("   cd c:\\sparkless\\video_proctoring_project\\proctoring")
        print("   python app.py")

if __name__ == "__main__":
    main()
