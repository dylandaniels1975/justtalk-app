import requests
import sys
import json
from datetime import datetime

class JustTalkAPITester:
    def __init__(self, base_url="https://pdf-app-builder-39.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                self.test_results.append({"test": name, "status": "PASS", "response_code": response.status_code})
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:200]}")
                self.test_results.append({"test": name, "status": "FAIL", "response_code": response.status_code, "error": response.text[:200]})

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({"test": name, "status": "ERROR", "error": str(e)})
            return False, {}

    def test_countries_endpoint(self):
        """Test GET /api/countries returns 50 countries"""
        success, response = self.run_test(
            "Countries Endpoint",
            "GET",
            "countries",
            200
        )
        if success:
            countries = response.get('countries', [])
            if len(countries) >= 50:
                print(f"✅ Found {len(countries)} countries (expected 50+)")
                return True
            else:
                print(f"❌ Only found {len(countries)} countries, expected 50+")
                return False
        return False

    def test_interests_endpoint(self):
        """Test GET /api/interests returns interests with categories"""
        success, response = self.run_test(
            "Interests Endpoint",
            "GET",
            "interests",
            200
        )
        if success:
            interests = response.get('interests', [])
            if len(interests) > 0:
                # Check if interests have categories
                has_categories = all('category' in interest for interest in interests[:5])
                if has_categories:
                    print(f"✅ Found {len(interests)} interests with categories")
                    return True
                else:
                    print("❌ Interests missing category field")
                    return False
            else:
                print("❌ No interests found")
                return False
        return False

    def test_register(self):
        """Test POST /api/auth/register creates new user and returns token"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"email": test_email, "password": "test123"}
        )
        if success and 'access_token' in response and 'user' in response:
            self.token = response['access_token']
            self.user_id = response['user']['_id']
            print(f"✅ Registration successful, token received")
            return True
        return False

    def test_login(self):
        """Test POST /api/auth/login authenticates user and returns token"""
        # Use admin credentials for login test
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@justtalk.com", "password": "admin123"}
        )
        if success and 'access_token' in response and 'user' in response:
            print(f"✅ Login successful, token received")
            return True
        return False

    def test_onboarding(self):
        """Test POST /api/onboarding completes onboarding"""
        if not self.token:
            print("❌ No token available for onboarding test")
            return False
            
        success, response = self.run_test(
            "User Onboarding",
            "POST",
            "onboarding",
            200,
            data={
                "gender": "male",
                "username": f"testuser_{datetime.now().strftime('%H%M%S')}",
                "country_code": "US",
                "interest_ids": ["music", "tech", "gaming"]
            }
        )
        if success and 'user' in response:
            user = response['user']
            if user.get('onboarding_completed'):
                print(f"✅ Onboarding completed successfully")
                return True
            else:
                print("❌ Onboarding not marked as completed")
                return False
        return False

    def test_ai_queue_join(self):
        """Test POST /api/queue/join with prefer_ai=justin creates AI conversation"""
        if not self.token:
            print("❌ No token available for AI queue test")
            return False
            
        success, response = self.run_test(
            "AI Queue Join",
            "POST",
            "queue/join",
            200,
            data={"prefer_ai": "justin", "interest_ids": []}
        )
        if success and response.get('status') == 'matched' and response.get('is_ai'):
            conversation = response.get('conversation', {})
            if conversation.get('is_ai_chat') and conversation.get('ai_persona') == 'justin':
                print(f"✅ AI conversation created with Justin")
                self.conversation_id = conversation.get('id')
                return True
            else:
                print("❌ AI conversation not properly configured")
                return False
        return False

    def test_send_message(self):
        """Test POST /api/conversations/{id}/messages sends message and gets AI response"""
        if not hasattr(self, 'conversation_id') or not self.conversation_id:
            print("❌ No conversation ID available for message test")
            return False
            
        success, response = self.run_test(
            "Send Message",
            "POST",
            f"conversations/{self.conversation_id}/messages",
            200,
            data={"content": "Hello, how are you?"}
        )
        if success and 'message' in response:
            print(f"✅ Message sent successfully")
            # Wait a bit for AI response
            import time
            time.sleep(2)
            
            # Check for AI response
            success2, messages_response = self.run_test(
                "Check AI Response",
                "GET",
                f"conversations/{self.conversation_id}/messages",
                200
            )
            if success2:
                messages = messages_response.get('messages', [])
                ai_messages = [m for m in messages if m.get('is_ai_message')]
                if len(ai_messages) > 0:
                    print(f"✅ AI response received: {ai_messages[-1].get('content', '')[:50]}...")
                    return True
                else:
                    print("❌ No AI response found")
                    return False
        return False

    def test_end_conversation(self):
        """Test POST /api/conversations/{id}/end ends conversation"""
        if not hasattr(self, 'conversation_id') or not self.conversation_id:
            print("❌ No conversation ID available for end conversation test")
            return False
            
        success, response = self.run_test(
            "End Conversation",
            "POST",
            f"conversations/{self.conversation_id}/end",
            200
        )
        if success and 'message' in response:
            print(f"✅ Conversation ended successfully")
            return True
        return False

    def test_create_polaroid(self):
        """Test POST /api/polaroids creates a polaroid"""
        if not hasattr(self, 'conversation_id') or not self.conversation_id:
            print("❌ No conversation ID available for polaroid test")
            return False
            
        success, response = self.run_test(
            "Create Polaroid",
            "POST",
            "polaroids",
            200,
            data={
                "conversation_id": self.conversation_id,
                "snapshot_text": "Test conversation snapshot"
            }
        )
        if success and 'polaroid' in response:
            print(f"✅ Polaroid created successfully")
            return True
        return False

    def test_badges_endpoint(self):
        """Test GET /api/badges returns all badges"""
        if not self.token:
            print("❌ No token available for badges test")
            return False
            
        success, response = self.run_test(
            "Badges Endpoint",
            "GET",
            "badges",
            200
        )
        if success and 'badges' in response:
            badges = response['badges']
            print(f"✅ Found {len(badges)} badges")
            return True
        return False

def main():
    print("🚀 Starting Just Talk API Tests...")
    print("=" * 50)
    
    tester = JustTalkAPITester()
    
    # Run all tests
    tests = [
        ("Countries API", tester.test_countries_endpoint),
        ("Interests API", tester.test_interests_endpoint),
        ("User Registration", tester.test_register),
        ("User Login", tester.test_login),
        ("User Onboarding", tester.test_onboarding),
        ("AI Queue Join", tester.test_ai_queue_join),
        ("Send Message & AI Response", tester.test_send_message),
        ("End Conversation", tester.test_end_conversation),
        ("Create Polaroid", tester.test_create_polaroid),
        ("Badges API", tester.test_badges_endpoint),
    ]
    
    passed_tests = []
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if result:
                passed_tests.append(test_name)
            else:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {len(passed_tests)}/{len(tests)} passed")
    print(f"✅ Passed: {', '.join(passed_tests) if passed_tests else 'None'}")
    print(f"❌ Failed: {', '.join(failed_tests) if failed_tests else 'None'}")
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "summary": {
                "total_tests": len(tests),
                "passed": len(passed_tests),
                "failed": len(failed_tests),
                "success_rate": f"{(len(passed_tests)/len(tests)*100):.1f}%"
            },
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "detailed_results": tester.test_results
        }, f, indent=2)
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())