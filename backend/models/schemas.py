from pydantic import BaseModel
from typing import Optional, List

class AnalyzeRequest(BaseModel):
    text: str

class AnalyzeResponse(BaseModel):
    bias_detected: bool
    bias_type: str
    confidence: float
    fairness_score: float
    toxicity_score: float
    sentiment_score: float
    intent: str = "neutral"
    context_note: str = ""
    bias_severity: str = "none"
    demographic_parity_gap: float = 0.0
    equalized_odds_diff: float = 0.0
    seat_score: float = 0.0
    protected_attributes: List[str] = []

class CounterfactualResponse(BaseModel):
    original: str
    counterfactual: str
    neutralized: str = ""
    occupation_balanced: str = ""
    swap_count: int = 0

class DebiasResponse(BaseModel):
    original: str
    debiased: str
    reduction_percentage: float
    iterations: int = 1
    final_confidence: float = 0.0
    final_fairness: float = 0.0
