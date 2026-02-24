"""Tests for causal_service — uses synthetic data, no network needed."""

import numpy as np
import pandas as pd
import pytest


def _make_synthetic_returns(n: int = 300, seed: int = 42) -> pd.DataFrame:
    """
    Create synthetic returns with known causal structure:
      A → B → C, and D is independent
    """
    rng = np.random.default_rng(seed)
    A = rng.normal(0, 0.01, n)
    B = 0.5 * A + rng.normal(0, 0.008, n)
    C = 0.4 * B + rng.normal(0, 0.008, n)
    D = rng.normal(0, 0.01, n)

    idx = pd.date_range("2022-01-01", periods=n, freq="B")
    return pd.DataFrame({"A": A, "B": B, "C": C, "D": D}, index=idx)


def test_run_causal_discovery_returns_structure():
    from app.services.causal_service import run_causal_discovery

    returns = _make_synthetic_returns()
    result = run_causal_discovery(returns)

    assert "adjacency_matrix" in result
    assert "tickers" in result
    assert "dag_edges" in result
    assert set(result["tickers"]) == {"A", "B", "C", "D"}
    assert isinstance(result["dag_edges"], list)


def test_compute_node_stats():
    from app.services.causal_service import _compute_node_stats

    returns = _make_synthetic_returns()
    stats = _compute_node_stats(returns)

    assert set(stats.keys()) == {"A", "B", "C", "D"}
    for ticker, s in stats.items():
        assert "avg_return" in s
        assert "volatility" in s
        assert s["volatility"] > 0


def test_format_for_frontend():
    from app.services.causal_service import (
        _compute_node_stats,
        compute_treatment_effects,
        format_for_frontend,
        run_causal_discovery,
    )

    returns = _make_synthetic_returns()
    dag = run_causal_discovery(returns)
    effects = compute_treatment_effects(returns, dag)
    stats = _compute_node_stats(returns)
    graph = format_for_frontend(dag, effects, stats)

    assert "nodes" in graph
    assert "edges" in graph
    assert len(graph["nodes"]) == 4

    for node in graph["nodes"]:
        assert "id" in node
        assert "centrality" in node
        assert 0.0 <= node["centrality"] <= 1.0


def test_run_full_causal_pipeline():
    from app.services.causal_service import run_full_causal_pipeline

    returns = _make_synthetic_returns()
    graph = run_full_causal_pipeline(returns)

    assert "nodes" in graph
    assert "edges" in graph
    assert "algorithm" in graph
