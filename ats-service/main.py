import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

load_dotenv()

from models import AnalyzeRequest, AtsAnalysisResult, ImproveRequest, ImproveResult  # noqa: E402
from gemini_analyzer import analyze, improve_and_rescore  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ats-service")

app = FastAPI(title="ATS Analysis Service")


@app.get("/")
def health():
    return {"status": "ok", "message": "ATS analysis service running"}


@app.post("/analyze", response_model=AtsAnalysisResult)
def analyze_resume(req: AnalyzeRequest):
    try:
        return analyze(req)
    except Exception as e:
        # Never log req/response bodies here — resume content is user data,
        # and nothing about the request should end up in logs either.
        logger.error("ATS analysis failed: %s", e)
        raise HTTPException(status_code=502, detail="ATS analysis failed") from e


@app.post("/improve", response_model=ImproveResult)
def improve_resume(req: ImproveRequest):
    try:
        return improve_and_rescore(req)
    except Exception as e:
        logger.error("ATS improvement failed: %s", e)
        raise HTTPException(status_code=502, detail="ATS improvement failed") from e


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
