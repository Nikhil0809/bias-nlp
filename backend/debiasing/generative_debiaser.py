from transformers import pipeline

class GenerativeDebiaser:
    def __init__(self):
        # Initialize the instruction-tuned FLAN-T5 model
        # Using the "small" or "base" model based on local resource constraints.
        # "base" provides a good balance between speed and generation quality.
        print("Loading generative debiasing model (google/flan-t5-base)...")
        self.generator = pipeline("text2text-generation", model="google/flan-t5-base")
        print("Model loaded successfully.")

    def rewrite(self, text: str) -> str:
        """
        Takes a biased input text and rewrites it into a neutral, fair version
        using instruction prompting.
        """
        prompt = (
            f"Rewrite the following sentence to remove any gender, racial, "
            f"or occupational bias while preserving the original meaning completely. "
            f"Make it neutral and professional: '{text}'"
        )
        
        try:
            # Generate the debiased text
            result = self.generator(
                prompt,
                max_length=128,
                num_return_sequences=1,
                do_sample=True,
                temperature=0.7,
                top_p=0.9
            )
            
            debiased_text = result[0]['generated_text'].strip()
            
            # Fallback if the model outputs something empty or bizarre
            if not debiased_text or len(debiased_text) < 5:
                return text
                
            return debiased_text
            
        except Exception as e:
            print(f"Error during generative debiasing: {e}")
            return text

# Singleton instance to avoid reloading the model for every request
debiaser_instance = None

def get_debiaser() -> GenerativeDebiaser:
    global debiaser_instance
    if debiaser_instance is None:
        debiaser_instance = GenerativeDebiaser()
    return debiaser_instance
