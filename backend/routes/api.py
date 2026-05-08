from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.models.schemas import AnalyzeRequest, AnalyzeResponse, CounterfactualResponse, DebiasResponse
from backend.models.database import get_db, BiasAnalysis
from backend.debiasing.generative_debiaser import get_debiaser
import random
import time

router = APIRouter()

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_text(request: AnalyzeRequest, db: Session = Depends(get_db)):
    text = request.text.lower()
    
    # Mocking NLP analysis logic based on keywords
    bias_detected = False
    bias_type = "None"
    confidence = 0.0
    fairness_score = 0.95
    toxicity_score = 0.05
    sentiment_score = 0.8
    
    if "he is" in text or "she is" in text or "doctor" in text or "nurse" in text:
        bias_detected = True
        bias_type = "gender"
        confidence = round(random.uniform(0.7, 0.95), 2)
        fairness_score = round(random.uniform(0.4, 0.65), 2)
        toxicity_score = round(random.uniform(0.1, 0.3), 2)
    elif "black" in text or "white" in text or "asian" in text:
        bias_detected = True
        bias_type = "race"
        confidence = round(random.uniform(0.7, 0.95), 2)
        fairness_score = round(random.uniform(0.3, 0.5), 2)

    # Save to db
    analysis = BiasAnalysis(
        text=request.text,
        bias_detected=bias_detected,
        bias_type=bias_type,
        confidence=confidence,
        fairness_score=fairness_score
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    time.sleep(0.5) # simulate processing delay
    
    return AnalyzeResponse(
        bias_detected=bias_detected,
        bias_type=bias_type,
        confidence=confidence,
        fairness_score=fairness_score,
        toxicity_score=toxicity_score,
        sentiment_score=sentiment_score
    )

@router.post("/counterfactual", response_model=CounterfactualResponse)
def generate_counterfactual(request: AnalyzeRequest):
    text = request.text
    counterfactual = text
    
    # Simple rule-based counterfactual generation for the prototype
    swaps = {
        "He is": "She is",
        "She is": "He is",
        "he": "she",
        "she": "he",
        "his": "hers",
        "hers": "his",
        "him": "her",
        "her": "him"
    }
    
    for k, v in swaps.items():
        if k in text:
            counterfactual = text.replace(k, v)
            break
            
    time.sleep(0.5)
    return CounterfactualResponse(original=text, counterfactual=counterfactual)

@router.post("/debias", response_model=DebiasResponse)
def debias_text(request: AnalyzeRequest):
    # Initialize/get the generative model (singleton)
    debiaser = get_debiaser()
    
    # Run the biased text through the generative model for neutral rewriting
    text = request.text
    debiased_text = debiaser.rewrite(text)
            
    # Calculate a simulated reduction percentage for the dashboard prototype
    reduction_pct = round(random.uniform(75, 95), 2)
    if debiased_text.lower() == text.lower():
        reduction_pct = 0.0 # Failed to rewrite
        
    return DebiasResponse(
        original=text, 
        debiased=debiased_text,
        reduction_percentage=reduction_pct
    )

@router.get("/metrics")
def get_metrics():
    return {
        "demographic_parity_gap": 0.12,
        "equalized_odds_difference": 0.08,
        "seat_score": 0.65,
        "accuracy": 0.89,
        "macro_f1": 0.86
    }

@router.get("/dashboard-data")
def get_dashboard_data():
    return {
        "biasTrends": [
            {"month": "Jan", "gender": 400, "race": 240, "sentiment": 150},
            {"month": "Feb", "gender": 300, "race": 210, "sentiment": 140},
            {"month": "Mar", "gender": 200, "race": 180, "sentiment": 110},
            {"month": "Apr", "gender": 150, "race": 120, "sentiment": 90},
            {"month": "May", "gender": 80, "race": 70, "sentiment": 60},
        ],
        "modelComparison": [
            {"name": "Base RoBERTa", "accuracy": 92, "fairness": 45},
            {"name": "Debiased RoBERTa", "accuracy": 89, "fairness": 88},
            {"name": "DistilBERT", "accuracy": 85, "fairness": 40},
        ]
    }
