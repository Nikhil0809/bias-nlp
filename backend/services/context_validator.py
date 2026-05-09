"""
Context Validator — Stage 3 of the FairNLP-MT Bias Pipeline
============================================================
Validates whether detected bias patterns are genuinely harmful
by examining the linguistic context around each detection.

Checks for:
  - Negation context ("are NOT less capable")
  - Critique framing ("unfairly assumed", "wrongly believed")
  - Educational markers ("research shows", "studies indicate")
  - Passive / reporting voice
  - Quotation / attribution ("he claimed that…")
  - Conditional / hypothetical framing ("if we assume…")

Returns a suppression_factor (0.0 – 1.0) that the pipeline uses
to reduce raw bias scores when the context is non-harmful.
"""

import re
from dataclasses import dataclass


@dataclass
class ContextResult:
    """Result of context validation."""
    suppression_factor: float    # 0.0 = fully suppress bias, 1.0 = keep full bias
    negation_detected: bool
    critique_framing: bool
    educational_context: bool
    passive_voice: bool
    quoted_content: bool
    conditional_framing: bool
    explanation: str


# ── Context Patterns ─────────────────────────────────────────────────────

NEGATION_WINDOW_PATTERNS = [
    r"\b(not|never|no longer|isn't|aren't|wasn't|weren't)\b",
    r"\b(don't|doesn't|didn't|won't|wouldn't|shouldn't|couldn't|cannot|can't)\b",
    r"\b(without|lack\w*|absence|free from|devoid of)\b",
    r"\b(neither|nor|none|nothing|nobody)\b",
]

CRITIQUE_FRAME_PATTERNS = [
    r"\b(unfairly|unjustly|wrongly|incorrectly|falsely|mistakenly)\b",
    r"\b(discriminat\w*|prejudic\w*|stereotyp\w*|bias\w*)\b",
    r"\b(problematic|harmful|toxic|offensive|unacceptable)\b",
    r"\b(assumed|presupposed|believed|thought|concluded)\s+(that|women|men|people|they)",
    r"\b(perpetuat\w*|reinforc\w*|promot\w*)\s+(stereotyp\w*|bias\w*|discriminat\w*)",
    r"\b(combat|fight|address|tackle|eliminate|reduce|mitigat\w*)\s+(bias\w*|discriminat\w*|inequal\w*)",
]

EDUCATIONAL_PATTERNS = [
    r"\b(research\w*|stud\w+|evidence|data|finding\w*|literature)\b",
    r"\b(demonstrate\w*|indicat\w*|suggest\w*|reveal\w*|show\w*)\b",
    r"\b(according to|historically|statistically|empirically)\b",
    r"\b(analys\w+|examin\w+|investigat\w+|evaluat\w+|assess\w+)\b",
    r"\b(framework|model|approach|method\w*|technique)\b",
]

PASSIVE_VOICE_PATTERNS = [
    r"\b(was|were|been|being|is|are)\s+(considered|viewed|perceived|treated|seen|regarded)\b",
    r"\b(was|were|been|being|is|are)\s+(assumed|expected|believed|thought|said)\b",
    r"\b(was|were|been|being|is|are)\s+(discriminated|marginalized|excluded|underrepresented)\b",
]

QUOTATION_PATTERNS = [
    r'["\u201c].{5,}["\u201d]',          # Actual quoted text
    r"\b(said|stated|claimed|argued|wrote|noted|remarked|asserted)\b",
    r"\b(according to|as \w+ put it|in the words of)\b",
]

CONDITIONAL_PATTERNS = [
    r"\b(if|whether|suppose|assuming|hypothetically|in theory)\b",
    r"\b(could|might|may|would|should)\s+(be|have|lead|result)\b",
    r"\b(potential|possible|hypothetical|theoretical|speculative)\b",
]

# Identity / demographic terms (their MERE PRESENCE should NOT trigger bias)
DEMOGRAPHIC_TERMS = [
    r"\b(male|female|man|woman|men|women|boy|girl)\b",
    r"\b(african american|asian|hispanic|latino|latina|caucasian|arab|muslim|jewish|christian|hindu)\b",
    r"\b(older|younger|elderly|senior|junior)\b",
    r"\b(gay|lesbian|bisexual|transgender|lgbtq|queer)\b",
    r"\b(disabled|disability|impairment|neurodivergent)\b",
    r"\b(race|gender|ethnicity|religion|age|orientation|identity)\b",
]


def _count_markers(text: str, patterns: list[str]) -> int:
    """Count total regex matches across all patterns."""
    total = 0
    for p in patterns:
        total += len(re.findall(p, text, re.IGNORECASE))
    return total


def _has_negation_near_stereotype(text: str, stereo_pattern: str, window: int = 50) -> bool:
    """Check if negation words appear near any stereotype match."""
    for m in re.finditer(stereo_pattern, text, re.IGNORECASE):
        start = max(0, m.start() - window)
        end = min(len(text), m.end() + window)
        neighbourhood = text[start:end]
        for neg in NEGATION_WINDOW_PATTERNS:
            if re.search(neg, neighbourhood, re.IGNORECASE):
                return True
    return False


STEREO_COMBINED = (
    r"\b(less capable|incapable|inferior|superior|dominant|submissive|"
    r"emotional|irrational|aggressive|lazy|dangerous|criminal|"
    r"terrorist|exotic|thug|belong in)\b"
)


def validate_context(text: str, intent: str = "neutral") -> ContextResult:
    """
    Validate the context around bias-related content.
    
    Returns a ContextResult with a suppression_factor:
      - 1.0 → the text IS genuinely biased (no suppression)
      - 0.0 → the text is NOT biased despite containing demographic terms
    
    The intent from Stage 1 also influences suppression.
    """
    t = text.lower()
    word_count = max(len(t.split()), 1)
    
    # Detect context signals
    negation = _has_negation_near_stereotype(t, STEREO_COMBINED)
    critique_count = _count_markers(t, CRITIQUE_FRAME_PATTERNS)
    educational_count = _count_markers(t, EDUCATIONAL_PATTERNS)
    passive_count = _count_markers(t, PASSIVE_VOICE_PATTERNS)
    quote_count = _count_markers(t, QUOTATION_PATTERNS)
    conditional_count = _count_markers(t, CONDITIONAL_PATTERNS)
    demographic_count = _count_markers(t, DEMOGRAPHIC_TERMS)
    
    # Boolean flags
    critique_framing = critique_count >= 1
    educational_context = educational_count >= 2
    passive_voice = passive_count >= 1
    quoted_content = quote_count >= 1
    conditional_framing = conditional_count >= 1
    
    # ── Calculate suppression factor ─────────────────────────────────
    # Start at 1.0 (= full bias). Each mitigating signal reduces it.
    
    suppression = 1.0
    reasons = []
    
    # Negation directly near a stereotype term is a very strong signal
    if negation:
        suppression -= 0.35
        reasons.append("Negation detected near stereotype terms")
    
    # Critique framing
    if critique_framing:
        reduction = min(critique_count * 0.12, 0.35)
        suppression -= reduction
        reasons.append(f"Critique/opposition framing ({critique_count} markers)")
    
    # Educational context
    if educational_context:
        reduction = min(educational_count * 0.08, 0.30)
        suppression -= reduction
        reasons.append(f"Educational/research context ({educational_count} markers)")
    
    # Passive / reporting voice
    if passive_voice:
        suppression -= 0.10
        reasons.append("Passive/reporting voice detected")
    
    # Quoted / attributed content
    if quoted_content:
        suppression -= 0.10
        reasons.append("Quoted or attributed content")
    
    # Conditional / hypothetical
    if conditional_framing:
        suppression -= 0.08
        reasons.append("Conditional/hypothetical framing")
    
    # Intent-based adjustment (from Stage 1)
    intent_adjustments = {
        "critical": -0.25,
        "analytical": -0.20,
        "reporting": -0.15,
        "neutral": 0.0,
        "promoting": 0.10,   # slight boost for promoting intent
    }
    intent_adj = intent_adjustments.get(intent, 0.0)
    suppression += intent_adj
    if intent_adj < 0:
        reasons.append(f"Intent classified as '{intent}'")
    
    # Demographic terms WITHOUT stereotype terms is a major suppression signal
    # (text *about* demographics but not stereotyping them)
    stereo_count = len(re.findall(STEREO_COMBINED, t))
    if demographic_count >= 2 and stereo_count == 0:
        suppression -= 0.30
        reasons.append("Demographic terms present without stereotypical associations")
    
    # Clamp to [0.0, 1.0]
    suppression = round(max(0.0, min(1.0, suppression)), 3)
    
    explanation = "; ".join(reasons) if reasons else "No mitigating context detected — bias signals are taken at face value."
    
    return ContextResult(
        suppression_factor=suppression,
        negation_detected=negation,
        critique_framing=critique_framing,
        educational_context=educational_context,
        passive_voice=passive_voice,
        quoted_content=quoted_content,
        conditional_framing=conditional_framing,
        explanation=explanation,
    )
