import logging
logger = logging.getLogger(__name__)
from typing import Optional, Dict

class AIService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        logger.info("[INFO] Generative AI features have been completely disabled as requested.")

    def extract_patient_details(self, ocr_text: str) -> Optional[Dict]:
        """
        Generative AI structured data extraction has been disabled.
        """
        return None

    def extract_patient_details_from_image(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> Optional[Dict]:
        """
        Generative AI vision extraction has been disabled.
        """
        return None
