"""
Fairness Validator — Stage 5 of the FairNLP-MT Pipeline
Computes formal fairness metrics: DPG, EOD, SEAT scores, bias severity.
"""
import re, math
from dataclasses import dataclass
from backend.services.semantic_bias_detector import detect_bias

@dataclass
class FairnessMetrics:
    demographic_parity_gap: float
    equalized_odds_diff: float
    seat_score: float
    bias_severity: str        # "none", "low", "medium", "high", "critical"
    fairness_confidence: float
    passed_validation: bool
    explanation: str

def _compute_dpg(original_hits, cf_hits):
    """Demographic Parity Gap: difference in detection rates between groups."""
    total = max(original_hits + cf_hits, 1)
    return round(abs(original_hits - cf_hits) / total, 3)

def _compute_eod(orig_confidence, cf_confidence):
    """Equalized Odds Difference from confidence scores."""
    return round(abs(orig_confidence - cf_confidence), 3)

def _compute_seat(orig_confidence, neutral_ratio, toxicity):
    """Simplified SEAT-inspired effect size."""
    effect = orig_confidence * (1 - neutral_ratio) + toxicity * 0.3
    return round(min(effect, 1.0), 3)

def _severity(confidence, toxicity, dpg):
    combined = confidence * 0.5 + toxicity * 0.3 + dpg * 0.2
    if combined < 0.15: return "none"
    if combined < 0.30: return "low"
    if combined < 0.55: return "medium"
    if combined < 0.75: return "high"
    return "critical"

def validate_fairness(
    original_text: str,
    counterfactual_text: str,
    bias_confidence: float,
    toxicity_score: float,
    neutral_ratio: float,
    suppression_factor: float,
) -> FairnessMetrics:
    """
    Stage 5: Compute fairness metrics by comparing original and counterfactual.
    """
    orig_result = detect_bias(original_text)
    cf_result = detect_bias(counterfactual_text)

    dpg = _compute_dpg(orig_result.total_hits, cf_result.total_hits)
    eod = _compute_eod(orig_result.raw_confidence, cf_result.raw_confidence)
    seat = _compute_seat(bias_confidence, neutral_ratio, toxicity_score)

    # Apply suppression factor from context validation
    adj_dpg = round(dpg * suppression_factor, 3)
    adj_seat = round(seat * suppression_factor, 3)

    severity = _severity(bias_confidence * suppression_factor, toxicity_score * suppression_factor, adj_dpg)
    passed = severity in ("none", "low")
    fairness_conf = round(max(0.05, 1.0 - (bias_confidence * suppression_factor)), 3)

    explanations = []
    if passed:
        explanations.append("Text passes fairness validation thresholds.")
    else:
        if adj_dpg > 0.3:
            explanations.append(f"High demographic parity gap ({adj_dpg}).")
        if eod > 0.3:
            explanations.append(f"Significant equalized odds difference ({eod}).")
        if adj_seat > 0.5:
            explanations.append(f"Elevated SEAT effect size ({adj_seat}).")

    return FairnessMetrics(
        demographic_parity_gap=adj_dpg,
        equalized_odds_diff=eod,
        seat_score=adj_seat,
        bias_severity=severity,
        fairness_confidence=fairness_conf,
        passed_validation=passed,
        explanation=" ".join(explanations) if explanations else "No significant fairness concerns detected.",
    )
