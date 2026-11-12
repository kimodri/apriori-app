"""Sample usage of the apriori module."""

from parser import parse_csv
from config import AprioriConfig
from utils import get_freq_itemsets, get_subsets, get_association_rules, display_rules

if __name__ == "__main__":
    
    datasets = parse_csv("../data/market_apriori_transactions.csv")
    config = AprioriConfig(min_support=0.5, min_confidence=0.7)
    
    freq_itemsets = get_freq_itemsets(datasets, config.min_support)
    
    subsets = get_subsets(freq_itemsets)
    
    rules = get_association_rules(datasets, subsets, config.min_confidence)
    
    display_rules(rules)