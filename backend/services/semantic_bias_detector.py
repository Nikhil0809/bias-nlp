"""
Semantic Bias Detector — Stage 1 of the FairNLP-MT Pipeline
=============================================================
Detects bias through:
  • Stereotype co-occurrence patterns (gendered, racial, age, religious)
  • Toxicity keyword analysis
  • Sentiment polarity detection
  • Occupational stereotype detection

Returns raw bias signals BEFORE intent/context adjustment.
Lightweight rule-based + heuristic approach (no model loading).
"""

import re
from dataclasses import dataclass, field


# ══════════════════════════════════════════════════════════════════════════
# Pattern Lexicons
# ══════════════════════════════════════════════════════════════════════════

MALE_TERMS = r"\b(he|him|his|man|men|boy|boys|male|father|husband|son|brother|gentleman)\b"
FEMALE_TERMS = r"\b(she|her|hers|woman|women|girl|girls|female|mother|wife|daughter|sister|lady)\b"

MALE_STEREO_ROLES = r"\b(ceo|engineer|programmer|surgeon|pilot|leader|boss|executive|scientist|professor|developer|architect|mechanic|soldier)\b"
FEMALE_STEREO_ROLES = r"\b(nurse|secretary|receptionist|housekeeper|nanny|maid|caregiver|beautician|librarian|assistant|babysitter|cleaner)\b"

MALE_STEREO_ADJ = r"\b(brilliant|strong|assertive|aggressive|ambitious|rational|logical|powerful|dominant|authoritative|competent|capable)\b"
FEMALE_STEREO_ADJ = r"\b(emotional|caring|nurturing|gentle|passive|delicate|supportive|sensitive|soft|pretty|beautiful|cute|hysterical)\b"

RACIAL_TERMS = r"\b(black|white|asian|hispanic|latino|latina|african|caucasian|arab|indian|native|muslim|jewish|chinese|japanese|korean|mexican)\b"
RACIAL_STEREO = r"\b(criminal|terrorist|illegal|lazy|thug|exotic|dangerous|gangster|violent|aggressive|submissive|model minority|uncivilized|savage)\b"

AGE_TERMS = r"\b(older|elderly|senior|young|younger|aged|aging|retirement|boomer|millennial|gen z|old)\b"
AGE_STEREO = r"\b(slow|outdated|incompetent|inexperienced|immature|entitled|useless|drain|burden|obsolete|senile|forgetful)\b"

RELIGIOUS_TERMS = r"\b(muslim|christian|jewish|hindu|buddhist|atheist|religious)\b"
RELIGIOUS_STEREO = r"\b(terrorist|extremist|fanatic|radical|backward|primitive|cult|brainwashed|oppressive)\b"

TOXICITY_TERMS = r"\b(hate|kill|die|stupid|idiot|moron|retard|trash|garbage|worthless|disgusting|pathetic|loser|scum|inferior|subhuman)\b"

POSITIVE_SENTIMENT = r"\b(good|great|excellent|wonderful|amazing|brilliant|outstanding|exceptional|remarkable|impressive|talented|skilled)\b"
NEGATIVE_SENTIMENT = r"\b(bad|terrible|awful|horrible|dreadful|poor|weak|incompetent|useless|worthless|incapable|inferior|pathetic)\b"

NEUTRAL_TERMS = r"\b(person|individual|professional|people|someone|they|them|their|one|worker|employee|colleague|human|everyone|anyone)\b"


def _count_cooccurrence(text: str, pattern_a: str, pattern_b: str, window: int = 80) -> int:
    """Count co-occurrences of pattern_a NEAR pattern_b within a character window."""
    hits = 0
    for m in re.finditer(pattern_a, text, re.IGNORECASE):
        start = max(0, m.start() - window)
        end = min(len(text), m.end() + window)
        neighbourhood = text[start:end]
        if re.search(pattern_b, neighbourhood, re.IGNORECASE):
            hits += 1
    return hits


@dataclass
class BiasSignal:
    """A single bias signal detected in the text."""
    category: str     # gender, race, age, religion
    hits: int         # number of co-occurrence hits
    examples: list = field(default_factory=list)


@dataclass
class SemanticBiasResult:
    """Output of Stage 1: Semantic Bias Detection."""
    signals: list            # list of BiasSignal
    total_hits: int
    dominant_type: str       # the bias category with the most hits
    toxicity_score: float    # 0.0 – 1.0
    sentiment_polarity: float  # -1.0 (negative) to 1.0 (positive)
    neutral_ratio: float     # proportion of neutral language
    raw_confidence: float    # raw bias confidence before context adjustment
    raw_fairness: float      # raw fairness score before context adjustment


def detect_bias(text: str) -> SemanticBiasResult:
    """
    Stage 1: Detect bias through stereotype co-occurrence patterns,
    toxicity analysis, and sentiment polarity.
    
    Returns raw scores that Stage 4 (Intent) and Stage 5 (Fairness)
    will adjust based on context.
    """
    t = text.lower()
    signals = []
    
    # ── Gender Bias ──
    gender_hits = 0
    gender_hits += _count_cooccurrence(t, MALE_TERMS, FEMALE_STEREO_ROLES)
    gender_hits += _count_cooccurrence(t, FEMALE_TERMS, MALE_STEREO_ROLES)
    gender_hits += _count_cooccurrence(t, MALE_TERMS, MALE_STEREO_ADJ)
    gender_hits += _count_cooccurrence(t, FEMALE_TERMS, FEMALE_STEREO_ADJ)
    gender_hits += _count_cooccurrence(t, MALE_TERMS, MALE_STEREO_ROLES)
    gender_hits += _count_cooccurrence(t, FEMALE_TERMS, FEMALE_STEREO_ROLES)
    if gender_hits > 0:
        signals.append(BiasSignal(category="gender", hits=gender_hits))
    
    # ── Racial Bias ──
    racial_hits = _count_cooccurrence(t, RACIAL_TERMS, RACIAL_STEREO)
    if racial_hits > 0:
        signals.append(BiasSignal(category="race", hits=racial_hits))
    
    # ── Age Bias ──
    age_hits = _count_cooccurrence(t, AGE_TERMS, AGE_STEREO)
    if age_hits > 0:
        signals.append(BiasSignal(category="age", hits=age_hits))
    
    # ── Religious Bias ──
    religious_hits = _count_cooccurrence(t, RELIGIOUS_TERMS, RELIGIOUS_STEREO)
    if religious_hits > 0:
        signals.append(BiasSignal(category="religion", hits=religious_hits))
    
    # ── Toxicity Score ──
    toxicity_count = len(re.findall(TOXICITY_TERMS, t))
    word_count = max(len(t.split()), 1)
    toxicity_score = min(toxicity_count / word_count * 5, 1.0)
    
    # ── Sentiment Polarity ──
    pos_count = len(re.findall(POSITIVE_SENTIMENT, t))
    neg_count = len(re.findall(NEGATIVE_SENTIMENT, t))
    total_sent = pos_count + neg_count
    if total_sent > 0:
        sentiment_polarity = (pos_count - neg_count) / total_sent
    else:
        sentiment_polarity = 0.0
    
    # ── Neutral Language Ratio ──
    neutral_count = len(re.findall(NEUTRAL_TERMS, t, re.IGNORECASE))
    neutral_ratio = min(neutral_count / word_count * 3, 1.0)
    
    # ── Aggregate ──
    total_hits = sum(s.hits for s in signals)
    
    if signals:
        signals.sort(key=lambda s: s.hits, reverse=True)
        dominant_type = signals[0].category
    else:
        dominant_type = "none"
    
    # Raw scores (before intent/context adjustment)
    raw_confidence = min(0.40 + total_hits * 0.10 + toxicity_score * 0.15, 0.98)
    raw_fairness = max(0.08, 0.85 - total_hits * 0.08 - toxicity_score * 0.10)
    
    return SemanticBiasResult(
        signals=signals,
        total_hits=total_hits,
        dominant_type=dominant_type,
        toxicity_score=round(toxicity_score, 3),
        sentiment_polarity=round(sentiment_polarity, 3),
        neutral_ratio=round(neutral_ratio, 3),
        raw_confidence=round(raw_confidence, 3),
        raw_fairness=round(raw_fairness, 3),
    )
