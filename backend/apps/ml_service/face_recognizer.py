"""
Face Recognition and Matching Service
"""

import numpy as np
from typing import List, Tuple, Optional
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)


class FaceRecognizer:
    """
    Face recognition service for matching face embeddings.
    
    Features:
    - Face embedding comparison
    - 1:1 verification (is this the same person?)
    - 1:N identification (who is this person?)
    - Similarity scoring
    """
    
    def __init__(self, similarity_threshold: float = 0.6):
        """
        Initialize face recognizer.
        
        Args:
            similarity_threshold: Minimum similarity score for a match (0-1)
        """
        self.similarity_threshold = similarity_threshold
        logger.info(f"Face recognizer initialized with threshold {similarity_threshold}")
    
    @staticmethod
    def compute_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Compute cosine similarity between two face embeddings.
        
        Args:
            embedding1: First face embedding (512-d vector)
            embedding2: Second face embedding (512-d vector)
            
        Returns:
            Similarity score between 0 and 1 (higher = more similar)
        """
        # Ensure embeddings are 2D for sklearn
        emb1 = np.array(embedding1).reshape(1, -1)
        emb2 = np.array(embedding2).reshape(1, -1)
        
        # Compute cosine similarity
        similarity = cosine_similarity(emb1, emb2)[0][0]
        
        # Convert from [-1, 1] to [0, 1] range
        normalized_similarity = (similarity + 1) / 2
        
        return float(normalized_similarity)
    
    def verify(self, embedding1: np.ndarray, embedding2: np.ndarray) -> Tuple[bool, float]:
        """
        Verify if two face embeddings belong to the same person (1:1 matching).
        
        Args:
            embedding1: First face embedding
            embedding2: Second face embedding
            
        Returns:
            Tuple of (is_match, similarity_score)
        """
        similarity = self.compute_similarity(embedding1, embedding2)
        is_match = similarity >= self.similarity_threshold
        
        logger.info(f"Verification result: match={is_match}, similarity={similarity:.4f}")
        return is_match, similarity
    
    def identify(
        self,
        query_embedding: np.ndarray,
        known_embeddings: List[np.ndarray],
        known_ids: List[str],
        return_top_k: int = 1
    ) -> List[Tuple[str, float]]:
        """
        Identify a person from a database of known faces (1:N matching).
        
        Args:
            query_embedding: Query face embedding to identify
            known_embeddings: List of known face embeddings
            known_ids: List of IDs corresponding to known_embeddings
            return_top_k: Number of top matches to return
            
        Returns:
            List of (id, similarity) tuples sorted by similarity (highest first)
        """
        if not known_embeddings:
            logger.warning("No known embeddings provided for identification")
            return []
        
        if len(known_embeddings) != len(known_ids):
            raise ValueError("known_embeddings and known_ids must have same length")
        
        # Compute similarities
        similarities = []
        for i, known_emb in enumerate(known_embeddings):
            similarity = self.compute_similarity(query_embedding, known_emb)
            similarities.append((known_ids[i], similarity))
        
        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Return top k matches above threshold
        matches = [(id_, score) for id_, score in similarities[:return_top_k]
                   if score >= self.similarity_threshold]
        
        if matches:
            logger.info(f"Identified {len(matches)} match(es). Best match: {matches[0][0]} "
                       f"(similarity={matches[0][1]:.4f})")
        else:
            logger.info("No matches found above threshold")
        
        return matches
    
    def find_best_match(
        self,
        query_embedding: np.ndarray,
        known_embeddings: List[np.ndarray],
        known_ids: List[str]
    ) -> Optional[Tuple[str, float]]:
        """
        Find the single best match for a query embedding.
        
        Args:
            query_embedding: Query face embedding
            known_embeddings: List of known face embeddings
            known_ids: List of IDs corresponding to known_embeddings
            
        Returns:
            Tuple of (id, similarity) for best match, or None if no match
        """
        matches = self.identify(query_embedding, known_embeddings, known_ids, return_top_k=1)
        
        if matches:
            return matches[0]
        return None
    
    def batch_verify(
        self,
        embeddings1: List[np.ndarray],
        embeddings2: List[np.ndarray]
    ) -> List[Tuple[bool, float]]:
        """
        Batch verification of multiple face pairs.
        
        Args:
            embeddings1: List of first embeddings
            embeddings2: List of second embeddings
            
        Returns:
            List of (is_match, similarity) tuples
        """
        if len(embeddings1) != len(embeddings2):
            raise ValueError("embeddings1 and embeddings2 must have same length")
        
        results = []
        for emb1, emb2 in zip(embeddings1, embeddings2):
            is_match, similarity = self.verify(emb1, emb2)
            results.append((is_match, similarity))
        
        return results
    
    @staticmethod
    def average_embeddings(embeddings: List[np.ndarray]) -> np.ndarray:
        """
        Compute average embedding from multiple face embeddings.
        Useful for creating a template from multiple photos of the same person.
        
        Args:
            embeddings: List of face embeddings
            
        Returns:
            Average embedding (L2 normalized)
        """
        if not embeddings:
            raise ValueError("Cannot average empty list of embeddings")
        
        # Stack and compute mean
        embeddings_array = np.array(embeddings)
        avg_embedding = np.mean(embeddings_array, axis=0)
        
        # L2 normalize
        norm = np.linalg.norm(avg_embedding)
        if norm > 0:
            avg_embedding = avg_embedding / norm
        
        return avg_embedding
    
    def update_threshold(self, new_threshold: float):
        """
        Update similarity threshold.
        
        Args:
            new_threshold: New threshold value (0-1)
        """
        if not 0 <= new_threshold <= 1:
            raise ValueError("Threshold must be between 0 and 1")
        
        old_threshold = self.similarity_threshold
        self.similarity_threshold = new_threshold
        logger.info(f"Updated similarity threshold: {old_threshold} -> {new_threshold}")


# Global recognizer instance (singleton)
_recognizer_instance: Optional[FaceRecognizer] = None


def get_face_recognizer(similarity_threshold: float = 0.6) -> FaceRecognizer:
    """
    Get global face recognizer instance (singleton pattern).
    
    Args:
        similarity_threshold: Similarity threshold (only used on first call)
        
    Returns:
        FaceRecognizer instance
    """
    global _recognizer_instance
    
    if _recognizer_instance is None:
        _recognizer_instance = FaceRecognizer(similarity_threshold)
    
    return _recognizer_instance
