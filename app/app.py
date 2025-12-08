"""
Streamlit UI for the Genie Space Analyzer.

Provides a multi-step wizard interface for analyzing Genie Spaces against best practices.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path to import agent_server modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import streamlit as st
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="../.env.local", override=True)
load_dotenv(dotenv_path="../.env")

from agent_server.agent import GenieSpaceAnalyzer, save_analysis_output, SECTIONS
from agent_server.ingest import get_serialized_space
from agent_server.models import AgentInput, AgentOutput, Finding, SectionAnalysis

# Page configuration
st.set_page_config(
    page_title="Genie Space Analyzer",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for styling
st.markdown(
    """
<style>
    /* Main container styling */
    .main .block-container {
        max-width: 100%;
        padding-top: 1rem;
        padding-left: 1rem;
        padding-right: 1rem;
    }
    
    /* Header styling */
    .header-title {
        font-family: 'DM Sans', sans-serif;
        font-size: 1.8rem;
        font-weight: 700;
        color: #1B3139;
        margin-bottom: 0.25rem;
    }
    
    .header-subtitle {
        font-family: 'DM Sans', sans-serif;
        font-size: 0.95rem;
        color: #5A6872;
        margin-bottom: 1rem;
    }
    
    /* Score card styling */
    .score-card {
        background: linear-gradient(135deg, #FF3621 0%, #FF6B4A 100%);
        border-radius: 16px;
        padding: 1.5rem;
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
        font-size: 3rem;
        font-weight: 800;
        line-height: 1;
    }
    
    .score-label {
        font-size: 0.9rem;
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
        padding: 0.5rem 1.5rem;
        font-weight: 600;
        font-size: 0.9rem;
        border-radius: 8px;
        transition: all 0.2s ease;
    }
    
    .stButton > button:hover {
        box-shadow: 0 4px 12px rgba(255, 54, 33, 0.4);
        transform: translateY(-1px);
    }
    
    /* Sidebar navigation styling */
    .nav-item {
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .nav-item.completed {
        background-color: #E8F5E9;
        color: #2E7D32;
    }
    
    .nav-item.current {
        background: linear-gradient(135deg, #FF3621 0%, #FF6B4A 100%);
        color: white;
    }
    
    .nav-item.pending {
        background-color: #F5F5F5;
        color: #9E9E9E;
    }
    
    /* Severity group headers */
    .severity-group-header {
        padding: 0.5rem 0;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
        border-bottom: 2px solid;
        font-weight: 600;
        font-size: 0.95rem;
    }
    
    .severity-group-header.high {
        color: #C62828;
        border-color: #C62828;
    }
    
    .severity-group-header.medium {
        color: #E65100;
        border-color: #E65100;
    }
    
    .severity-group-header.low {
        color: #1565C0;
        border-color: #1565C0;
    }
    
    /* Panel styling */
    .panel-header {
        font-weight: 600;
        font-size: 1rem;
        color: #1B3139;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #E0E0E0;
    }
    
    /* Sidebar section styling */
    section[data-testid="stSidebar"] {
        background-color: #FAFAFA;
    }
    
    section[data-testid="stSidebar"] .block-container {
        padding-top: 1rem;
    }
</style>
""",
    unsafe_allow_html=True,
)


# =============================================================================
# Session State Initialization
# =============================================================================


def init_session_state():
    """Initialize session state with default values."""
    defaults = {
        "phase": "input",  # input -> ingest -> analysis -> summary
        "genie_space_id": "",
        "space_data": None,
        "sections_with_data": [],
        "current_section_idx": 0,
        "section_analyses": [],
        "analyzer": None,
        "all_sections_analyzed": False,
        "show_best_practices": False,  # Toggle for best practices page
        "expanded_sections": {},  # Track which sections are expanded on summary page
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def reset_session():
    """Reset session state to initial values."""
    # End MLflow session if analyzer exists
    if st.session_state.analyzer:
        st.session_state.analyzer.end_session()

    st.session_state.phase = "input"
    st.session_state.genie_space_id = ""
    st.session_state.space_data = None
    st.session_state.sections_with_data = []
    st.session_state.current_section_idx = 0
    st.session_state.section_analyses = []
    st.session_state.all_sections_analyzed = False


# =============================================================================
# Helper Functions
# =============================================================================


def get_score_class(score: int) -> str:
    """Get CSS class based on score (0-10 scale)."""
    if score >= 8:
        return "good"
    elif score >= 6:
        return "medium"
    return ""


def get_severity_badge(severity: str) -> str:
    """Get HTML for severity badge."""
    return f'<span class="severity-{severity}">{severity.upper()}</span>'


def format_section_name(section_name: str) -> str:
    """Format section name for display."""
    return section_name.replace("_", " ").replace(".", " → ").title()


def get_short_section_name(section_name: str) -> str:
    """Get shortened section name for sidebar."""
    return section_name.split(".")[-1].replace("_", " ").title()


def get_analyzer() -> GenieSpaceAnalyzer:
    """Get or create the analyzer instance."""
    if st.session_state.analyzer is None:
        st.session_state.analyzer = GenieSpaceAnalyzer()
    return st.session_state.analyzer


def group_findings_by_severity(findings: list[Finding]) -> dict[str, list[Finding]]:
    """Group findings by severity level."""
    grouped = {"high": [], "medium": [], "low": []}
    for finding in findings:
        if finding.severity in grouped:
            grouped[finding.severity].append(finding)
    return grouped


def load_best_practices_content() -> str:
    """Load the best practices markdown content."""
    # Use absolute path resolution to handle different working directories
    docs_path = (
        Path(__file__).resolve().parent.parent / "docs" / "best-practices-by-schema.md"
    )
    return docs_path.read_text()


# =============================================================================
# Sidebar Navigation Component
# =============================================================================


def display_sidebar_nav():
    """Display the sidebar navigation."""
    phase = st.session_state.phase
    sections = st.session_state.sections_with_data
    current_idx = st.session_state.current_section_idx
    completed_analyses = len(st.session_state.section_analyses)
    all_done = st.session_state.all_sections_analyzed

    with st.sidebar:
        st.markdown("### 📍 Progress")
        st.markdown("---")

        # Only show nav if past input phase
        if phase == "input":
            st.caption("Enter a Genie Space ID to begin")
            return

        # Ingest step
        if phase == "ingest" and not st.session_state.show_best_practices:
            st.markdown(
                '<div class="nav-item current">📥 Ingest Preview</div>',
                unsafe_allow_html=True,
            )
        else:
            if st.button(
                "✓ Ingest Preview", key="nav_ingest", use_container_width=True
            ):
                st.session_state.phase = "ingest"
                st.session_state.show_best_practices = False
                st.rerun()

        st.markdown("---")
        st.markdown("**Sections**")

        # Section steps
        for i, (section_name, _) in enumerate(sections):
            short_name = get_short_section_name(section_name)

            if (
                phase == "analysis"
                and i == current_idx
                and not st.session_state.show_best_practices
            ):
                # Current section
                st.markdown(
                    f'<div class="nav-item current">🔍 {short_name}</div>',
                    unsafe_allow_html=True,
                )
            elif i < completed_analyses:
                # Completed section - clickable
                if st.button(
                    f"✓ {short_name}", key=f"nav_section_{i}", use_container_width=True
                ):
                    st.session_state.phase = "analysis"
                    st.session_state.current_section_idx = i
                    st.session_state.show_best_practices = False
                    st.rerun()
            else:
                # Pending section
                st.markdown(
                    f'<div class="nav-item pending">○ {short_name}</div>',
                    unsafe_allow_html=True,
                )

        st.markdown("---")

        # Summary step - clickable if all sections are analyzed
        if phase == "summary" and not st.session_state.show_best_practices:
            st.markdown(
                '<div class="nav-item current">📊 Summary</div>', unsafe_allow_html=True
            )
        elif all_done or completed_analyses == len(sections):
            # All sections analyzed - summary is clickable
            if st.button("📊 Summary", key="nav_summary", use_container_width=True):
                st.session_state.phase = "summary"
                st.session_state.show_best_practices = False
                st.rerun()
        else:
            st.markdown(
                '<div class="nav-item pending">○ Summary</div>', unsafe_allow_html=True
            )

        st.markdown("---")

        # Save Results button - only enabled on summary phase
        save_disabled = phase != "summary"
        if st.button(
            "💾 Save Results", use_container_width=True, disabled=save_disabled
        ):
            try:
                analyses = st.session_state.section_analyses
                genie_space_id = st.session_state.genie_space_id
                total_score = sum(a.score for a in analyses)
                overall_score = total_score // len(analyses) if analyses else 0

                output = AgentOutput(
                    genie_space_id=genie_space_id,
                    analyses=analyses,
                    overall_score=overall_score,
                    trace_id="",
                )
                filepath = save_analysis_output(output)
                st.success(f"✅ Saved to {filepath}")
            except Exception as e:
                st.error(f"❌ Failed to save: {str(e)}")

        st.markdown("---")

        # Best Practices button
        if st.button("📚 Best Practices", use_container_width=True):
            st.session_state.show_best_practices = True
            st.rerun()

        st.markdown("---")

        # Start over button
        if st.button("🔄 Start Over", use_container_width=True):
            reset_session()
            st.rerun()


# =============================================================================
# Phase 1: Input Phase
# =============================================================================


def display_input_phase():
    """Display the initial input phase."""
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

    st.markdown("### Enter Genie Space ID")

    col1, col2 = st.columns([3, 1])

    with col1:
        genie_space_id = st.text_input(
            "Genie Space ID",
            placeholder="e.g., 01f0627099691651968d0a92a26b06e9",
            help="The unique identifier for your Databricks Genie Space",
            label_visibility="collapsed",
        )

    with col2:
        fetch_button = st.button(
            "📥 Fetch Space", type="primary", use_container_width=True
        )

    if fetch_button:
        if not genie_space_id:
            st.warning("Please enter a Genie Space ID")
        elif missing_vars:
            st.error("Cannot fetch space without required environment variables")
        else:
            with st.spinner("Fetching Genie Space..."):
                try:
                    space_data = get_serialized_space(genie_space_id)
                    analyzer = get_analyzer()
                    sections_with_data = analyzer.get_sections_with_data(space_data)

                    st.session_state.genie_space_id = genie_space_id
                    st.session_state.space_data = space_data
                    st.session_state.sections_with_data = sections_with_data
                    st.session_state.phase = "ingest"
                    st.rerun()
                except Exception as e:
                    st.error(f"❌ Failed to fetch Genie Space: {str(e)}")


# =============================================================================
# Phase 2: Ingest Preview Phase
# =============================================================================


def display_ingest_phase():
    """Display the ingest preview phase with JSON viewer."""
    space_data = st.session_state.space_data
    sections_with_data = st.session_state.sections_with_data
    genie_space_id = st.session_state.genie_space_id

    # Display space ID
    st.markdown(f"**Space ID:** `{genie_space_id}`")
    st.markdown("---")

    # Metadata summary
    tables_count = len(space_data.get("data_sources", {}).get("tables", []))
    metric_views_count = len(space_data.get("data_sources", {}).get("metric_views", []))
    instructions_count = len(
        space_data.get("instructions", {}).get("text_instructions", [])
    )
    examples_count = len(
        space_data.get("instructions", {}).get("example_question_sqls", [])
    )
    benchmarks_count = len(space_data.get("benchmarks", {}).get("questions", []))

    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.metric("📊 Tables", tables_count)
    with col2:
        st.metric("📈 Metrics", metric_views_count)
    with col3:
        st.metric("📝 Instructions", instructions_count)
    with col4:
        st.metric("💡 Examples", examples_count)
    with col5:
        st.metric("✅ Benchmarks", benchmarks_count)

    st.markdown("---")

    # Two-column layout: JSON on left, sections list on right
    col_json, col_info = st.columns([2, 1])

    with col_json:
        st.markdown(
            '<div class="panel-header">📄 Serialized Space Data</div>',
            unsafe_allow_html=True,
        )

        # Display each section in collapsible expanders
        for section_name, section_data in sections_with_data:
            display_name = format_section_name(section_name)
            item_count = len(section_data) if isinstance(section_data, list) else 1

            with st.expander(
                f"**{display_name}** ({item_count} item{'s' if item_count != 1 else ''})"
            ):
                st.json(section_data)

    with col_info:
        st.markdown(
            '<div class="panel-header">ℹ️ Analysis Info</div>', unsafe_allow_html=True
        )

        st.markdown(f"**Sections to analyze:** {len(sections_with_data)}")

        for section_name, _ in sections_with_data:
            short_name = get_short_section_name(section_name)
            st.markdown(f"- {short_name}")

        st.markdown("---")

        if st.button("🚀 Start Analysis", type="primary", use_container_width=True):
            # Start a new MLflow session for trace grouping
            analyzer = get_analyzer()
            analyzer.start_session()

            st.session_state.phase = "analysis"
            st.session_state.current_section_idx = 0
            st.session_state.section_analyses = []
            st.session_state.all_sections_analyzed = False
            st.rerun()


# =============================================================================
# Phase 3: Section Analysis Phase
# =============================================================================


def display_finding(finding: Finding):
    """Display a single finding with recommendation inline."""
    st.markdown(
        f"""
        <div class="finding-card {finding.severity}">
            <div style="font-weight: 500; margin-bottom: 0.5rem;">{finding.description}</div>
            <div style="color: #555; font-size: 0.9rem; padding-top: 0.5rem; border-top: 1px solid #E0E0E0;">
                💡 {finding.recommendation}
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def display_findings_by_severity(findings: list[Finding]):
    """Display findings grouped by severity."""
    grouped = group_findings_by_severity(findings)

    severity_labels = {
        "high": ("🔴 High Severity", "#C62828"),
        "medium": ("🟠 Medium Severity", "#E65100"),
        "low": ("🔵 Low Severity", "#1565C0"),
    }

    for severity in ["high", "medium", "low"]:
        severity_findings = grouped[severity]
        if severity_findings:
            label, color = severity_labels[severity]
            st.markdown(
                f'<div class="severity-group-header {severity}">{label} ({len(severity_findings)})</div>',
                unsafe_allow_html=True,
            )
            for finding in severity_findings:
                display_finding(finding)


def display_analysis_phase():
    """Display the section-by-section analysis phase."""
    sections = st.session_state.sections_with_data
    current_idx = st.session_state.current_section_idx
    analyses = st.session_state.section_analyses
    genie_space_id = st.session_state.genie_space_id

    # Display space ID
    st.markdown(f"**Space ID:** `{genie_space_id}`")
    st.markdown("---")

    # Check if we're viewing a previously analyzed section or analyzing a new one
    is_reviewing = current_idx < len(analyses)

    section_name, section_data = sections[current_idx]
    display_name = format_section_name(section_name)

    # Run analysis if needed
    if not is_reviewing:
        with st.spinner(f"Analyzing {display_name}..."):
            try:
                analyzer = get_analyzer()
                analysis = analyzer.analyze_section(section_name, section_data)
                st.session_state.section_analyses.append(analysis)

                # Check if all sections are now analyzed
                if len(st.session_state.section_analyses) == len(sections):
                    st.session_state.all_sections_analyzed = True

                st.rerun()
            except Exception as e:
                st.error(f"❌ Analysis failed: {str(e)}")
                return

    analysis = analyses[current_idx]

    # Header with section info
    col_title, col_nav = st.columns([3, 1])
    with col_title:
        st.markdown(f"### 📊 {display_name}")
        st.caption(f"Section {current_idx + 1} of {len(sections)}")

    with col_nav:
        # Navigation buttons
        nav_col1, nav_col2 = st.columns(2)
        with nav_col1:
            if current_idx > 0:
                if st.button("← Prev", use_container_width=True):
                    st.session_state.current_section_idx = current_idx - 1
                    st.rerun()
        with nav_col2:
            if current_idx < len(sections) - 1:
                if st.button("Next →", type="primary", use_container_width=True):
                    st.session_state.current_section_idx = current_idx + 1
                    st.rerun()
            elif st.session_state.all_sections_analyzed:
                if st.button("Summary →", type="primary", use_container_width=True):
                    st.session_state.phase = "summary"
                    st.rerun()

    st.markdown("---")

    # Three-column layout: JSON | Score | Findings
    col_json, col_findings = st.columns([1, 1])

    with col_json:
        st.markdown(
            '<div class="panel-header">📄 Section Data</div>', unsafe_allow_html=True
        )
        st.json(section_data)

    with col_findings:
        # Score display at top
        if analysis.score >= 8:
            score_color = "#00A972"
            score_emoji = "✅"
        elif analysis.score >= 6:
            score_color = "#FF9800"
            score_emoji = "⚠️"
        else:
            score_color = "#C62828"
            score_emoji = "❌"

        st.markdown(
            f"""
            <div style="background-color: {score_color}; color: white; 
                        border-radius: 12px; padding: 1rem; text-align: center; margin-bottom: 1rem;">
                <div style="font-size: 2rem; font-weight: 800;">{analysis.score}/10</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">Section Score</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        if analysis.summary:
            st.info(f"{score_emoji} {analysis.summary}")

        st.markdown(
            '<div class="panel-header">🔍 Findings</div>', unsafe_allow_html=True
        )

        if analysis.findings:
            display_findings_by_severity(analysis.findings)
        else:
            st.success("✅ No issues found in this section!")


# =============================================================================
# Phase 4: Summary Phase
# =============================================================================


def display_summary_phase():
    """Display the final summary page."""
    # End MLflow session now that analysis is complete
    if st.session_state.analyzer:
        st.session_state.analyzer.end_session()

    analyses = st.session_state.section_analyses
    genie_space_id = st.session_state.genie_space_id

    # Initialize expanded_sections state for all sections if not already set
    if not st.session_state.expanded_sections:
        st.session_state.expanded_sections = {a.section_name: False for a in analyses}

    # Display space ID
    st.markdown(f"**Space ID:** `{genie_space_id}`")
    st.markdown("---")

    # Calculate overall score
    total_score = sum(a.score for a in analyses)
    overall_score = total_score // len(analyses) if analyses else 0

    # Overall Score Card centered
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        score_class = get_score_class(overall_score)
        st.markdown(
            f"""
            <div class="score-card {score_class}">
                <div class="score-value">{overall_score}</div>
                <div class="score-label">Overall Compliance Score</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # Summary statistics
    total_findings = sum(len(a.findings) for a in analyses)
    high_count = sum(1 for a in analyses for f in a.findings if f.severity == "high")
    medium_count = sum(
        1 for a in analyses for f in a.findings if f.severity == "medium"
    )
    low_count = sum(1 for a in analyses for f in a.findings if f.severity == "low")

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

    # Header with expand/collapse all buttons
    header_col, btn_col1, btn_col2 = st.columns([4, 1, 1])
    with header_col:
        st.markdown(
            '<div class="panel-header">📋 Section Scores</div>',
            unsafe_allow_html=True,
        )
    with btn_col1:
        if st.button("Expand All", key="expand_all", use_container_width=True):
            for a in analyses:
                st.session_state.expanded_sections[a.section_name] = True
            st.rerun()
    with btn_col2:
        if st.button("Collapse All", key="collapse_all", use_container_width=True):
            for a in analyses:
                st.session_state.expanded_sections[a.section_name] = False
            st.rerun()

    # Display each section as an expandable card
    for analysis in analyses:
        display_name = format_section_name(analysis.section_name)
        finding_count = len(analysis.findings)

        # Score color and emoji
        if analysis.score >= 8:
            score_color = "#00A972"
            score_emoji = "✅"
        elif analysis.score >= 6:
            score_color = "#FF9800"
            score_emoji = "⚠️"
        else:
            score_color = "#C62828"
            score_emoji = "❌"

        # Create expander with section name and score in the label
        expander_label = f"{display_name} — **{analysis.score}/10**"
        is_expanded = st.session_state.expanded_sections.get(
            analysis.section_name, False
        )

        with st.expander(expander_label, expanded=is_expanded):
            # Update expanded state when user interacts
            st.session_state.expanded_sections[analysis.section_name] = True

            # Summary
            if analysis.summary:
                st.info(f"{score_emoji} {analysis.summary}")

            # Findings
            if analysis.findings:
                st.markdown(f"**Findings ({finding_count})**")
                display_findings_by_severity(analysis.findings)
            else:
                st.success("✅ No issues found in this section!")


# =============================================================================
# Best Practices Page
# =============================================================================


def display_best_practices_page():
    """Display the best practices documentation page."""
    # Back button
    if st.button("← Back to Analysis", use_container_width=False):
        st.session_state.show_best_practices = False
        st.rerun()

    st.markdown("---")

    # Load and display the markdown content
    content = load_best_practices_content()
    st.markdown(content)


# =============================================================================
# Main App
# =============================================================================


def main():
    """Main app entry point."""
    init_session_state()

    # Sidebar navigation
    display_sidebar_nav()

    # Check if showing best practices page
    if st.session_state.show_best_practices:
        st.markdown(
            '<div class="header-title">📚 Best Practices Reference</div>',
            unsafe_allow_html=True,
        )
        st.markdown(
            '<div class="header-subtitle">Genie Space configuration guidelines organized by schema</div>',
            unsafe_allow_html=True,
        )
        display_best_practices_page()
        return

    # Header
    st.markdown(
        '<div class="header-title">🔍 Genie Space Analyzer</div>',
        unsafe_allow_html=True,
    )
    st.markdown(
        '<div class="header-subtitle">Analyze your Databricks Genie Space configuration against best practices</div>',
        unsafe_allow_html=True,
    )

    # Route to appropriate phase
    phase = st.session_state.phase

    if phase == "input":
        display_input_phase()
    elif phase == "ingest":
        display_ingest_phase()
    elif phase == "analysis":
        display_analysis_phase()
    elif phase == "summary":
        display_summary_phase()


if __name__ == "__main__":
    main()
