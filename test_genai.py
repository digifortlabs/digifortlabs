from google import genai
try:
    client = genai.Client()
    print("Initialized without API key")
except Exception as e:
    print("Error without API key:", repr(e))

try:
    client2 = genai.Client(api_key=" ")
    print("Initialized with space API key")
except Exception as e:
    print("Error with space API key:", repr(e))

try:
    client3 = genai.Client(api_key="INVALID_KEY_BUT_NOT_EMPTY")
    print("Initialized with invalid API key")
    response = client3.models.generate_content(
        model="gemini-1.5-flash",
        contents="Hello"
    )
    print(response.text)
except Exception as e:
    print("Error with invalid API key:", repr(e))
