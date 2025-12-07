"""
Streamlit UI for the Genie Space Analyzer.

Provides a visual interface for analyzing Genie Spaces against best practices.
"""

import os
import sys

# Add parent directory to path to import agent_server modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import streamlit as st
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="../.env.local", override=True)
load_dotenv(dotenv_path="../.env")

from agent_server.agent import GenieSpaceAnalyzer, save_analysis_output
from agent_server.models import AgentInput, AgentOutput, Finding, SectionAnalysis

# Page configuration
st.set_page_config(
    page_title="Genie Space Analyzer",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Custom CSS for styling
st.markdown(
    """
<style>
    /* Main container styling */
    .main .block-container {
        max-width: 1200px;
        padding-top: 2rem;
    }
    
    /* Header styling */
    .header-title {
        font-family: 'DM Sans', sans-serif;
        font-size: 2.5rem;
        font-weight: 700;
        color: #1B3139;
        margin-bottom: 0.5rem;
    }
    
    .header-subtitle {
        font-family: 'DM Sans', sans-serif;
        font-size: 1.1rem;
        color: #5A6872;
        margin-bottom: 2rem;
    }
    
    /* Score card styling */
    .score-card {
        background: linear-gradient(135deg, #FF3621 0%, #FF6B4A 100%);
        border-radius: 16px;
        padding: 2rem;
        color: white;
        text-align: center;
        box-shadow: 0 4px 20px rgba(255, 54, 33, 0.3);
    }
    
    .score-card.good {
        background: linear-gradient(135deg, #00A972 0%, #00C389 100%);
        box-shadow: 0 4px 20px rgba(0, 169, 114, 0.3);
    }
    
    .score-card.medium {
        background: linear-gradient(135deg, #FF9800 0%, #FFB74D 100%);
        box-shadow: 0 4px 20px rgba(255, 152, 0, 0.3);
    }
    
    .score-value {
        font-size: 4rem;
        font-weight: 800;
        line-height: 1;
    }
    
    .score-label {
        font-size: 1rem;
        opacity: 0.9;
        margin-top: 0.5rem;
    }
    
    /* Severity badges */
    .severity-high {
        background-color: #FFEBEE;
        color: #C62828;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        display: inline-block;
        margin-right: 0.5rem;
    }
    
    .severity-medium {
        background-color: #FFF3E0;
        color: #E65100;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        display: inline-block;
        margin-right: 0.5rem;
    }
    
    .severity-low {
        background-color: #E3F2FD;
        color: #1565C0;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        display: inline-block;
        margin-right: 0.5rem;
    }
    
    /* Section card */
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .section-score {
        font-weight: 700;
        font-size: 1.1rem;
    }
    
    /* Finding card */
    .finding-card {
        background-color: #F8F9FA;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 0.75rem;
        border-left: 4px solid #E0E0E0;
    }
    
    .finding-card.high {
        border-left-color: #C62828;
    }
    
    .finding-card.medium {
        border-left-color: #E65100;
    }
    
    .finding-card.low {
        border-left-color: #1565C0;
    }
    
    /* Input styling */
    .stTextInput > div > div > input {
        font-size: 1rem;
        padding: 0.75rem 1rem;
    }
    
    /* Button styling */
    .stButton > button {
        background: linear-gradient(135deg, #FF3621 0%, #FF6B4A 100%);
        color: white;
        border: none;
        padding: 0.75rem 2rem;
        font-weight: 600;
        font-size: 1rem;
        border-radius: 8px;
        transition: all 0.2s ease;
    }
    
    .stButton > button:hover {
        box-shadow: 0 4px 12px rgba(255, 54, 33, 0.4);
        transform: translateY(-1px);
    }
</style>
""",
    unsafe_allow_html=True,
)


def get_score_class(score: int) -> str:
    """Get CSS class based on score."""
    if score >= 80:
        return "good"
    elif score >= 60:
        return "medium"
    return ""


def get_severity_badge(severity: str) -> str:
    """Get HTML for severity badge."""
    return f'<span class="severity-{severity}">{severity.upper()}</span>'


def display_finding(finding: Finding):
    """Display a single finding."""
    severity_colors = {
        "high": "🔴",
        "medium": "🟠",
        "low": "🔵",
    }
    icon = severity_colors.get(finding.severity, "⚪")

    with st.container():
        st.markdown(
            f"""
            <div class="finding-card {finding.severity}">
                <div style="margin-bottom: 0.5rem;">
                    {get_severity_badge(finding.severity)}
                    <span style="color: #666; font-size: 0.85rem;">{finding.category}</span>
                </div>
                <div style="font-weight: 500; margin-bottom: 0.5rem;">{finding.description}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        with st.expander("💡 Recommendation"):
            st.markdown(finding.recommendation)
            if finding.reference:
                st.caption(f"📖 Reference: {finding.reference}")


def display_section_analysis(analysis: SectionAnalysis):
    """Display analysis for a single section."""
    # Format section name for display
    section_display = analysis.section_name.replace("_", " ").replace(".", " → ").title()

    # Determine score color
    if analysis.score >= 80:
        score_color = "#00A972"
    elif analysis.score >= 60:
        score_color = "#FF9800"
    else:
        score_color = "#C62828"

    finding_count = len(analysis.findings)
    finding_text = f"{finding_count} finding{'s' if finding_count != 1 else ''}"

    with st.expander(
        f"**{section_display}** — Score: {analysis.score}/100 ({finding_text})",
        expanded=analysis.score < 70,
    ):
        # Summary
        if analysis.summary:
            st.info(analysis.summary)

        # Findings
        if analysis.findings:
            # Sort by severity
            severity_order = {"high": 0, "medium": 1, "low": 2}
            sorted_findings = sorted(
                analysis.findings, key=lambda f: severity_order.get(f.severity, 3)
            )

            for finding in sorted_findings:
                display_finding(finding)
        else:
            st.success("✅ No issues found in this section!")


def display_results(output: AgentOutput):
    """Display the full analysis results."""
    # Overall Score
    st.markdown("---")

    col1, col2, col3 = st.columns([1, 2, 1])

    with col2:
        score_class = get_score_class(output.overall_score)
        st.markdown(
            f"""
            <div class="score-card {score_class}">
                <div class="score-value">{output.overall_score}</div>
                <div class="score-label">Overall Compliance Score</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # Summary statistics
    total_findings = sum(len(a.findings) for a in output.analyses)
    high_count = sum(
        1 for a in output.analyses for f in a.findings if f.severity == "high"
    )
    medium_count = sum(
        1 for a in output.analyses for f in a.findings if f.severity == "medium"
    )
    low_count = sum(
        1 for a in output.analyses for f in a.findings if f.severity == "low"
    )

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Findings", total_findings)
    with col2:
        st.metric("🔴 High", high_count)
    with col3:
        st.metric("🟠 Medium", medium_count)
    with col4:
        st.metric("🔵 Low", low_count)

    st.markdown("---")

    # Section analyses
    st.subheader("📊 Section Analysis")

    for analysis in output.analyses:
        display_section_analysis(analysis)

    # Trace link
    if output.trace_id:
        st.markdown("---")
        st.caption(f"🔗 MLflow Trace ID: `{output.trace_id}`")


def run_analysis(genie_space_id: str) -> AgentOutput | None:
    """Run the analysis with progress updates."""
    try:
        analyzer = GenieSpaceAnalyzer()
        input_obj = AgentInput(genie_space_id=genie_space_id)

        # Create progress containers
        progress_bar = st.progress(0)
        status_text = st.empty()

        # Run streaming analysis
        gen = analyzer.predict_streaming(input_obj)
        result = None

        try:
            while True:
                progress = next(gen)

                if progress["status"] == "fetching":
                    status_text.text("📥 " + progress["message"])
                    progress_bar.progress(5)
                elif progress["status"] == "analyzing":
                    current = progress.get("current", 0)
                    total = progress.get("total", 1)
                    pct = int(5 + (current / total) * 90)
                    status_text.text(f"🔍 {progress['message']} ({current}/{total})")
                    progress_bar.progress(pct)
                elif progress["status"] == "complete":
                    status_text.text("✅ " + progress["message"])
                    progress_bar.progress(100)

        except StopIteration as e:
            result = e.value

        # Clear progress indicators after a moment
        progress_bar.empty()
        status_text.empty()

        if result:
            save_analysis_output(result)
            return result

    except Exception as e:
        st.error(f"❌ Analysis failed: {str(e)}")
        return None


def main():
    """Main app entry point."""
    # Header
    st.markdown(
        '<div class="header-title">🔍 Genie Space Analyzer</div>',
        unsafe_allow_html=True,
    )
    st.markdown(
        '<div class="header-subtitle">Analyze your Databricks Genie Space configuration against best practices</div>',
        unsafe_allow_html=True,
    )

    # Check for required environment variables
    missing_vars = []
    if not os.environ.get("DATABRICKS_HOST"):
        missing_vars.append("DATABRICKS_HOST")
    if not os.environ.get("DATABRICKS_TOKEN"):
        missing_vars.append("DATABRICKS_TOKEN")

    if missing_vars:
        st.warning(
            f"⚠️ Missing environment variables: {', '.join(missing_vars)}. "
            "Please set these in your `.env.local` or `.env` file."
        )

    # Input section
    col1, col2 = st.columns([3, 1])

    with col1:
        genie_space_id = st.text_input(
            "Genie Space ID",
            placeholder="Enter your Genie Space ID (e.g., 01f0627099691651968d0a92a26b06e9)",
            help="The unique identifier for your Databricks Genie Space",
        )

    with col2:
        st.markdown("<br>", unsafe_allow_html=True)
        analyze_button = st.button("🚀 Analyze", type="primary", use_container_width=True)

    # Run analysis
    if analyze_button:
        if not genie_space_id:
            st.warning("Please enter a Genie Space ID")
        elif missing_vars:
            st.error("Cannot run analysis without required environment variables")
        else:
            with st.spinner("Initializing analyzer..."):
                result = run_analysis(genie_space_id)

            if result:
                st.session_state["last_result"] = result

    # Display results from session state
    if "last_result" in st.session_state:
        display_results(st.session_state["last_result"])


if __name__ == "__main__":
    main()

