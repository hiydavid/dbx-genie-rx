/**
 * TypeScript types matching the Python Pydantic models in agent_server/models.py
 */

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
  status: "fetching" | "analyzing" | "complete" | "result"
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

// App state types
export type AppMode = "analyze" | "optimize"
export type Phase = "input" | "ingest" | "analysis" | "summary"
export type OptimizeView = "benchmarks" | "labeling"

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
  isLoading: boolean
  error: string | null
}

