from dataclasses import dataclass

@dataclass
class AprioriConfig:
    """Configuration for the Apriori algorithm."""
    
    min_support: float
    min_confidence: float