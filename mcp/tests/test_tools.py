"""Async tool tests with mocked Chroma / vectorstore (no real DB)."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

import server as srv


def _doc(meta: dict, page_content: str = "content") -> SimpleNamespace:
    return SimpleNamespace(metadata=meta, page_content=page_content)


def _make_ctx(llm=None):
    ctx = MagicMock()
    ctx.report_progress = AsyncMock()
    ctx.info = MagicMock()
    ctx.error = MagicMock()
    ctx.request_context = MagicMock()
    ctx.request_context.lifespan_context = {"llm": llm or MagicMock()}
    return ctx


@pytest.mark.asyncio
async def test_sushi_rag_query_constrained_returns_sorted_list():
    """No LLM: constrained question -> deterministic markdown lines."""
    mock_vs = MagicMock()
    mock_vs.similarity_search_with_relevance_scores.return_value = [
        (_doc({"name": "B", "price": 9, "category": "Maki Rolls", "spiceLevel": 1}), 0.9),
        (_doc({"name": "A", "price": 7, "category": "Maki Rolls", "spiceLevel": 0}), 0.85),
        (_doc({"name": "Expensive", "price": 15, "category": "Maki Rolls", "spiceLevel": 0}), 0.8),
    ]

    params = srv.SushiQueryInput(question="mild maki under $10", k_docs=4, include_sources=False)

    with patch.object(srv, "_new_vectorstore", return_value=mock_vs):
        out = await srv.sushi_rag_query(params, _make_ctx())

    assert "Here are the matching menu items" in out
    assert "A" in out and "B" in out
    assert "Expensive" not in out
    # Sorted by price then name: A ($7) before B ($9)
    assert out.index("A") < out.index("B")


@pytest.mark.asyncio
async def test_sushi_rag_query_constrained_empty():
    mock_vs = MagicMock()
    mock_vs.similarity_search_with_relevance_scores.return_value = [
        (_doc({"name": "X", "price": 50, "category": "Maki Rolls", "spiceLevel": 0}), 0.9),
    ]
    params = srv.SushiQueryInput(question="under $5 maki", k_docs=4, include_sources=False)

    with patch.object(srv, "_new_vectorstore", return_value=mock_vs):
        out = await srv.sushi_rag_query(params, _make_ctx())

    assert "couldn't find items matching" in out.lower()


@pytest.mark.asyncio
async def test_sushi_rag_query_uses_handle_error_on_failure():
    with patch.object(srv, "_new_vectorstore", side_effect=ConnectionError("no chroma")):
        params = srv.SushiQueryInput(question="any question here ok", k_docs=4)
        ctx = _make_ctx()
        out = await srv.sushi_rag_query(params, ctx)

    ctx.error.assert_called_once()
    assert "Error" in out or "error" in out.lower()


@pytest.mark.asyncio
async def test_sushi_semantic_search_markdown():
    mock_vs = MagicMock()
    mock_vs.similarity_search_with_relevance_scores.return_value = [
        (_doc({"name": "Roll", "source": "menu"}, "tuna roll text"), 0.91),
    ]
    params = srv.SushiSearchInput(query="tuna", k=3, score_threshold=None, response_format=srv.ResponseFormat.MARKDOWN)

    with patch.object(srv, "_new_vectorstore", return_value=mock_vs):
        out = await srv.sushi_semantic_search(params, _make_ctx())

    assert "tuna" in out.lower()
    assert "0.91" in out or "score" in out.lower()


@pytest.mark.asyncio
async def test_sushi_semantic_search_score_threshold_filters():
    mock_vs = MagicMock()
    mock_vs.similarity_search_with_relevance_scores.return_value = [
        (_doc({}, "low"), 0.2),
        (_doc({}, "high"), 0.95),
    ]
    params = srv.SushiSearchInput(
        query="ab", k=5, score_threshold=0.5, response_format=srv.ResponseFormat.MARKDOWN
    )

    with patch.object(srv, "_new_vectorstore", return_value=mock_vs):
        out = await srv.sushi_semantic_search(params, _make_ctx())

    assert "high" in out
    assert "low" not in out


@pytest.mark.asyncio
async def test_sushi_semantic_search_no_results_message():
    mock_vs = MagicMock()
    mock_vs.similarity_search_with_relevance_scores.return_value = []
    params = srv.SushiSearchInput(query="zzz", k=5)

    with patch.object(srv, "_new_vectorstore", return_value=mock_vs):
        out = await srv.sushi_semantic_search(params, _make_ctx())

    assert "No results found" in out


@pytest.mark.asyncio
async def test_sushi_list_topics_dietary_and_categories():
    mock_vs = MagicMock()
    mock_col = MagicMock()
    mock_col.get.return_value = {
        "metadatas": [
            {"name": "California Roll", "category": "Rolls", "dietary": "pescatarian,gluten-free"},
            {"category": "Nigiri"},
        ]
    }
    mock_vs._collection = mock_col
    params = srv.ListTopicsInput(limit=50)

    with patch.object(srv, "_new_vectorstore", return_value=mock_vs):
        out = await srv.sushi_list_topics(params, _make_ctx())

    import json

    data = json.loads(out)
    topics = data["topics"]
    assert "California Roll" in topics or "Rolls" in topics
    assert any(t.startswith("dietary:") for t in topics)


@pytest.mark.asyncio
async def test_kb_stats_json():
    with patch.object(srv, "OpenAIEmbeddings", return_value=MagicMock()):
        with patch.object(srv.chromadb, "HttpClient", return_value=MagicMock()):
            with patch.object(srv, "Chroma") as mock_chroma_cls:
                inst = MagicMock()
                inst._collection.count.return_value = 42
                mock_chroma_cls.return_value = inst
                out = await srv.get_kb_stats()

    import json

    body = json.loads(out)
    assert body.get("document_chunks") == 42
