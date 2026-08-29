import pdfplumber

def process_pdf(file_path, source_id):
    errors = []
    record_count = 0
    extracted_text = ""
    
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
                tables = page.extract_tables()
                # Basic processing of tables could go here
                
        # In a real system, you would parse the extracted text for tender IDs, values, etc.
        # For now, we simulate processing.
        if extracted_text:
            record_count = 1
            
    except Exception as e:
        errors.append(f"PDF processing error: {str(e)}")
        
    return {"recordCount": record_count, "errors": errors}
