import pandas as pd
import numpy as np

def clean_dataframe(df):
    errors = []
    try:
        # Remove duplicates
        df = df.drop_duplicates()
        
        for col in df.columns:
            if df[col].dtype == 'object':
                # Strip whitespace and normalize
                df[col] = df[col].astype(str).str.strip()
                
                # Title case for specific columns like 'name' or 'title'
                if 'name' in col.lower() or 'title' in col.lower():
                    df[col] = df[col].str.title()
                    
                # Basic date parsing attempt
                if 'date' in col.lower():
                    try:
                        df[col] = pd.to_datetime(df[col], errors='coerce')
                    except Exception as e:
                        errors.append(f"Date parsing error on {col}: {str(e)}")
                        
                # Amount parsing
                if 'amount' in col.lower() or 'value' in col.lower() or 'price' in col.lower():
                    df[col] = df[col].replace(r'[\$,]', '', regex=True)
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                    
        # Handle missing values
        df = df.replace({'nan': np.nan, 'None': np.nan, '': np.nan})
        
    except Exception as e:
        errors.append(f"Cleaning error: {str(e)}")
        
    return df, errors
