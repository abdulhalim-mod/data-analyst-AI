
import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

client = genai.Client(api_key=API_KEY) if API_KEY else None


def generate_insights(profile: dict) -> str:
    """Generate insights from a dataset profile."""

    if client is None:
        return "Gemini API key is missing. Check your .env file."

    prompt = f"""
    You are a professional data analyst.

    Analyze this dataset profile:
    {profile}

    Explain:
    1. Key findings and patterns.
    2. Missing values and data quality issues.
    3. Potential outliers or unusual values, if identifiable.
    4. Actionable recommendations.

    Use clear, beginner-friendly language.
    Do not invent facts or numerical results.
    """

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt
        )
        return response.text or "No insights were returned."
    except Exception as exc:
        return f"Could not generate insights: {exc}"


def answer_question(profile: dict, question: str) -> str:
    """Answer questions using the supplied dataset profile."""

    if client is None:
        return "Gemini API key is missing. Check your .env file."

    prompt = f"""
    You are a data analyst assistant.

    Dataset profile:
    {profile}

    User question:
    {question}

    Answer clearly and concisely.
    Use only the information provided.
    If the profile does not contain enough information,
    explain what additional data or calculation is needed.
    Never invent numerical results.
    """

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt
        )
        return response.text or "No answer was returned."
    except Exception as exc:
        return f"Could not answer the question: {exc}"
