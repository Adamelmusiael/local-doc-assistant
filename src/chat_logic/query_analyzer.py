"""
Query Analysis Module for Dynamic Chunk Selection

This module analyzes incoming queries to determine their complexity and 
optimal context requirements for RAG pipeline.
"""

import re
from typing import Dict, List
import os

try:
    from config.config_loader import load_config
    config = load_config()
except ImportError:
    config = {}


def analyze_query_complexity(query: str) -> Dict:
    """
    Analyze query to determine optimal chunk count and search strategy
    
    Args:
        query (str): User's question/query
        
    Returns:
        dict: Analysis results including complexity level, recommended chunks, query type, and scope
    """
    query_lower = query.lower().strip()
    word_count = len(query.split())
    
    query_type = classify_query_type(query_lower)
    
    scope = determine_query_scope(query_lower)
    
    complexity_level = calculate_complexity_level(query_lower, word_count, query_type, scope)
    
    recommended_chunks = get_recommended_chunk_count(complexity_level, query_type, scope)
    
    return {
        "complexity_level": complexity_level,
        "recommended_chunks": recommended_chunks,
        "query_type": query_type,
        "scope": scope,
        "word_count": word_count
    }


def classify_query_type(query: str) -> str:
    """
    Classify the type of query based on keywords and patterns
    
    Returns:
        str: "fact", "analysis", "summary", "comparison", "process"
    """
    summary_patterns = [
        r'\b(summarize|summary|overview|all|complete|entire|main)\b',
        r'\bwhat (is|are) (all|the main|the key)\b',
        r'\bgive me (an overview|a summary)\b'
    ]
    
    analysis_patterns = [
        r'\b(analyze|analysis|evaluate|assessment|compare|comparison)\b',
        r'\b(strengths?|weaknesses?|pros?|cons?|advantages?|disadvantages?)\b',
        r'\b(why|how does|what makes|what are the benefits)\b'
    ]
    
    process_patterns = [
        r'\b(how (do|does)|process|procedure|methodology|steps?|approach)\b',
        r'\b(implement|setup|configure|install|deploy)\b',
        r'\bwhat is the (process|procedure|way)\b'
    ]
    
    comparison_patterns = [
        r'\b(compare|comparison|versus|vs|difference|differences)\b',
        r'\b(better|best|worse|worst|prefer|choice)\b',
        r'\bwhich (is|are|should)\b'
    ]
    
    for pattern in summary_patterns:
        if re.search(pattern, query):
            return "summary"
    
    for pattern in analysis_patterns:
        if re.search(pattern, query):
            return "analysis"
    
    for pattern in process_patterns:
        if re.search(pattern, query):
            return "process"
    
    for pattern in comparison_patterns:
        if re.search(pattern, query):
            return "comparison"
    
    # Default to fact-based query
    return "fact"


def determine_query_scope(query: str) -> str:
    """
    Determine the scope of the query (specific, broad, overview)
    
    Returns:
        str: "specific", "broad", "overview"
    """
    overview_keywords = [
        "overview", "summary", "all", "complete", "entire", "main", "key", 
        "overall", "general", "total", "comprehensive"
    ]
    
    broad_keywords = [
        "services", "features", "capabilities", "offerings", "products",
        "team", "members", "staff", "requirements", "specifications"
    ]
    
    specific_patterns = [
        r'\b(what is the|who is|when|where|which)\b',
        r'\b(price|cost|email|phone|address|contact)\b',
        r'\b\d+\b',  # Contains numbers
        r'\b[A-Z][a-zA-Z]+ [A-Z][a-zA-Z]+\b'  # proper names
    ]
    
    for keyword in overview_keywords:
        if keyword in query:
            return "overview"
    
    for pattern in specific_patterns:
        if re.search(pattern, query):
            return "specific"
    
    for keyword in broad_keywords:
        if keyword in query:
            return "broad"
    
    return "broad"


def calculate_complexity_level(query: str, word_count: int, query_type: str, scope: str) -> str:
    """
    Calculate overall complexity level based on multiple factors
    
    Returns:
        str: "simple", "medium", "complex", "comprehensive"
    """
    complexity_score = 0
    
    type_scores = {
        "fact": 1,
        "process": 2,
        "comparison": 3,
        "analysis": 4,
        "summary": 4
    }
    complexity_score += type_scores.get(query_type, 2)
    
    scope_scores = {
        "specific": 1,
        "broad": 2,
        "overview": 3
    }
    complexity_score += scope_scores.get(scope, 2)
    
    if word_count <= 5:
        complexity_score += 1
    elif word_count <= 10:
        complexity_score += 2
    elif word_count <= 20:
        complexity_score += 3
    else:
        complexity_score += 4
    
    if complexity_score <= 3:
        return "simple"
    elif complexity_score <= 5:
        return "medium"
    elif complexity_score <= 7:
        return "complex"
    else:
        return "comprehensive"


def get_recommended_chunk_count(complexity_level: str, query_type: str, scope: str) -> int:
    """
    Get recommended chunk count based on complexity analysis
    
    Returns:
        int: Recommended number of chunks to retrieve
    """
    base_chunks = {
        "simple": int(config.get("SIMPLE_QUERY_CHUNKS", "5")),
        "medium": int(config.get("MEDIUM_QUERY_CHUNKS", "10")),
        "complex": int(config.get("COMPLEX_QUERY_CHUNKS", "15")),
        "comprehensive": int(config.get("COMPREHENSIVE_QUERY_CHUNKS", "25"))
    }
    
    chunk_count = base_chunks.get(complexity_level, 10)
    
    # adjust based on query type
    if query_type == "summary":
        chunk_count += 5  
    elif query_type == "fact" and scope == "specific":
        chunk_count = max(3, chunk_count - 2)  
    elif query_type == "analysis":
        chunk_count += 3  
    
    min_chunks = int(config.get("MIN_CHUNKS", "3"))
    max_chunks = int(config.get("MAX_CHUNKS", "25"))
    
    return max(min_chunks, min(max_chunks, chunk_count))


def calculate_optimal_chunks(query_analysis: Dict, available_documents: int = None) -> int:
    """
    Calculate optimal chunk count considering available documents
    
    Args:
        query_analysis (dict): Result from analyze_query_complexity
        available_documents (int): Number of available documents (optional)
        
    Returns:
        int: Final optimal chunk count
    """
    base_chunks = query_analysis["recommended_chunks"]
    
    if available_documents is not None:
        if available_documents == 0:
            return 0
        elif available_documents == 1:
            if query_analysis["complexity_level"] in ["complex", "comprehensive"]:
                base_chunks = min(base_chunks + 5, int(config.get("MAX_CHUNKS", "25")))
        elif available_documents <= 3:
            # few documents -> normal chunk count
            pass
        else:
            # many documents -> might need slightly more for better coverage
            if query_analysis["complexity_level"] in ["comprehensive"]:
                base_chunks = min(base_chunks + 3, int(config.get("MAX_CHUNKS", "25")))
    
    return base_chunks

