/**
 * TypeScript types matching the Python Pydantic models in agent_server/models.py
 */

// Configuration style detected by heuristics
export type ConfigStyle =
  | "metric-views-focused"
  | "tables-with-knowledge-base"
  | "example-driven"
  | "minimal-viable"
  | "hybrid"

// Qualitative assessment category (replaces numeric scores)
export type AssessmentCategory =
  | "good_to_go"
  | "quick_wins"
  | "foundation_needed"

export interface StyleDetectionResult {
  detected_style: ConfigStyle
  confidence: number
  indicators: Record<string, unknown>
  description: string
}

export interface CompensatingStrength {
  covering_section: string
  covered_section: string
  explanation: string
}

export interface SynthesisResult {
  assessment: AssessmentCategory
  assessment_rationale: string
  compensating_strengths: CompensatingStrength[]
  celebration_points: string[]
  top_quick_wins: string[]
}

export interface ChecklistItem {
  id: string
  description: string
  passed: boolean
  details: string | null
}

export interface Finding {
  category: "best_practice" | "warning" | "suggestion"
  severity: "high" | "medium" | "low"
  description: string
  recommendation: string
  reference: string
}

export interface SectionAnalysis {
  section_name: string
  checklist: ChecklistItem[]
  findings: Finding[]
  score: number
  summary: string
}

export interface AgentOutput {
  genie_space_id: string
  analyses: SectionAnalysis[]
  style: StyleDetectionResult | null
  synthesis: SynthesisResult | null
  overall_score: number
  trace_id: string
}

// API request/response types
export interface SectionInfo {
  name: string
  data: Record<string, unknown> | unknown[] | null
  has_data: boolean
}

export interface FetchSpaceResponse {
  genie_space_id: string
  space_data: Record<string, unknown>
  sections: SectionInfo[]
}

export interface AnalyzeSectionRequest {
  section_name: string
  section_data: Record<string, unknown> | unknown[] | null
  full_space: Record<string, unknown>
}

export interface StreamProgress {
  status: "fetching" | "detecting_style" | "analyzing" | "synthesizing" | "complete" | "result"
  message?: string
  section?: string
  current?: number
  total?: number
  data?: AgentOutput
}

export interface GenieQueryResponse {
  sql: string | null
  status: string
  error: string | null
  conversation_id: string
  message_id: string
}

// SQL execution types
export interface SqlExecutionColumn {
  name: string
  type_name: string
}

export interface SqlExecutionResult {
  columns: SqlExecutionColumn[]
  data: (string | number | boolean | null)[][]
  row_count: number
  truncated: boolean
  error: string | null
}

// Settings types
export interface AppSettings {
  genie_space_id: string | null
  llm_model: string
  sql_warehouse_id: string | null
  databricks_host: string | null
}

// Optimization types
export interface OptimizationSuggestion {
  field_path: string
  current_value: unknown
  suggested_value: unknown
  rationale: string
  checklist_reference: string | null
  priority: "high" | "medium" | "low"
  category: string
}

export interface LabelingFeedbackItem {
  question_text: string
  is_correct: boolean | null
  feedback_text: string | null
}

export interface OptimizationResponse {
  suggestions: OptimizationSuggestion[]
  summary: string
  trace_id: string
}

export interface ConfigMergeResponse {
  merged_config: Record<string, unknown>
  summary: string
  trace_id: string
}

// App state types
export type AppMode = "analyze" | "optimize"
export type Phase = "input" | "ingest" | "analysis" | "summary"
export type OptimizeView = "benchmarks" | "labeling" | "feedback" | "optimization" | "preview"

// Benchmark question from Genie Space JSON
export interface BenchmarkQuestion {
  id: string
  question: string[]
  answer?: {
    format: string
    content: string[]
  }[]
}

export interface AppState {
  mode: AppMode | null
  phase: Phase
  optimizeView: OptimizeView | null
  genieSpaceId: string
  spaceData: Record<string, unknown> | null
  sections: SectionInfo[]
  currentSectionIndex: number
  sectionAnalyses: SectionAnalysis[]
  allSectionsAnalyzed: boolean
  showChecklist: boolean
  showSettings: boolean
  isLoading: boolean
  error: string | null
}

