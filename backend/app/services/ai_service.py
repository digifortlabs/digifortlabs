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
                
                # Heuristic: Prioritize PRO models as requested
                # Sort available models to get the latest versions (usually higher numbers)
                available.sort(reverse=True)
                
                pro_models = [m for m in available if "pro" in m.lower() and "vision" not in m.lower()] 
                # Preference: Gemini 1.5 Flash (as fallback)
                flash_models = [m for m in available if "flash" in m.lower() and "lite" not in m.lower()]
                lite_models = [m for m in available if "flash" in m.lower() and "lite" in m.lower()]
                self.flash_models = [m.replace("models/", "") for m in flash_models + lite_models]
                
                # Preference: Gemini 1.5 Pro or newer for main
                selected = None
                
                # Check for explicit high-tier models first
                latest_pros = [m for m in pro_models if "1.5" in m or "2.0" in m or "2.5" in m]
                
                if latest_pros:
                    selected = latest_pros[0]
                elif pro_models:
                    selected = pro_models[0]
                elif self.flash_models:
                    selected = self.flash_models[0]
                else:
                    selected = "models/gemini-1.5-pro-latest" # Hard fallback
                
                self.model_name = selected.replace("models/", "")
                
                print(f"🚀 Gemini: Automatically selected model: {self.model_name}")
            except Exception as e:
                print(f"⚠️ Gemini: Could not list models: {e}")
                self.model_name = "gemini-1.5-flash"
                self.flash_models = ["gemini-1.5-flash", "gemini-pro-vision"]
            
            # Additional generic fallbacks
            if "gemini-1.5-flash" not in self.flash_models:
                self.flash_models.append("gemini-1.5-flash")
            
            self.model = genai.GenerativeModel(self.model_name)
        else:
            self.model = None
            self.flash_models = []
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
            print(f"DEBUG: Gemini Response received. Success: {bool(response.text)}")
            if not response.text:
                print("⚠️ Gemini returned empty text response")
                return None
            
            # Clean response text in case AI includes markdown wrappers
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            print(f"DEBUG: Gemini Cleaned Text: {clean_text[:100]}...")
            return json.loads(clean_text)
        except Exception as e:
            print(f"❌ AI Extraction Error: {e}")
            if hasattr(e, 'response') and e.response:
                 print(f"DEBUG: Error Response: {e.response}")
            
            # Automatic Fallback to Flash on Quota Error
            if ("quota" in str(e).lower() or "429" in str(e).lower()) and self.flash_models:
                for fallback_model in self.flash_models:
                    if fallback_model == self.model_name: continue
                    print(f"🔄 Quota Exceeded. Retrying with {fallback_model}...")
                    try:
                        flash_model = genai.GenerativeModel(fallback_model)
                        response = flash_model.generate_content(prompt)
                        if response.text:
                            clean_text = response.text.replace("```json", "").replace("```", "").strip()
                            return json.loads(clean_text)
                    except Exception as ef:
                        print(f"❌ Fallback to {fallback_model} failed: {ef}")
                        continue
            return None

    def extract_patient_details_from_image(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> Optional[Dict]:
        """
        Uses Gemini's multimodal capabilities to extract data directly from an image.
        """
        if not self.model or not image_bytes:
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
            print(f"DEBUG: Using model {self.model_name} for vision extraction (Size: {len(image_bytes)} bytes)")
            # Prepare image part for Gemini
            image_data = {
                "mime_type": mime_type,
                "data": image_bytes
            }
            
            response = self.model.generate_content([prompt, image_data])
            print(f"DEBUG: Gemini Vision Response received. Success: {bool(response.text)}")
            if not response.text:
                print("⚠️ Gemini Vision returned empty text response")
                return None
            
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            print(f"DEBUG: Gemini Vision Cleaned Text: {clean_text[:100]}...")
            return json.loads(clean_text)
        except Exception as e:
            print(f"❌ Gemini Vision Extraction Error: {e}")
            if hasattr(e, 'response') and e.response:
                 print(f"DEBUG: Vision Error Response: {e.response}")
            
            # Automatic Fallback to Flash on Quota Error
            if ("quota" in str(e).lower() or "429" in str(e).lower()) and self.flash_models:
                for fallback_model in self.flash_models:
                    if fallback_model == self.model_name: continue
                    print(f"🔄 Quota Exceeded. Retrying vision extraction with {fallback_model}...")
                    try:
                        flash_model = genai.GenerativeModel(fallback_model)
                        image_data = {"mime_type": mime_type, "data": image_bytes}
                        response = flash_model.generate_content([prompt, image_data])
                        if response.text:
                            clean_text = response.text.replace("```json", "").replace("```", "").strip()
                            return json.loads(clean_text)
                    except Exception as ef:
                        print(f"❌ Vision Fallback to {fallback_model} failed: {ef}")
                        continue
            return None

# Singleton instance
ai_service = AIService()
