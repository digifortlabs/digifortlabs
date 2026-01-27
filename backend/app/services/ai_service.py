import os
import json
import google.generativeai as genai
from typing import Optional, Dict

class AIService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            # Log available models to debug 404
            try:
                print("🔍 Gemini: Probing available models...")
                available = []
                for m in genai.list_models():
                    available.append(m.name)
                    if 'generateContent' in m.supported_generation_methods:
                        print(f"  - {m.name} (Supports content generation)")
                
                # Heuristic: Try to find a flash model in the list
                flash_models = [m for m in available if "flash" in m.lower()]
                if "models/gemini-1.5-flash-8b" in available:
                    self.model_name = "gemini-1.5-flash-8b"
                elif flash_models:
                    self.model_name = flash_models[0].replace("models/", "")
                else:
                    self.model_name = "gemini-1.5-flash" # Fallback
                
                print(f"🚀 Gemini: Automatically selected model: {self.model_name}")
            except Exception as e:
                print(f"⚠️ Gemini: Could not list models: {e}")
                self.model_name = "gemini-1.5-flash"
            
            self.model = genai.GenerativeModel(self.model_name)
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
            print(f"DEBUG: Using model {self.model_name} for text extraction")
            response = self.model.generate_content(prompt)
            if not response.text:
                return None
            
            # Clean response text in case AI includes markdown wrappers
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_text)
        except Exception as e:
            print(f"❌ AI Extraction Error: {e}")
            return None

    def extract_patient_details_from_image(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> Optional[Dict]:
        """
        Uses Gemini's multimodal capabilities to extract data directly from an image.
        """
        if not self.model or not image_bytes:
            return None

        prompt = """
        Extract the following patient details from the provided image of a medical document.
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
        """

        try:
            print(f"DEBUG: Using model {self.model_name} for vision extraction")
            # Prepare image part for Gemini
            image_data = {
                "mime_type": mime_type,
                "data": image_bytes
            }
            
            response = self.model.generate_content([prompt, image_data])
            if not response.text:
                return None
            
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_text)
        except Exception as e:
            print(f"❌ Gemini Vision Extraction Error: {e}")
            return None

# Singleton instance
ai_service = AIService()
