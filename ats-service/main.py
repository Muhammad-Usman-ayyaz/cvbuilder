import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from models import AnalyzeRequest, AtsAnalysisResult  # noqa: E402
from gemini_analyzer import analyze  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ats-service")

app = FastAPI(title="ATS Analysis Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("ATS_PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
