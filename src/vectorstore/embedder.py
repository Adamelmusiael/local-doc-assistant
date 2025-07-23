from sentence_transformers import SentenceTransformer
from typing import List

model = SentenceTransformer("BAAI/bge-m3")

def embed_text(text: str) -> List[float]:
    return model.encode(text, normalize_embeddings=True).tolist()
