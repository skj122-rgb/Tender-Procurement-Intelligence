import json
from utils.db_connection import execute_query

def process_json(file_path, source_id):
    errors = []
    record_count = 0
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            
        if not isinstance(data, list):
            data = [data]
            
        for item in data:
            try:
                if 'tender_id' in item:
                    execute_query(
                        "INSERT INTO tenders (tender_id, title, department, estimated_value, status, source_id) "
                        "VALUES (%s, %s, %s, %s, %s, %s) "
                        "ON CONFLICT (tender_id) DO NOTHING",
                        (item.get('tender_id'), item.get('title'), item.get('department'), item.get('estimated_value'), item.get('status', 'OPEN'), source_id)
                    )
                    record_count += 1
            except Exception as e:
                errors.append(f"Item error: {str(e)}")
    except Exception as e:
        errors.append(f"File error: {str(e)}")
        
    return {"recordCount": record_count, "errors": errors}
