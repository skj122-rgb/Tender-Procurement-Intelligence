import pandas as pd
from utils.db_connection import execute_query
from processing.data_cleaner import clean_dataframe

def process_csv(file_path, source_id):
    errors = []
    record_count = 0
    try:
        df = pd.read_csv(file_path)
        df, clean_errors = clean_dataframe(df)
        errors.extend(clean_errors)
        
        # Simple schema detection based on columns
        cols = set(df.columns.str.lower())
        if 'tender_id' in cols and 'title' in cols:
            # Upsert tenders
            for _, row in df.iterrows():
                try:
                    execute_query(
                        "INSERT INTO tenders (tender_id, title, department, estimated_value, status, source_id) "
                        "VALUES (%s, %s, %s, %s, %s, %s) "
                        "ON CONFLICT (tender_id) DO UPDATE SET title = EXCLUDED.title, estimated_value = EXCLUDED.estimated_value",
                        (row.get('tender_id'), row.get('title'), row.get('department'), row.get('estimated_value'), row.get('status', 'OPEN'), source_id)
                    )
                    record_count += 1
                except Exception as e:
                    errors.append(f"Row error: {str(e)}")
        # Add similar blocks for contractors, bids, etc. based on columns
    except Exception as e:
        errors.append(f"File error: {str(e)}")
        
    return {"recordCount": record_count, "errors": errors}
