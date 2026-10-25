
from dotenv import load_dotenv
from google import genai
import os

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("ERROR: API key not found in .env")
else:
    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents="Reply with exactly: Gemini connection successful!"
        )

        print("SUCCESS: API key accepted and model responded.")
        print("Response:", response.text)

    except Exception as e:
        print("Gemini test failed.")
        print("Error type:", type(e).__name__)
        print("Details:", str(e))
