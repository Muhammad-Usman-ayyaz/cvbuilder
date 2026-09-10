import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.genai import errors as genai_errors

load_dotenv()

from models import (  # noqa: E402
    AnalyzeRequest,
    AtsAnalysisResult,
    ExtractedResume,
    ExtractRequest,
    ImproveRequest,
    ImproveResult,
)
from gemini_analyzer import analyze, extract_resume, improve_and_rescore  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ats-service")
# Suppress redundant automatic function calling warnings from the Google GenAI SDK
logging.getLogger("google_genai.models").setLevel(logging.ERROR)

app = FastAPI(title="ATS Analysis Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
@app.get("/health")
def health():
    return {"status": "ok", "message": "ATS analysis service running"}


@app.post("/analyze", response_model=AtsAnalysisResult)
def analyze_resume(req: AnalyzeRequest):
    try:
        return analyze(req)
    except HTTPException:
        raise
    except genai_errors.ClientError as e:
        logger.error("ATS analysis quota/client error: %s", e)
        if e.code == 429:
            raise HTTPException(status_code=429, detail="Gemini quota exhausted") from e
        raise HTTPException(status_code=502, detail="ATS analysis failed") from e
    except Exception as e:
        # Never log req/response bodies here — resume content is user data,
        # and nothing about the request should end up in logs either.
        logger.error("ATS analysis failed: %s", e)
        raise HTTPException(status_code=502, detail="ATS analysis failed") from e


@app.post("/improve", response_model=ImproveResult)
def improve_resume(req: ImproveRequest):
    try:
        return improve_and_rescore(req)
    except HTTPException:
        raise
    except genai_errors.ClientError as e:
        logger.error("ATS improvement quota/client error: %s", e)
        if e.code == 429:
            raise HTTPException(status_code=429, detail="Gemini quota exhausted") from e
        raise HTTPException(status_code=502, detail="ATS improvement failed") from e
    except Exception as e:
        logger.error("ATS improvement failed: %s", e)
        raise HTTPException(status_code=502, detail="ATS improvement failed") from e


@app.post("/extract", response_model=ExtractedResume)
def extract_cv(req: ExtractRequest):
    try:
        return extract_resume(req.text)
    except HTTPException:
        raise
    except genai_errors.ClientError as e:
        logger.error("CV extraction failed: %s", e)
        if e.code == 429:
            raise HTTPException(status_code=429, detail="Gemini quota exhausted") from e
        raise HTTPException(status_code=502, detail="CV extraction failed") from e
    except Exception as e:
        logger.error("CV extraction failed: %s", e)
        raise HTTPException(status_code=502, detail="CV extraction failed") from e


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("ATS_PORT") or os.environ.get("PORT") or 8001)
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
