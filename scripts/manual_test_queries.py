"""
Manual Testing Queries for Dynamic Chunk Selection

This file contains 10 carefully crafted queries to test different complexity levels
and validate that the dynamic chunk selection is working correctly.

Expected Chunk Counts:
- Simple (3-5 chunks): Basic factual questions
- Medium (8-12 chunks): Process questions, feature lists
- Complex (15-18 chunks): Analysis, methodology explanations  
- Comprehensive (20-25 chunks): Full summaries, complete overviews
"""

TEST_QUERIES = [
    {
        "id": 1,
        "query": "What is the contact phone number?",
        "type": "Simple Fact",
        "expected_chunks": "3-5",
        "reasoning": "Direct factual question, specific information lookup",
        "complexity": "simple"
    },
    {
        "id": 2,
        "query": "Who is the contact person for this project?",
        "type": "Simple Fact", 
        "expected_chunks": "3-5",
        "reasoning": "Single piece of contact information",
        "complexity": "simple"
    },
    {
        "id": 3,
        "query": "What are the main features of the Azure infrastructure service?",
        "type": "Medium List",
        "expected_chunks": "8-12",
        "reasoning": "Requires gathering multiple feature points from different sections",
        "complexity": "medium"
    },
    {
        "id": 4,
        "query": "How do you implement monitoring and alerting systems?",
        "type": "Medium Process",
        "expected_chunks": "10-15",
        "reasoning": "Process explanation requiring multiple steps and details",
        "complexity": "medium-complex"
    },
    {
        "id": 5,
        "query": "What is the complete project timeline and delivery phases?",
        "type": "Medium Summary",
        "expected_chunks": "10-12",
        "reasoning": "Needs to gather timeline information from multiple sections",
        "complexity": "medium"
    },
    {
        "id": 6,
        "query": "Explain the complete Azure infrastructure implementation methodology and approach",
        "type": "Complex Analysis",
        "expected_chunks": "15-18",
        "reasoning": "Detailed explanation requiring comprehensive technical context",
        "complexity": "complex"
    },
    {
        "id": 7,
        "query": "Analyze all the technical requirements and specifications mentioned in the document",
        "type": "Complex Analysis",
        "expected_chunks": "15-20",
        "reasoning": "Analysis task requiring broad context from technical sections",
        "complexity": "complex"
    },
    {
        "id": 8,
        "query": "Compare the different service offerings and their technical capabilities",
        "type": "Complex Comparison",
        "expected_chunks": "15-18",
        "reasoning": "Comparison requires understanding multiple services in detail",
        "complexity": "complex"
    },
    {
        "id": 9,
        "query": "Provide a comprehensive summary of all services, features, and capabilities offered by the company",
        "type": "Comprehensive Summary",
        "expected_chunks": "20-25",
        "reasoning": "Complete overview requiring maximum context from entire document",
        "complexity": "comprehensive"
    },
    {
        "id": 10,
        "query": "Give me a complete overview of the entire project scope, methodology, technical requirements, timeline, and contact information",
        "type": "Comprehensive Overview",
        "expected_chunks": "20-25",
        "reasoning": "Most complex query requiring full document context across all sections",
        "complexity": "comprehensive"
    }
]

def print_test_queries():
    """Print all test queries in a formatted way for manual testing"""
    print("=" * 80)
    print("MANUAL TESTING QUERIES FOR DYNAMIC CHUNK SELECTION")
    print("=" * 80)
    print("\nInstructions:")
    print("1. Copy each query below into your chat interface")
    print("2. Check the 'chunks_used' in the response")
    print("3. Verify it matches the expected range")
    print("4. Note any significant deviations")
    print("\n" + "=" * 80)
    
    for query_data in TEST_QUERIES:
        print(f"\n🔍 TEST {query_data['id']}: {query_data['type']}")
        print(f"Expected Chunks: {query_data['expected_chunks']}")
        print(f"Complexity Level: {query_data['complexity']}")
        print(f"Query: \"{query_data['query']}\"")
        print(f"Reasoning: {query_data['reasoning']}")
        print("-" * 60)
    
    print(f"\n{'=' * 80}")
    print("VALIDATION CHECKLIST:")
    print("✓ Simple queries (1-2): Should use 3-5 chunks")
    print("✓ Medium queries (3-5): Should use 8-12 chunks") 
    print("✓ Complex queries (6-8): Should use 15-20 chunks")
    print("✓ Comprehensive queries (9-10): Should use 20-25 chunks")
    print("✓ Query analysis metadata should be present in all responses")
    print("✓ Model should provide relevant answers based on document content")

if __name__ == "__main__":
    print_test_queries()
