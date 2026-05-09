"""
Preprocessing & Cleaning Layer — FairNLP-MT Pipeline
=====================================================
Handles text normalization, tokenization, entity recognition,
protected attribute extraction, and context segmentation.

Lightweight implementation — no ML model required.
"""

import re
from dataclasses import dataclass, field


# ── Protected Attribute Lexicons ─────────────────────────────────────────

GENDER_TERMS = {
    "male": ["he", "him", "his", "man", "men", "boy", "boys", "male", "father",
             "husband", "son", "brother", "gentleman", "mr", "sir", "king", "prince"],
    "female": ["she", "her", "hers", "woman", "women", "girl", "girls", "female",
               "mother", "wife", "daughter", "sister", "lady", "ms", "mrs", "miss",
               "queen", "princess"],
}

RACIAL_TERMS = {
    "african_american": ["black", "african", "african american"],
    "caucasian": ["white", "caucasian", "european"],
    "asian": ["asian", "chinese", "japanese", "korean", "indian", "south asian"],
    "hispanic": ["hispanic", "latino", "latina", "latinx", "mexican"],
    "middle_eastern": ["arab", "muslim", "middle eastern"],
    "jewish": ["jewish", "jew"],
}

RELIGIOUS_TERMS = {
    "islam": ["muslim", "islam", "islamic", "mosque", "quran"],
    "christianity": ["christian", "church", "bible", "catholic", "protestant"],
    "judaism": ["jewish", "jew", "synagogue", "torah"],
    "hinduism": ["hindu", "temple", "vedic"],
    "buddhism": ["buddhist", "buddhism"],
}

AGE_TERMS = {
    "older": ["older", "elderly", "senior", "aged", "aging", "retirement", "retired",
              "boomer", "old"],
    "younger": ["young", "younger", "junior", "millennial", "gen z", "youth", "teen",
                "adolescent"],
}

OCCUPATION_TERMS = [
    "doctor", "nurse", "engineer", "teacher", "professor", "scientist",
    "lawyer", "judge", "ceo", "executive", "manager", "secretary",
    "receptionist", "pilot", "surgeon", "programmer", "developer",
    "architect", "designer", "artist", "writer", "journalist",
    "police", "firefighter", "soldier", "mechanic", "plumber",
    "chef", "cook", "cleaner", "janitor", "nanny", "babysitter",
    "librarian", "accountant", "banker", "analyst", "consultant",
]


@dataclass
class ProtectedAttributes:
    """Detected protected attribute categories in the text."""
    gender_terms: list = field(default_factory=list)
    racial_terms: list = field(default_factory=list)
    religious_terms: list = field(default_factory=list)
    age_terms: list = field(default_factory=list)
    occupation_terms: list = field(default_factory=list)
    
    @property
    def has_protected_attributes(self) -> bool:
        return bool(self.gender_terms or self.racial_terms or 
                    self.religious_terms or self.age_terms)
    
    @property
    def categories(self) -> list:
        cats = []
        if self.gender_terms: cats.append("gender")
        if self.racial_terms: cats.append("race")
        if self.religious_terms: cats.append("religion")
        if self.age_terms: cats.append("age")
        if self.occupation_terms: cats.append("occupation")
        return cats


@dataclass
class PreprocessedText:
    """Result of the preprocessing pipeline."""
    original: str
    normalized: str
    tokens: list
    word_count: int
    sentence_count: int
    protected_attributes: ProtectedAttributes
    segments: list  # context segments (sentences)


def normalize_text(text: str) -> str:
    """Normalize text while preserving meaning."""
    # Normalize unicode quotes
    t = text.replace('\u201c', '"').replace('\u201d', '"')
    t = t.replace('\u2018', "'").replace('\u2019', "'")
    # Normalize whitespace
    t = re.sub(r'\s+', ' ', t).strip()
    # Normalize common contractions for analysis consistency
    contractions = {
        r"\bcan't\b": "cannot", r"\bwon't\b": "will not",
        r"\bdon't\b": "do not", r"\bdoesn't\b": "does not",
        r"\bdidn't\b": "did not", r"\bisn't\b": "is not",
        r"\baren't\b": "are not", r"\bwasn't\b": "was not",
        r"\bweren't\b": "were not", r"\bshouldn't\b": "should not",
        r"\bcouldn't\b": "could not", r"\bwouldn't\b": "would not",
    }
    for pattern, replacement in contractions.items():
        t = re.sub(pattern, replacement, t, flags=re.IGNORECASE)
    return t


def tokenize(text: str) -> list:
    """Simple word tokenization."""
    return re.findall(r'\b\w+\b', text.lower())


def segment_sentences(text: str) -> list:
    """Split text into sentence segments."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if s.strip()]


def extract_protected_attributes(tokens: list, original_text: str) -> ProtectedAttributes:
    """Extract all protected attribute mentions from tokenized text."""
    token_set = set(tokens)
    lower_text = original_text.lower()
    
    gender = []
    for group, terms in GENDER_TERMS.items():
        for term in terms:
            if term in token_set:
                gender.append({"group": group, "term": term})
    
    racial = []
    for group, terms in RACIAL_TERMS.items():
        for term in terms:
            if len(term.split()) > 1:
                if term in lower_text:
                    racial.append({"group": group, "term": term})
            elif term in token_set:
                racial.append({"group": group, "term": term})
    
    religious = []
    for group, terms in RELIGIOUS_TERMS.items():
        for term in terms:
            if term in token_set:
                religious.append({"group": group, "term": term})
    
    age = []
    for group, terms in AGE_TERMS.items():
        for term in terms:
            if len(term.split()) > 1:
                if term in lower_text:
                    age.append({"group": group, "term": term})
            elif term in token_set:
                age.append({"group": group, "term": term})
    
    occupations = []
    for occ in OCCUPATION_TERMS:
        if occ in token_set:
            occupations.append(occ)
    
    return ProtectedAttributes(
        gender_terms=gender,
        racial_terms=racial,
        religious_terms=religious,
        age_terms=age,
        occupation_terms=occupations,
    )


def preprocess(text: str) -> PreprocessedText:
    """
    Full preprocessing pipeline:
    1. Normalize text
    2. Tokenize
    3. Segment into sentences
    4. Extract protected attributes
    5. Return structured PreprocessedText
    """
    normalized = normalize_text(text)
    tokens = tokenize(normalized)
    segments = segment_sentences(normalized)
    attributes = extract_protected_attributes(tokens, normalized)
    
    return PreprocessedText(
        original=text,
        normalized=normalized,
        tokens=tokens,
        word_count=len(tokens),
        sentence_count=len(segments),
        protected_attributes=attributes,
        segments=segments,
    )
