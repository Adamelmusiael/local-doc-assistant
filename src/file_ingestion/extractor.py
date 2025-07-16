import fitz

def extract_text_from_pdf(pdf_path: str) -> str:
    """"Extract text from a PDF file."""
    text = ""
    with fitz.open(pdf_path) as doc:
        for page in doc:
            text += page.get_text()
    return text

if __name__ == "__main__":
    # Test with the existing CV file
    path = r"C:\projects\AI-Assistant\src\file_ingestion\Adam Musiał CV AI Specialist.pdf"
    text = extract_text_from_pdf(path)
    print("First 1000 characters:")
    print(text[:1000]) 