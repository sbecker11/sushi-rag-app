"""
Shared constraint inference and filtering for RAG tools.
Kept separate from server.py for fast unit tests without MCP/LangChain imports.
"""

import re
from typing import Optional


def _infer_constraints(question: str) -> dict:
    q = question.lower()
    constraints = {"max_price": None, "min_price": None, "category": None, "spice": None}

    max_match = re.search(
        r"(?:under|below|less than|not over|at most)\s*\$?\s*(\d+(?:\.\d+)?)", q
    )
    if max_match:
        constraints["max_price"] = float(max_match.group(1))

    min_match = re.search(
        r"(?:over|above|at least|minimum|min)\s*\$?\s*(\d+(?:\.\d+)?)", q
    )
    if min_match:
        constraints["min_price"] = float(min_match.group(1))

    if "maki" in q:
        constraints["category"] = "rolls"
    elif "nigiri" in q:
        constraints["category"] = "nigiri"
    elif "appetizer" in q:
        constraints["category"] = "appetizers"
    elif "soup" in q:
        constraints["category"] = "soup"

    if "mild" in q or "not spicy" in q or "not too spicy" in q:
        constraints["spice"] = "mild"
    elif "spicy" in q or "hot" in q:
        constraints["spice"] = "spicy"

    return constraints


def _matches_category(category: str, constraint: Optional[str]) -> bool:
    """Align category filtering with backend ragService.matchesCategory."""
    c = (category or "").lower()
    if not constraint:
        return True
    if constraint == "rolls":
        return "roll" in c
    if constraint == "nigiri":
        return "nigiri" in c
    if constraint == "appetizers":
        return "appetizer" in c
    if constraint == "soup":
        return "soup" in c
    return c == constraint


def _apply_constraints_docs(docs_and_scores: list, constraints: dict) -> list:
    filtered = []
    for doc, score in docs_and_scores:
        meta = doc.metadata or {}
        price = float(meta.get("price", 0) or 0)
        category = str(meta.get("category", "")).lower()
        spice = int(meta.get("spiceLevel", 0) or 0)

        if constraints["max_price"] is not None and price > constraints["max_price"]:
            continue
        if constraints["min_price"] is not None and price < constraints["min_price"]:
            continue
        if constraints["category"] and not _matches_category(category, constraints["category"]):
            continue
        if constraints["spice"] == "mild" and spice > 1:
            continue
        if constraints["spice"] == "spicy" and spice < 1:
            continue
        filtered.append((doc, score))
    return filtered


def _has_constraints(constraints: dict) -> bool:
    return any(
        [
            constraints.get("max_price") is not None,
            constraints.get("min_price") is not None,
            constraints.get("category") is not None,
            constraints.get("spice") is not None,
        ]
    )
