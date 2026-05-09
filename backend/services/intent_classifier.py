"""
Intent Classifier — Stage 1 of the FairNLP-MT Bias Pipeline
============================================================
Classifies input text into one of five semantic intents:

  promoting  — Text that reinforces or states stereotypes as fact
  analytical — Neutral academic/research discussion about bias
  critical   — Text that opposes, critiques, or challenges bias
  reporting  — Neutral journalistic reporting of discrimination
  neutral    — No bias-related content at all

Uses lightweight linguistic markers (no ML model required).
"""

import re
from dataclasses import dataclass

# ── Linguistic Marker Lexicons ──────────────────────────────────────────

# Critique / opposition markers — indicate the author is AGAINST the bias
CRITIQUE_MARKERS = [
    r"\b(unfair|unjust|discriminat\w*|inequit\w*|prejudic\w*|stereotyp\w*)\b",
    r"\b(wrong|wrongly|incorrectly|falsely|mistakenly|erroneously)\b",
    r"\b(should not|shouldn't|must not|mustn't|cannot|can't)\b",
    r"\b(problematic|harmful|toxic|offensive|unacceptable|inappropriate)\b",
    r"\b(challenge|combat|fight|oppose|resist|reject|condemn|criticize|critique)\b",
    r"\b(bias\w*|sexis\w*|racis\w*|misogyn\w*|xenophob\w*|bigot\w*)\b",
    r"\b(perpetuat\w*|reinforc\w* stereotype\w*)\b",
]

# Analytical / educational markers — indicate academic/research framing
ANALYTICAL_MARKERS = [
    r"\b(study|studies|research|finding|findings|data|evidence|survey|analysis)\b",
    r"\b(demonstrate|indicat\w*|suggest\w*|reveal\w*|show\w*|found that)\b",
    r"\b(according to|literature|published|journal|report\w*|paper)\b",
    r"\b(historically|statistically|empirically|systematically)\b",
    r"\b(framework|methodology|hypothesis|experiment|variable)\b",
    r"\b(percent|percentage|rate|ratio|gap|disparity|difference)\b",
    r"\b(evaluate|assess|measure|quantif\w*|analyz\w*|examin\w*)\b",
]

# Reporting / journalistic markers — neutral third-person accounts
REPORTING_MARKERS = [
    r"\b(reported|alleged|claimed|stated|announced|testified)\b",
    r"\b(lawsuit|court|ruling|settlement|investigation|inquiry)\b",
    r"\b(policy|regulation|legislation|law|act|mandate)\b",
    r"\b(complaint|grievance|violation|incident|case)\b",
    r"\b(spokesperson|official|authority|representative)\b",
    r"\b(according to|sources say|witnesses)\b",
]

# Negation window — words that negate/reverse the meaning of nearby bias
NEGATION_PHRASES = [
    r"\b(not|never|no longer|isn't|aren't|wasn't|weren't|don't|doesn't|didn't)\b",
    r"\b(shouldn't|wouldn't|couldn't|cannot|won't|can't)\b",
    r"\b(without|lack of|absence of|regardless of|irrespective of)\b",
    r"\b(despite|although|even though|contrary to|unlike)\b",
]

# Direct assertion patterns — text that states stereotypes as fact
ASSERTION_PATTERNS = [
    r"\b(are|is|was|were)\s+(just|only|merely|simply|always|never)\b",
    r"\b(all|every|most|many)\s+(men|women|blacks|whites|asians|muslims|jews|christians)\s+(are|is|were|was)\b",
    r"\b(can't|cannot|unable to|incapable of|not capable|less capable|inferior)\b",
    r"\b(belong in|should stay|supposed to be|meant to be|made for)\b",
    r"\b(too emotional|too weak|too aggressive|too sensitive|too loud)\b",
]


@dataclass
class IntentResult:
    """Result of intent classification."""
    intent: str               # promoting | analytical | critical | reporting | neutral
    confidence: float         # 0.0 – 1.0
    critique_score: float     # how many critique markers found
    analytical_score: float   # how many analytical markers found
    reporting_score: float    # how many reporting markers found
    assertion_score: float    # how many direct-assertion patterns found
    explanation: str          # human-readable explanation


def _score_markers(text: str, patterns: list[str]) -> float:
    """Count how many marker patterns match in the text, return normalized score."""
    hits = 0
    for pattern in patterns:
        hits += len(re.findall(pattern, text, re.IGNORECASE))
    return hits


def _has_negation_near(text: str, target_match: re.Match, window: int = 40) -> bool:
    """Check if a negation phrase appears within `window` characters of a match."""
    start = max(0, target_match.start() - window)
    end = min(len(text), target_match.end() + window)
    neighbourhood = text[start:end]
    for neg_pattern in NEGATION_PHRASES:
        if re.search(neg_pattern, neighbourhood, re.IGNORECASE):
            return True
    return False


def classify_intent(text: str) -> IntentResult:
    """
    Classify the semantic intent of the input text.
    
    Priority order:
      1. If strong critique markers → "critical"
      2. If strong analytical markers → "analytical"
      3. If strong reporting markers → "reporting"
      4. If direct assertion patterns → "promoting"
      5. Otherwise → "neutral"
    """
    t = text.lower()
    word_count = max(len(t.split()), 1)
    
    # Score each dimension
    critique_raw = _score_markers(t, CRITIQUE_MARKERS)
    analytical_raw = _score_markers(t, ANALYTICAL_MARKERS)
    reporting_raw = _score_markers(t, REPORTING_MARKERS)
    assertion_raw = _score_markers(t, ASSERTION_PATTERNS)
    
    # Normalize by word count (longer texts naturally have more matches)
    normalize = lambda raw: min(raw / max(word_count * 0.08, 1), 1.0)
    
    critique_score = normalize(critique_raw)
    analytical_score = normalize(analytical_raw)
    reporting_score = normalize(reporting_raw)
    assertion_score = normalize(assertion_raw)
    
    # Check for quotation / attribution context
    has_quotes = bool(re.search(r'["\u201c\u201d]', text)) or bool(re.search(r"\b(said|claimed|argued|stated)\b", t))
    
    # ── Decision Logic ──
    
    # Strong critique framing overrides everything
    if critique_score >= 0.15 or critique_raw >= 2:
        return IntentResult(
            intent="critical",
            confidence=min(0.70 + critique_score * 0.3, 0.95),
            critique_score=critique_score,
            analytical_score=analytical_score,
            reporting_score=reporting_score,
            assertion_score=assertion_score,
            explanation="Text critiques or challenges bias rather than promoting it."
        )
    
    # Academic / research framing
    if analytical_score >= 0.12 or analytical_raw >= 2:
        return IntentResult(
            intent="analytical",
            confidence=min(0.65 + analytical_score * 0.35, 0.95),
            critique_score=critique_score,
            analytical_score=analytical_score,
            reporting_score=reporting_score,
            assertion_score=assertion_score,
            explanation="Text discusses bias in an analytical or educational context."
        )
    
    # Journalistic / reporting framing
    if reporting_score >= 0.12 or reporting_raw >= 2:
        return IntentResult(
            intent="reporting",
            confidence=min(0.60 + reporting_score * 0.35, 0.90),
            critique_score=critique_score,
            analytical_score=analytical_score,
            reporting_score=reporting_score,
            assertion_score=assertion_score,
            explanation="Text neutrally reports on discrimination or bias-related events."
        )
    
    # Direct assertion of stereotypes
    if assertion_score >= 0.05 or assertion_raw >= 1:
        return IntentResult(
            intent="promoting",
            confidence=min(0.60 + assertion_score * 0.4, 0.95),
            critique_score=critique_score,
            analytical_score=analytical_score,
            reporting_score=reporting_score,
            assertion_score=assertion_score,
            explanation="Text appears to state or reinforce stereotypes as fact."
        )
    
    # Quoted content with attribution → likely reporting
    if has_quotes and (critique_raw + analytical_raw + reporting_raw) > 0:
        return IntentResult(
            intent="reporting",
            confidence=0.55,
            critique_score=critique_score,
            analytical_score=analytical_score,
            reporting_score=reporting_score,
            assertion_score=assertion_score,
            explanation="Text contains attributed statements about bias."
        )
    
    # Default: neutral — no strong signal in any direction
    return IntentResult(
        intent="neutral",
        confidence=0.50,
        critique_score=critique_score,
        analytical_score=analytical_score,
        reporting_score=reporting_score,
        assertion_score=assertion_score,
        explanation="No strong bias-related intent detected."
    )
