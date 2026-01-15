from app.services.ocr import classify_document

def test_classification():
    test_cases = [
        {
            "text": "Discharge Summary: Patient recovered well. Advice on discharge includes bed rest.",
            "expected": ["Discharge Summary"]
        },
        {
            "text": "Laboratory Report: Hematology results show normal blood count. Biochemistry profile normal.",
            "expected": ["Lab Report"]
        },
        {
            "text": "Prescription: Rx Paracetamol 500mg twice daily for 5 days.",
            "expected": ["Prescription"]
        },
        {
            "text": "Radiology Department. Imaging Report: X-Ray Chest PA view show clear lungs.",
            "expected": ["Imaging Report"]
        },
        {
            "text": "Medical Certificate: This is to certify that the patient is fit to work.",
            "expected": ["Medical Certificate"]
        },
        {
            "text": "Combined Case: Discharge Summary with Lab Report results attached.",
            "expected": ["Discharge Summary", "Lab Report"]
        }
    ]

    print("--- Running OCR Classification Tests ---")
    for i, case in enumerate(test_cases):
        tags = classify_document(case["text"])
        success = set(tags) == set(case["expected"])
        status = "✅ PASS" if success else f"❌ FAIL (Got: {tags}, Expected: {case['expected']})"
        print(f"Test {i+1}: {status}")

if __name__ == "__main__":
    test_classification()
