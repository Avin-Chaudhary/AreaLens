import re
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

NEGATIONS = {"not", "no", "never", "without"}

CUSTOM_STOPWORDS = ENGLISH_STOP_WORDS.difference(NEGATIONS)

class NewsTextPreprocessor(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        processed = []

        for text in X:
            if not isinstance(text, str):
                processed.append("")
                continue

            t = text.lower()

            t = re.sub(r"http\S+", "", t)

            t = re.sub(r"<money>|₹\s?\d+[\d,]*", "<MONEY>", t)
            t = re.sub(r"\b\d+[\d,]*\b", "<NUM>", t)
            t = re.sub(r"\b(today|yesterday|tomorrow|this week|this year)\b", "<TIME>", t)
            t = re.sub(r"<loc>", "<LOC>", t)

            t = re.sub(r"[^\w\s<>]", " ", t)

            tokens = t.split()

            tokens = [
                w for w in tokens
                if w not in CUSTOM_STOPWORDS and len(w) > 2
            ]

            processed.append(" ".join(tokens))

        return processed
