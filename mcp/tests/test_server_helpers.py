"""Tests for server.py helpers that need the full module import."""

from types import SimpleNamespace

import pytest

# Import after path is set by pytest.ini pythonpath = .
import server as srv


def test_format_docs_joins_page_content():
    docs = [
        SimpleNamespace(page_content="a"),
        SimpleNamespace(page_content="b"),
    ]
    assert srv._format_docs(docs) == "a\n\nb"


def test_handle_error_openai_key():
    msg = srv._handle_error(Exception("Please set OPENAI_API_KEY"))
    assert "OPENAI_API_KEY" in msg


def test_handle_error_collection_missing():
    msg = srv._handle_error(Exception("Collection does not exist"))
    assert "ChromaDB collection not found" in msg
    assert srv.CHROMA_COLLECTION in msg


def test_handle_error_generic():
    msg = srv._handle_error(RuntimeError("boom"))
    assert "RuntimeError" in msg
    assert "boom" in msg


def test_format_sources_empty():
    assert srv._format_sources([], srv.ResponseFormat.MARKDOWN) == ""


def test_format_sources_json():
    doc = SimpleNamespace(page_content="hello", metadata={"name": "X"})
    out = srv._format_sources([doc], srv.ResponseFormat.JSON)
    data = __import__("json").loads(out)
    assert len(data) == 1
    assert data[0]["content"] == "hello"


def test_format_sources_markdown_truncates():
    long_text = "x" * 400
    doc = SimpleNamespace(page_content=long_text, metadata={"source": "S1"})
    out = srv._format_sources([doc], srv.ResponseFormat.MARKDOWN)
    assert "Sources retrieved" in out
    assert "S1" in out
    assert "…" in out
