from pydantic import BaseModel
from typing import Optional

class AnalyzeRequest(BaseModel):
    text: str

class AnalyzeResponse(BaseModel):
    bias_detected: bool
    bias_type: str
    confidence: float
    fairness_score: float
    toxicity_score: float
    sentiment_score: float

class CounterfactualResponse(BaseModel):
    original: str
    counterfactual: str

class DebiasResponse(BaseModel):
    original: str
    debiased: str
    reduction_percentage: float
