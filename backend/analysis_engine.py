
import pandas as pd
import numpy as np


def load_dataset(file_path: str) -> pd.DataFrame:
    """Load a CSV or Excel dataset."""
    if file_path.lower().endswith(".csv"):
        df = pd.read_csv(file_path)
    elif file_path.lower().endswith((".xlsx", ".xls")):
        df = pd.read_excel(file_path)
    else:
        raise ValueError("Please upload a CSV or Excel file.")

    if df.empty:
        raise ValueError("The uploaded dataset is empty.")

    if len(df) > 100_000:
        raise ValueError("Maximum allowed rows: 100,000.")

    if len(df.columns) > 100:
        raise ValueError("Maximum allowed columns: 100.")

    return df


def analyze_dataset(df: pd.DataFrame) -> dict:
    """Generate a basic statistical profile of the dataset."""

    numeric_df = df.select_dtypes(include=np.number)
    categorical_df = df.select_dtypes(
        include=["object", "category", "bool"]
    )

    missing = df.isnull().sum()
    duplicates = int(df.duplicated().sum())

    numeric_summary = (
        numeric_df.describe()
        .replace({np.nan: None})
        .to_dict()
    )

    categorical_summary = {}
    for column in categorical_df.columns:
        categorical_summary[column] = {
            "unique_values": int(df[column].nunique()),
            "top_values": {
                str(key): int(value)
                for key, value in
                df[column].value_counts().head(5).items()
            }
        }

    return {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "column_names": df.columns.tolist(),
        "data_types": {
            str(column): str(dtype)
            for column, dtype in df.dtypes.items()
        },
        "missing_values": {
            str(column): int(value)
            for column, value in missing.items()
        },
        "total_missing_values": int(missing.sum()),
        "duplicate_rows": duplicates,
        "numeric_summary": numeric_summary,
        "categorical_summary": categorical_summary,
        "preview": df.head(10).to_dict(orient="records")
    }
