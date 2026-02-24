"""
AI Agent Service — multi-agent portfolio analysis using LangGraph + Groq.

Architecture (LangGraph StateGraph):
  1. PortfolioAnalystAgent  — interprets causal graph, identifies key drivers
  2. RiskAgent              — assesses portfolio risk from backtest metrics
  3. SynthesizerAgent       — combines outputs into a cohesive narrative

LLM: Groq Llama-3.3-70b-versatile (free tier, no credit card required)
     → console.groq.com — 6,000 tokens/min, 500 req/day

Falls back to deterministic rule-based insights if no GROQ_API_KEY is set.
"""

import logging
import os
from typing import Annotated, Optional, TypedDict

logger = logging.getLogger(__name__)


# ── Rule-based fallback (no LLM required) ────────────────────────────────────

def _rule_based_insights(
    causal_graph: dict,
    backtest_metrics: dict,
    sentiment: dict,
) -> dict:
    """Generate structured insights without an LLM."""
    nodes = causal_graph.get("nodes", [])
    edges = causal_graph.get("edges", [])
    metrics = backtest_metrics

    findings = []

    # Identify causal driver (highest out-degree / centrality)
    if nodes:
        top_node = max(nodes, key=lambda n: n.get("centrality", 0))
        findings.append(
            f"{top_node['label']} is the most central asset in the causal network "
            f"(centrality score: {top_node['centrality']:.2f}), suggesting it drives "
            "returns in other portfolio assets."
        )

    # Causal edge insights
    if edges:
        strongest = max(edges, key=lambda e: e.get("weight", 0))
        findings.append(
            f"Strongest causal link: {strongest['source']} → {strongest['target']} "
            f"(effect size: {strongest['weight']:.4f}, direction: {strongest['direction']})"
        )
    else:
        findings.append(
            "No statistically significant causal links detected between portfolio assets. "
            "Assets appear to move independently — good for diversification."
        )

    # Backtest performance insight
    sharpe = metrics.get("sharpe_ratio", 0)
    mdd = metrics.get("max_drawdown", 0)
    alpha = metrics.get("alpha", 0)

    if sharpe > 1.5:
        findings.append(f"Strong risk-adjusted performance (Sharpe: {sharpe:.2f}) — well above the 1.0 threshold.")
    elif sharpe > 1.0:
        findings.append(f"Solid risk-adjusted performance (Sharpe: {sharpe:.2f}).")
    else:
        findings.append(f"Below-average risk-adjusted returns (Sharpe: {sharpe:.2f}) — consider rebalancing.")

    if alpha > 0:
        findings.append(f"Portfolio generates positive alpha ({alpha:.2f}%) relative to the benchmark.")

    # Risk assessment
    if mdd < -30:
        risk_level = "high"
        risk_text = f"High risk: Maximum drawdown of {mdd:.1f}% indicates significant tail risk."
    elif mdd < -15:
        risk_level = "medium"
        risk_text = f"Moderate risk: Maximum drawdown of {mdd:.1f}% is within acceptable range."
    else:
        risk_level = "low"
        risk_text = f"Low risk: Maximum drawdown of {mdd:.1f}% shows strong capital preservation."

    # Sentiment signals
    signals = []
    if sentiment:
        ticker_sent = sentiment.get("ticker_sentiment", {})
        positive = [t for t, s in ticker_sent.items() if s.get("overall_label") == "positive"]
        negative = [t for t, s in ticker_sent.items() if s.get("overall_label") == "negative"]
        if positive:
            signals.append(f"Positive sentiment: {', '.join(positive)}")
        if negative:
            signals.append(f"Negative sentiment: {', '.join(negative)} — monitor closely")

    narrative = (
        f"This portfolio analysis reveals a {'connected' if edges else 'decoupled'} causal structure "
        f"among the {len(nodes)} assets. "
        f"{'The causal network suggests information flows from ' + edges[0]['source'] + ' to other assets. ' if edges else ''}"
        f"Backtesting over the selected period shows a Sharpe ratio of {sharpe:.2f} with a maximum drawdown of {mdd:.1f}%. "
        f"{risk_text} "
        f"{'Positive market sentiment supports the current positioning.' if len(positive if sentiment else []) > len(negative if sentiment else []) else ''}"
    )

    return {
        "key_findings": findings,
        "risk_assessment": risk_text,
        "risk_level": risk_level,
        "trade_signals": signals,
        "agent_narrative": narrative,
        "model_used": "Rule-based (no API key)",
        "note": "Set GROQ_API_KEY for AI-powered insights with Llama-3.3-70b.",
    }


# ── LangGraph + Groq agent ────────────────────────────────────────────────────

class AgentState(TypedDict):
    causal_graph: dict
    backtest_metrics: dict
    sentiment: dict
    analyst_output: str
    risk_output: str
    final_insights: dict


def _build_agent_graph():
    """Build the LangGraph state machine (lazy import to avoid startup cost)."""
    try:
        from langchain_groq import ChatGroq
        from langgraph.graph import END, StateGraph
    except ImportError:
        return None

    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return None

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=api_key,
        temperature=0.3,
        max_tokens=1024,
    )

    def portfolio_analyst(state: AgentState) -> AgentState:
        graph = state["causal_graph"]
        edges = graph.get("edges", [])
        nodes = graph.get("nodes", [])

        edge_summary = (
            "\n".join(
                f"  {e['source']} → {e['target']} (effect: {e['weight']:.4f}, {e['direction']})"
                for e in edges[:10]
            )
            or "  No directed causal edges found."
        )
        node_summary = ", ".join(
            f"{n['id']} (centrality={n['centrality']:.2f})" for n in nodes
        )

        prompt = f"""You are a quantitative portfolio analyst specialising in causal inference.

Portfolio assets: {node_summary}
Causal edges discovered:
{edge_summary}

In 3-4 concise sentences, explain:
1. Which asset drives the portfolio and why
2. What the causal structure means for investors
3. One actionable portfolio insight from the causal graph

Be specific and avoid generic advice."""

        response = llm.invoke(prompt)
        state["analyst_output"] = response.content
        return state

    def risk_agent(state: AgentState) -> AgentState:
        m = state["backtest_metrics"]
        sent = state["sentiment"].get("ticker_sentiment", {})
        sent_summary = ", ".join(
            f"{t}: {s.get('overall_label','neutral')} ({s.get('overall_score',0):.2f})"
            for t, s in sent.items()
        )

        prompt = f"""You are a portfolio risk manager.

Backtest metrics:
- Annual Return: {m.get('annual_return', 0):.2f}%
- Sharpe Ratio: {m.get('sharpe_ratio', 0):.2f}
- Max Drawdown: {m.get('max_drawdown', 0):.2f}%
- Sortino Ratio: {m.get('sortino_ratio', 0):.2f}
- Calmar Ratio: {m.get('calmar_ratio', 0):.2f}
- Alpha vs benchmark: {m.get('alpha', 0):.2f}%
- Beta: {m.get('beta', 0):.2f}
- Win Rate: {m.get('win_rate', 0):.2f}%

Current sentiment: {sent_summary or 'No sentiment data'}

In 2-3 sentences:
1. Assess risk level (low/medium/high) and why
2. Identify the main risk factor for this portfolio
3. One concrete risk mitigation suggestion"""

        response = llm.invoke(prompt)
        state["risk_output"] = response.content
        return state

    def synthesizer(state: AgentState) -> AgentState:
        m = state["backtest_metrics"]
        mdd = m.get("max_drawdown", 0)
        sharpe = m.get("sharpe_ratio", 0)

        risk_level = "high" if mdd < -30 else ("medium" if mdd < -15 else "low")

        # Parse agent outputs into structured insights
        analyst_text = state.get("analyst_output", "")
        risk_text = state.get("risk_output", "")

        # Extract key sentences as findings
        analyst_sentences = [s.strip() for s in analyst_text.split(".") if len(s.strip()) > 20][:3]
        risk_sentences = [s.strip() for s in risk_text.split(".") if len(s.strip()) > 20][:2]
        findings = analyst_sentences + risk_sentences

        # Trade signals from sentiment
        sent = state["sentiment"].get("ticker_sentiment", {})
        signals = []
        for ticker, s in sent.items():
            label = s.get("overall_label", "neutral")
            score = s.get("overall_score", 0)
            if label == "positive" and score > 0.1:
                signals.append(f"Consider increasing {ticker} allocation (positive sentiment: {score:.2f})")
            elif label == "negative" and score < -0.1:
                signals.append(f"Monitor {ticker} — negative news flow (sentiment: {score:.2f})")

        narrative = f"{analyst_text}\n\nRisk Assessment: {risk_text}"

        state["final_insights"] = {
            "key_findings": [f"{s}." for s in findings if s],
            "risk_assessment": risk_text[:300] if risk_text else "No risk data",
            "risk_level": risk_level,
            "trade_signals": signals,
            "agent_narrative": narrative,
            "model_used": "llama-3.3-70b-versatile (Groq)",
            "note": "",
        }
        return state

    graph = StateGraph(AgentState)
    graph.add_node("analyst", portfolio_analyst)
    graph.add_node("risk", risk_agent)
    graph.add_node("synthesizer", synthesizer)

    graph.set_entry_point("analyst")
    graph.add_edge("analyst", "risk")
    graph.add_edge("risk", "synthesizer")
    graph.add_edge("synthesizer", END)

    return graph.compile()


async def generate_insights(
    causal_graph: dict,
    backtest_metrics: dict,
    sentiment: dict,
    groq_api_key: Optional[str] = None,
) -> dict:
    """
    Generate AI-powered portfolio insights.

    Uses Groq LangGraph agents if GROQ_API_KEY is available,
    otherwise falls back to deterministic rule-based insights.
    """
    if groq_api_key:
        os.environ["GROQ_API_KEY"] = groq_api_key

    api_key = os.getenv("GROQ_API_KEY", "")

    if not api_key:
        logger.info("No GROQ_API_KEY — using rule-based insights fallback")
        return _rule_based_insights(causal_graph, backtest_metrics, sentiment)

    try:
        import asyncio
        agent_graph = _build_agent_graph()

        if agent_graph is None:
            return _rule_based_insights(causal_graph, backtest_metrics, sentiment)

        initial_state = AgentState(
            causal_graph=causal_graph,
            backtest_metrics=backtest_metrics,
            sentiment=sentiment,
            analyst_output="",
            risk_output="",
            final_insights={},
        )

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, agent_graph.invoke, initial_state)
        insights = result.get("final_insights", {})

        if not insights:
            return _rule_based_insights(causal_graph, backtest_metrics, sentiment)

        return insights

    except Exception as e:
        logger.error(f"Agent pipeline failed: {e}. Falling back to rule-based insights.")
        return _rule_based_insights(causal_graph, backtest_metrics, sentiment)
