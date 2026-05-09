"""
Counterfactual Analysis Engine — Stage 2 of FairNLP-MT Pipeline
"""
import re
from dataclasses import dataclass, field

GENDER_SWAPS = {
    "he": "she", "she": "he", "him": "her", "her": "him",
    "his": "her", "hers": "his", "himself": "herself", "herself": "himself",
    "man": "woman", "woman": "man", "men": "women", "women": "men",
    "boy": "girl", "girl": "boy", "father": "mother", "mother": "father",
    "husband": "wife", "wife": "husband", "son": "daughter", "daughter": "son",
    "brother": "sister", "sister": "brother", "male": "female", "female": "male",
}

NEUTRAL_REPLACEMENTS = {
    "he": "they", "she": "they", "him": "them", "her": "them",
    "his": "their", "hers": "theirs", "man": "person", "woman": "person",
    "men": "people", "women": "people", "boy": "child", "girl": "child",
    "father": "parent", "mother": "parent", "husband": "spouse", "wife": "spouse",
}

OCCUPATION_BALANCE = {
    "nurse": "healthcare professional", "secretary": "administrative professional",
    "nanny": "childcare professional", "maid": "cleaning professional",
    "fireman": "firefighter", "policeman": "police officer",
    "stewardess": "flight attendant", "chairman": "chairperson",
}

@dataclass
class CounterfactualVariant:
    swap_type: str
    text: str
    swaps_applied: list = field(default_factory=list)

@dataclass
class CounterfactualResult:
    original: str
    gender_swapped: str
    neutralized: str
    occupation_balanced: str
    variants: list
    swap_count: int

def _apply_swaps(text, swap_dict):
    result = text
    swaps_made = []
    sorted_terms = sorted(swap_dict.keys(), key=len, reverse=True)
    for original_term in sorted_terms:
        replacement = swap_dict[original_term]
        pattern = r'\b' + re.escape(original_term) + r'\b'
        def case_replace(match, rep=replacement):
            matched = match.group()
            if matched.isupper(): return rep.upper()
            elif matched[0].isupper(): return rep.capitalize()
            return rep
        new_result = re.sub(pattern, case_replace, result, flags=re.IGNORECASE)
        if new_result != result:
            swaps_made.append(f"{original_term} -> {replacement}")
            result = new_result
    return result, swaps_made

def generate_counterfactuals(text):
    variants = []
    total_swaps = 0
    gender_text, gender_swaps = _apply_swaps(text, GENDER_SWAPS)
    variants.append(CounterfactualVariant("gender", gender_text, gender_swaps))
    total_swaps += len(gender_swaps)
    neutral_text, neutral_swaps = _apply_swaps(text, NEUTRAL_REPLACEMENTS)
    variants.append(CounterfactualVariant("neutral", neutral_text, neutral_swaps))
    total_swaps += len(neutral_swaps)
    occ_text, occ_swaps = _apply_swaps(text, OCCUPATION_BALANCE)
    variants.append(CounterfactualVariant("occupation", occ_text, occ_swaps))
    total_swaps += len(occ_swaps)
    return CounterfactualResult(text, gender_text, neutral_text, occ_text, variants, total_swaps)
