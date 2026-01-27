import os
import json
import google.generativeai as genai
from typing import Optional, Dict

class AIService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-1.5-flash")
        else:
            self.model = None
            print("⚠️ WARNING: GEMINI_API_KEY not found in environment. AI Data Extraction will be disabled.")

    def extract_patient_details(self, ocr_text: str) -> Optional[Dict]:
        """
        Uses Gemini to extract structured patient data from OCR text.
        """
        if not self.model or not ocr_text:
            return None

        prompt = f"""
        Extract the following patient details from the provided medical document text. 
        Return ONLY a raw JSON object with NO markdown formatting (no ```json).
        
        Fields:
        - full_name (string, convert to Title Case)
        - age (string, extract only the number if possible, e.g. "45")
        - gender (string, "Male", "Female", or "Other")
        - address (string, full address)
        - contact_number (string, 10-digit if available)
        - aadhaar_number (string, 12-digit number)
        - dob (string, YYYY-MM-DD format)
        - diagnosis (string, a 1-sentence summary of the main condition or reason for visit)
        - uhid (string, unique identification number if found)

        If any field is missing or unclear, return null for that field.

        Text Content:
        {ocr_text}
        """

        try:
            response = self.model.generate_content(prompt)
            if not response.text:
                return None
            
            # Clean response text in case AI includes markdown wrappers
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_text)
        except Exception as e:
            print(f"❌ AI Extraction Error: {e}")
            return None

# Singleton instance
ai_service = AIService()
