/**
 * API client for communicating with the Genie Space Analyzer backend.
 */

import type {
  FetchSpaceResponse,
  SectionAnalysis,
  SectionInfo,
  AnalyzeSectionRequest,
  StreamProgress,
  GenieQueryResponse,
  SqlExecutionResult,
  AppSettings,
} from "@/types"

const API_BASE = "/api"

class ApiError extends Error {
  status: number
  
  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new ApiError(error.detail || "An error occurred", response.status)
  }
  return response.json()
}

/**
 * Fetch a Genie Space by ID.
 */
export async function fetchSpace(genieSpaceId: string): Promise<FetchSpaceResponse> {
  const response = await fetch(`${API_BASE}/space/fetch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ genie_space_id: genieSpaceId }),
  })
  return handleResponse<FetchSpaceResponse>(response)
}

/**
 * Parse pasted Genie Space JSON.
 */
export async function parseSpaceJson(jsonContent: string): Promise<FetchSpaceResponse> {
  const response = await fetch(`${API_BASE}/space/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ json_content: jsonContent }),
  })
  return handleResponse<FetchSpaceResponse>(response)
}

/**
 * Analyze a single section.
 */
export async function analyzeSection(
  request: AnalyzeSectionRequest
): Promise<SectionAnalysis> {
  const response = await fetch(`${API_BASE}/analyze/section`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })
  return handleResponse<SectionAnalysis>(response)
}

/**
 * Analyze all sections in parallel.
 */
export async function analyzeAllSections(
  sections: SectionInfo[],
  fullSpace: Record<string, unknown>,
  onProgress?: (completed: number, total: number) => void
): Promise<SectionAnalysis[]> {
  const total = sections.length
  let completed = 0

  const results = await Promise.all(
    sections.map(async (section) => {
      const result = await analyzeSection({
        section_name: section.name,
        section_data: section.data,
        full_space: fullSpace,
      })
      completed++
      onProgress?.(completed, total)
      return result
    })
  )
  return results
}

/**
 * Stream analysis progress using Server-Sent Events.
 */
export function streamAnalysis(
  genieSpaceId: string,
  onProgress: (progress: StreamProgress) => void,
  onComplete: (result: StreamProgress) => void,
  onError: (error: Error) => void
): () => void {
  const abortController = new AbortController()

  fetch(`${API_BASE}/analyze/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ genie_space_id: genieSpaceId }),
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new ApiError("Stream request failed", response.status)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) as StreamProgress
              if (data.status === "result") {
                onComplete(data)
              } else {
                onProgress(data)
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    })
    .catch((error) => {
      if (error.name !== "AbortError") {
        onError(error)
      }
    })

  return () => abortController.abort()
}

/**
 * Get the checklist documentation.
 */
export async function getChecklist(): Promise<string> {
  const response = await fetch(`${API_BASE}/checklist`)
  const data = await handleResponse<{ content: string }>(response)
  return data.content
}

/**
 * Get the list of all section names.
 */
export async function getSections(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/sections`)
  const data = await handleResponse<{ sections: string[] }>(response)
  return data.sections
}

/**
 * Query Genie to generate SQL for a natural language question.
 */
export async function queryGenie(
  genieSpaceId: string,
  question: string
): Promise<GenieQueryResponse> {
  const response = await fetch(`${API_BASE}/genie/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      genie_space_id: genieSpaceId,
      question: question,
    }),
  })
  return handleResponse<GenieQueryResponse>(response)
}

/**
 * Execute SQL on a Databricks SQL Warehouse.
 */
export async function executeSql(
  sql: string,
  warehouseId?: string
): Promise<SqlExecutionResult> {
  const response = await fetch(`${API_BASE}/sql/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sql: sql,
      warehouse_id: warehouseId,
    }),
  })
  return handleResponse<SqlExecutionResult>(response)
}

/**
 * Get application settings.
 */
export async function getSettings(): Promise<AppSettings> {
  const response = await fetch(`${API_BASE}/settings`)
  return handleResponse<AppSettings>(response)
}

export { ApiError }

