"""
Bias Pipeline — FairNLP-MT Orchestrator
========================================
Chains the 4-stage pipeline together:

  Input Text
      ↓
  Stage 1: Intent Classification    (intent_classifier.py)
      ↓
  Stage 2: Bias Pattern Detection   (pattern co-occurrence)
      ↓
  Stage 3: Context Validation       (context_validator.py)
      ↓
  Stage 4: Fairness Reasoning       (combine all signals)
      ↓
  Final Bias Classification

All stages are lightweight rule-based / heuristic NLP.
No additional ML models are loaded (stays within Railway 500MB RAM).
"""

import re
import random
from dataclasses import dataclass
from backend.services.intent_classifier import classify_intent, IntentResult
from backend.services.context_validator import validate_context, ContextResult


# ══════════════════════════════════════════════════════════════════════════
# Stage 2: Bias Pattern Detection (co-occurrence based)
# ══════════════════════════════════════════════════════════════════════════

MALE_TERMS = r"\b(he|him|his|man|men|boy|boys|male|father|husband|son|brother|gentleman)\b"
FEMALE_TERMS = r"\b(she|her|hers|woman|women|girl|girls|female|mother|wife|daughter|sister|lady)\b"

MALE_STEREO_ROLES = r"\b(ceo|engineer|programmer|surgeon|pilot|leader|boss|executive|scientist|professor|developer|architect)\b"
FEMALE_STEREO_ROLES = r"\b(nurse|secretary|receptionist|housekeeper|nanny|maid|caregiver|beautician|librarian|assistant)\b"

MALE_STEREO_ADJ = r"\b(brilliant|strong|assertive|aggressive|ambitious|rational|logical|powerful|dominant|authoritative)\b"
FEMALE_STEREO_ADJ = r"\b(emotional|caring|nurturing|gentle|passive|delicate|supportive|sensitive|soft|pretty|beautiful|cute)\b"

RACIAL_TERMS = r"\b(black|white|asian|hispanic|latino|latina|african|caucasian|arab|indian|native|muslim|jewish)\b"
RACIAL_STEREO = r"\b(criminal|terrorist|illegal|lazy|thug|exotic|dangerous|gangster|violent|aggressive|submissive|model minority)\b"

AGE_TERMS = r"\b(older|elderly|senior|young|younger|junior|aged|aging|retirement|millennial|boomer)\b"
AGE_STEREO = r"\b(slow|outdated|incompetent|inexperienced|immature|entitled|useless|drain|burden|obsolete)\b"

NEUTRAL_TERMS = r"\b(person|individual|professional|people|someone|they|them|their|one|worker|employee|colleague|human|everyone)\b"


def _count_pattern_hits(text: str, pattern_a: str, pattern_b: str, window: int = 80) -> int:
    """Count how many times pattern_a appears NEAR pattern_b within a character window."""
    hits = 0
    for m in re.finditer(pattern_a, text, re.IGNORECASE):
        start = max(0, m.start() - window)
        end = min(len(text), m.end() + window)
        neighbourhood = text[start:end]
        if re.search(pattern_b, neighbourhood, re.IGNORECASE):
            hits += 1
    return hits


@dataclass
class PatternResult:
    """Result of pattern-based bias detection."""
    gender_hits: int
    racial_hits: int
    age_hits: int
    total_hits: int
    dominant_type: str       # "gender", "race", "age", or "none"
    neutral_ratio: float     # proportion of neutral language


def detect_patterns(text: str) -> PatternResult:
    """
    Stage 2: Detect biased stereotype co-occurrences in text.
    Returns raw hit counts without any intent/context adjustment.
    """
    t = text.lower()
    
    # ── Gender bias ──
    gender_hits = 0
    # Cross-stereotype: male term + female-stereo role (and vice versa)
    gender_hits += _count_pattern_hits(t, MALE_TERMS, FEMALE_STEREO_ROLES)
    gender_hits += _count_pattern_hits(t, FEMALE_TERMS, MALE_STEREO_ROLES)
    # Same-stereotype reinforcement: male + male-adj, female + female-adj
    gender_hits += _count_pattern_hits(t, MALE_TERMS, MALE_STEREO_ADJ)
    gender_hits += _count_pattern_hits(t, FEMALE_TERMS, FEMALE_STEREO_ADJ)
    # Gendered role pairing (e.g., "he is a doctor and she is a nurse")
    gender_hits += _count_pattern_hits(t, MALE_TERMS, MALE_STEREO_ROLES)
    gender_hits += _count_pattern_hits(t, FEMALE_TERMS, FEMALE_STEREO_ROLES)
    
    # ── Racial bias ──
    racial_hits = _count_pattern_hits(t, RACIAL_TERMS, RACIAL_STEREO)
    
    # ── Age bias ──
    age_hits = _count_pattern_hits(t, AGE_TERMS, AGE_STEREO)
    
    # ── Neutral language ratio ──
    neutral_count = len(re.findall(NEUTRAL_TERMS, t, re.IGNORECASE))
    word_count = max(len(t.split()), 1)
    neutral_ratio = min(neutral_count / word_count * 3, 1.0)
    
    # Determine dominant type
    total_hits = gender_hits + racial_hits + age_hits
    dominant = "none"
    if total_hits > 0:
        scores = [("gender", gender_hits), ("race", racial_hits), ("age", age_hits)]
        scores.sort(key=lambda x: x[1], reverse=True)
        dominant = scores[0][0]
    
    return PatternResult(
        gender_hits=gender_hits,
        racial_hits=racial_hits,
        age_hits=age_hits,
        total_hits=total_hits,
        dominant_type=dominant,
        neutral_ratio=neutral_ratio,
    )


# ══════════════════════════════════════════════════════════════════════════
# Stage 4: Fairness Reasoning — Combine all signals
# ══════════════════════════════════════════════════════════════════════════

@dataclass
class PipelineResult:
    """Final output of the full bias pipeline."""
    bias_detected: bool
    bias_type: str
    confidence: float
    fairness_score: float
    toxicity_score: float
    sentiment_score: float
    intent: str                # promoting | analytical | critical | reporting | neutral
    context_note: str          # human-readable explanation


def analyze(text: str) -> PipelineResult:
    """
    Run the full 4-stage bias pipeline.
    
    Stage 1: Intent Classification
    Stage 2: Bias Pattern Detection
    Stage 3: Context Validation
    Stage 4: Fairness Reasoning (this function combines everything)
    """
    
    # ── Stage 1: Intent Classification ──
    intent_result: IntentResult = classify_intent(text)
    
    # ── Stage 2: Pattern Detection ──
    pattern_result: PatternResult = detect_patterns(text)
    
    # ── Stage 3: Context Validation ──
    context_result: ContextResult = validate_context(text, intent=intent_result.intent)
    
    # ── Stage 4: Fairness Reasoning ──
    
    # If NO patterns were detected at all → text is fair
    if pattern_result.total_hits == 0:
        return PipelineResult(
            bias_detected=False,
            bias_type="none",
            confidence=round(random.uniform(0.05, 0.15), 2),
            fairness_score=round(0.88 + pattern_result.neutral_ratio * 0.10, 2),
            toxicity_score=round(random.uniform(0.01, 0.06), 2),
            sentiment_score=round(0.72 + random.uniform(0.0, 0.13), 2),
            intent=intent_result.intent,
            context_note=intent_result.explanation,
        )
    
    # ── Raw scores from pattern hits ──
    raw_confidence = min(0.45 + pattern_result.total_hits * 0.10, 0.98)
    raw_fairness = max(0.10, 0.82 - pattern_result.total_hits * 0.09)
    raw_toxicity = min(0.05 + pattern_result.total_hits * 0.05, 0.55)
    raw_sentiment = max(0.30, 0.78 - pattern_result.total_hits * 0.04)
    
    # ── Apply context suppression ──
    # suppression_factor: 1.0 = keep full bias, 0.0 = suppress entirely
    sf = context_result.suppression_factor
    
    # Adjust confidence: lower when context mitigates bias
    adjusted_confidence = raw_confidence * sf
    
    # Adjust fairness: higher when context mitigates bias
    adjusted_fairness = raw_fairness + (1.0 - sf) * (0.95 - raw_fairness)
    
    # Adjust toxicity: lower when context mitigates bias
    adjusted_toxicity = raw_toxicity * sf
    
    # Adjust sentiment: higher when context mitigates bias
    adjusted_sentiment = raw_sentiment + (1.0 - sf) * (0.85 - raw_sentiment) * 0.5
    
    # Neutrality bonus
    nr = pattern_result.neutral_ratio
    adjusted_confidence = adjusted_confidence - nr * 0.08
    adjusted_fairness = adjusted_fairness + nr * 0.05
    
    # Clamp all values
    adjusted_confidence = round(max(0.05, min(0.98, adjusted_confidence)), 2)
    adjusted_fairness = round(max(0.05, min(0.98, adjusted_fairness)), 2)
    adjusted_toxicity = round(max(0.01, min(0.60, adjusted_toxicity)), 2)
    adjusted_sentiment = round(max(0.25, min(0.95, adjusted_sentiment)), 2)
    
    # ── Final bias detection threshold ──
    # After context suppression, if confidence drops below 0.25 → not biased
    bias_detected = adjusted_confidence >= 0.25
    
    # Build context note
    if sf < 0.5:
        context_note = (
            f"Context mitigates detected patterns: {context_result.explanation}. "
            f"Intent: {intent_result.intent} ({intent_result.explanation})"
        )
    elif sf < 0.8:
        context_note = (
            f"Partial context mitigation: {context_result.explanation}. "
            f"Intent: {intent_result.intent}."
        )
    else:
        context_note = intent_result.explanation
    
    return PipelineResult(
        bias_detected=bias_detected,
        bias_type=pattern_result.dominant_type if bias_detected else "none",
        confidence=adjusted_confidence,
        fairness_score=adjusted_fairness,
        toxicity_score=adjusted_toxicity,
        sentiment_score=adjusted_sentiment,
        intent=intent_result.intent,
        context_note=context_note,
    )
