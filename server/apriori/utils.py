from collections.abc import Iterable
from itertools import combinations

import pandas as pd


def _support(transactions: pd.DataFrame, *items: str | tuple[str, ...]) -> float:
    """
    Return the fraction of transactions containing every requested item.
    
    Accepts:
        - transactions: pd.DataFrame with one-hot encoded items
        - items: one or more items (as strings or tuples of strings)
    """
    itemset = tuple(
        item
        for group in items
        for item in (group if isinstance(group, tuple) else (group,))
    )
    if not itemset:
        raise ValueError("At least one item is required")
    if transactions.empty or any(item not in transactions.columns for item in itemset):
        return 0.0
    return float(transactions.loc[:, list(itemset)].eq(1).all(axis=1).mean())


def _confidence(transactions: pd.DataFrame, itemsets: tuple[str, str]) -> float:
    """
    Return confidence of the rule X -> Y, where itemsets is (X, Y).
    
    Accepts: 
    - transactions: pd.DataFrame with one-hot encoded items
    - itemsets: tuple of (antecedent, consequent), where each is a string
    """
    antecedent, consequent = itemsets
    antecedent_support = _support(transactions, antecedent)
    if antecedent_support == 0:
        raise ValueError("Confidence is undefined when X has zero support")
    return _support(transactions, antecedent, consequent) / antecedent_support


def _check_next_round(
    transactions: pd.DataFrame,
    candidates: Iterable[str | tuple[str, ...]],
    min_support: float,
) -> tuple[list[tuple[str, ...]], list[tuple[str, ...]]]:
    """
    Keep frequent itemsets and form valid candidates for the next round.
    
    Accepts:
        - transactions: pd.DataFrame with one-hot encoded items
        - candidates: iterable of candidate itemsets (as strings or tuples of strings)
        - min_support: minimum support threshold (between 0 and 1)
    """
    if not 0 <= min_support <= 1:
        raise ValueError("min_support must be between 0 and 1")

    current = {
        tuple(sorted((candidate,) if isinstance(candidate, str) else candidate)) for candidate in candidates
    }
    if not current:
        return [], []

    sizes = {len(itemset) for itemset in current}
    if len(sizes) != 1 or 0 in sizes:
        raise ValueError("Candidates must be nonempty itemsets of the same size")

    frequent = sorted(
        itemset for itemset in current
        if _support(transactions, itemset) >= min_support
    )
    size = len(frequent[0]) if frequent else next(iter(sizes))
    frequent_set = set(frequent)
    next_candidates = set()
    for left, right in combinations(frequent, 2):
        joined = tuple(sorted(set(left) | set(right)))
        if len(joined) == size + 1 and all(
            subset in frequent_set for subset in combinations(joined, size)
        ):
            next_candidates.add(joined)

    return frequent, sorted(next_candidates)


def get_freq_itemsets(transactions: pd.DataFrame, min_support: float) -> list[tuple[str, ...]]:
    """
    Return a dictionary of frequent itemsets by round, where the keys are the round numbers
    
    Accepts:
        - transactions: pd.DataFrame with one-hot encoded items
        - min_support: minimum support threshold (between 0 and 1)
    """
    
    frequent_itemsets_by_round = {}
    round_number: int = 1
    candidates = transactions.columns.tolist()
    
    while len(candidates) > 0:
        frequent_itemsets, candidates = _check_next_round(
            transactions, candidates, min_support=min_support
        )
        frequent_itemsets_by_round[round_number] = frequent_itemsets
        round_number += 1
        
    return frequent_itemsets_by_round


def get_subsets(frequent_itemsets: dict, round: int | None = None):
    """
    Return a dictionary of subsets for a given round.
    
    Accepts:
        - frequent_itemsets: dictionary of frequent itemsets by round
        - round: the round number to get subsets for (if None, use the last round
    """

    from itertools import combinations
    
    if round is None:
        if not frequent_itemsets:
            raise ValueError("There are no frequent itemsets.")
        round = list(frequent_itemsets.keys())[-1]
    if round not in frequent_itemsets:
        raise ValueError(f"Round {round} does not exist.")
    subsets = {}
    for itemset in frequent_itemsets[round]:
        subsets[itemset] = [
            subset for size in range(1, len(itemset)) for subset in combinations(itemset, size)
        ]
    return subsets


def get_association_rules(transactions, subsets, min_confidence):
    """
    Return a list of association rules that meet the minimum confidence threshold.
    
    Accepts:
        - transactions: pd.DataFrame with one-hot encoded items
        - subsets: dictionary of subsets for a given round
        - min_confidence: minimum confidence threshold (between 0 and 1)    
    """
    
    if not 0 <= min_confidence <= 1:
        raise ValueError("min_confidence must be between 0 and 1")

    rules = []
    for itemset, antecedents in subsets.items():
        for antecedent in antecedents:
            consequent = tuple(item for item in itemset if item not in antecedent)
            confidence = _confidence(transactions, (antecedent, consequent))
            if confidence >= min_confidence:
                rules.append((antecedent, consequent, confidence))
    return rules


def display_rules(
    rules: list[tuple[tuple[str, ...], tuple[str, ...], float]],
) -> None:
    """Pretty-print association rules with their confidence scores."""

    for index, (antecedent, consequent, confidence) in enumerate(rules, start=1):
        lhs = ", ".join(antecedent)
        rhs = ", ".join(consequent)

        print(f"{index}. {{{lhs}}} → {{{rhs}}} | Confidence: {confidence:.2%}")