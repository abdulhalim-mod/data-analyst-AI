
import os
import uuid
from pathlib import Path

import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from analysis_engine import load_dataset, analyze_dataset
from ai_service import generate_insights, answer_question

app = FastAPI(title="Data Analyst AI Agent")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://abdulhalim-mod.github.io",
        "http://localhost:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
FRONTEND_ORIGIN = os.getenv(
    "FRONTEND_ORIGIN",
    "http://localhost:5173"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for local development.
datasets = {}

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".csv", ".xlsx"}


class QuestionRequest(BaseModel):
    dataset_id: str
    question: str


@app.get("/api/health")
def health():
    return {"status": "ok", "message": "Data Analyst AI Agent is running!"}


@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    filename = file.filename or ""
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Upload a CSV or XLSX file."
        )

    content = await file.read(MAX_FILE_SIZE + 1)

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Maximum file size is 10 MB."
        )

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty."
        )

    temp_path = None

    try:
        temp_path = Path(f"upload_{uuid.uuid4().hex}{extension}")
        temp_path.write_bytes(content)

        df = load_dataset(str(temp_path))
        profile = analyze_dataset(df)

        dataset_id = uuid.uuid4().hex

        datasets[dataset_id] = {
            "dataframe": df,
            "profile": profile,
        }

        return {
            "dataset_id": dataset_id,
            "filename": Path(filename).name,
            "profile": profile,
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not process the file: {exc}"
        )
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()


@app.get("/api/report/{dataset_id}")
def get_report(dataset_id: str):
    dataset = datasets.get(dataset_id)

    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found. Please upload it again."
        )

    return dataset["profile"]


@app.get("/api/insights/{dataset_id}")
def get_insights(dataset_id: str):
    dataset = datasets.get(dataset_id)

    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found. Upload the dataset first."
        )

    insights = generate_insights(dataset["profile"])

    return {"insights": insights}


@app.post("/api/ask")
def ask_question(request: QuestionRequest):
    dataset = datasets.get(request.dataset_id)

    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found. Upload the dataset first."
        )

    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Please enter a question."
        )

    # Send a dataset profile to Gemini for contextual answers.
    answer = answer_question(
        dataset["profile"],
        request.question.strip()
    )

    return {"answer": answer}
