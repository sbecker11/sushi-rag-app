"""Unit tests for mcp/constraints.py — no LangChain or FastMCP imports."""

from types import SimpleNamespace

import pytest

from constraints import (
    _apply_constraints_docs,
    _has_constraints,
    _infer_constraints,
    _matches_category,
)


def _doc(metadata: dict, page_content: str = "x") -> SimpleNamespace:
    return SimpleNamespace(metadata=metadata, page_content=page_content)


class TestInferConstraints:
    def test_max_price_phrases(self):
        assert _infer_constraints("under $10")["max_price"] == 10.0
        assert _infer_constraints("below 12.5")["max_price"] == 12.5
        assert _infer_constraints("less than $8")["max_price"] == 8.0
        assert _infer_constraints("not over 15")["max_price"] == 15.0
        assert _infer_constraints("at most $20")["max_price"] == 20.0

    def test_min_price_phrases(self):
        assert _infer_constraints("over $5")["min_price"] == 5.0
        assert _infer_constraints("above 7")["min_price"] == 7.0
        assert _infer_constraints("at least $10")["min_price"] == 10.0
        assert _infer_constraints("minimum 12")["min_price"] == 12.0
        assert _infer_constraints("min $3")["min_price"] == 3.0

    def test_category_keywords(self):
        assert _infer_constraints("maki rolls")["category"] == "rolls"
        assert _infer_constraints("nigiri plate")["category"] == "nigiri"
        assert _infer_constraints("appetizer menu")["category"] == "appetizers"
        assert _infer_constraints("miso soup")["category"] == "soup"

    def test_spice(self):
        assert _infer_constraints("mild options")["spice"] == "mild"
        assert _infer_constraints("not spicy please")["spice"] == "mild"
        assert _infer_constraints("not too spicy")["spice"] == "mild"
        assert _infer_constraints("spicy tuna")["spice"] == "spicy"
        assert _infer_constraints("something hot")["spice"] == "spicy"

    def test_combined_mild_maki_under_10(self):
        c = _infer_constraints("Show me mild maki rolls under $10")
        assert c["max_price"] == 10.0
        assert c["category"] == "rolls"
        assert c["spice"] == "mild"


class TestHasConstraints:
    def test_empty(self):
        assert _has_constraints(
            {"max_price": None, "min_price": None, "category": None, "spice": None}
        ) is False

    def test_any_set(self):
        assert _has_constraints({"max_price": 10, "min_price": None, "category": None, "spice": None})
        assert _has_constraints({"max_price": None, "min_price": None, "category": "rolls", "spice": None})


class TestMatchesCategory:
    @pytest.mark.parametrize(
        "category,constraint,expected",
        [
            ("Maki Rolls", "rolls", True),
            ("Nigiri", "nigiri", True),
            ("Appetizers", "appetizers", True),
            ("Soup", "soup", True),
            ("Nigiri", "rolls", False),
            ("", "rolls", False),
            ("Rolls", None, True),
        ],
    )
    def test_cases(self, category, constraint, expected):
        assert _matches_category(category, constraint) is expected


class TestApplyConstraintsDocs:
    def test_price_and_mild(self):
        docs = [
            (_doc({"name": "A", "price": 8, "category": "Maki Rolls", "spiceLevel": 1}), 0.9),
            (_doc({"name": "B", "price": 12, "category": "Maki Rolls", "spiceLevel": 0}), 0.8),
            (_doc({"name": "C", "price": 8, "category": "Maki Rolls", "spiceLevel": 3}), 0.7),
        ]
        c = _infer_constraints("mild maki under $10")
        out = _apply_constraints_docs(docs, c)
        names = [d.metadata["name"] for d, _ in out]
        assert names == ["A"]

    def test_spicy_requires_spice_level(self):
        docs = [
            (_doc({"name": "Mild", "price": 5, "category": "Rolls", "spiceLevel": 0}), 0.9),
            (_doc({"name": "Hot", "price": 6, "category": "Rolls", "spiceLevel": 2}), 0.8),
        ]
        c = _infer_constraints("spicy rolls")
        out = _apply_constraints_docs(docs, c)
        assert [d.metadata["name"] for d, _ in out] == ["Hot"]
