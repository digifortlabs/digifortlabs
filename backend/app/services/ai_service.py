import logging
logger = logging.getLogger(__name__)
import os
import json
from google import genai
from google.genai import types
from typing import Optional, Dict

class AIService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
            self.model_name = "gemini-1.5-flash"
            self.flash_models = ["gemini-1.5-flash", "gemini-pro-vision"]
        else:
            self.client = None
            self.flash_models = []
            logger.info("[WARN] WARNING: API Key not provided. AI Data Extraction disabled.")

    def extract_patient_details(self, ocr_text: str) -> Optional[Dict]:
        """
        Uses Gemini to extract structured patient data from OCR text.
        """
        if not self.client or not ocr_text:
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
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            if not response.text:
                return None
            
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_text)
        except Exception as e:
            logger.info(f"[ERROR] AI Extraction Error: {e}")
            return None

    def extract_patient_details_from_image(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> Optional[Dict]:
        """
        Uses Gemini's multimodal capabilities to extract data directly from an image.
        """
        if not self.client or not image_bytes:
            return None

        prompt = """
        Extract the following patient details from the provided image of a medical document.
        The document might be ROTATED, SIDEWAYS, or UPSIDE DOWN - please read it carefully regardless of orientation.
        Return ONLY a raw JSON object with NO markdown formatting (no ```json).
        
        Fields:
        - full_name (string, convert to Title Case)
        - age (string, extract only the number if possible, e.g. "45")
        - gender (string, "Male", "Female", or "Other")
        - address (string, full address or landmark)
        - contact_number (string, 10-digit if available)
        - aadhaar_number (string, 12-digit number)
        - dob (string, YYYY-MM-DD format)
        - diagnosis (string, a 1-sentence summary of the main condition, provisional diagnosis, or reason for visit)
        - uhid (string, unique identification number if found)

        If any field is missing or unclear, return null for that field. 
        Focus heavily on identifying the Patient Name, Age, and Diagnosis.
        """

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    prompt,
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                ]
            )
            if not response.text:
                return None
            
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_text)
        except Exception as e:
            logger.info(f"[ERROR] Gemini Vision Extraction Error: {e}")
            return None
