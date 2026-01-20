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
  LabelingFeedbackItem,
  OptimizationResponse,
} from "@/types"

const API_BASE = "/api"

// Request timeout values (in milliseconds)
const DEFAULT_TIMEOUT = 30_000 // 30 seconds for most requests
const LONG_TIMEOUT = 300_000 // 5 minutes for LLM operations (optimization can be slow)

class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

/**
 * Fetch with timeout support.
 */
async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }))
      throw new ApiError(error.detail || "An error occurred", response.status)
    }

    return response.json()
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", 408)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }))
    throw new ApiError(error.detail || "An error occurred", response.status)
  }
  return response.json()
}

/**
 * Fetch a Genie Space by ID.
 */
export async function fetchSpace(
  genieSpaceId: string
): Promise<FetchSpaceResponse> {
  return fetchWithTimeout<FetchSpaceResponse>(
    `${API_BASE}/space/fetch`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genie_space_id: genieSpaceId }),
    },
    DEFAULT_TIMEOUT
  )
}

/**
 * Parse pasted Genie Space JSON.
 */
export async function parseSpaceJson(
  jsonContent: string
): Promise<FetchSpaceResponse> {
  return fetchWithTimeout<FetchSpaceResponse>(
    `${API_BASE}/space/parse`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json_content: jsonContent }),
    },
    DEFAULT_TIMEOUT
  )
}

/**
 * Analyze a single section.
 */
export async function analyzeSection(
  request: AnalyzeSectionRequest
): Promise<SectionAnalysis> {
  return fetchWithTimeout<SectionAnalysis>(
    `${API_BASE}/analyze/section`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
    LONG_TIMEOUT // LLM operation
  )
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
  return fetchWithTimeout<GenieQueryResponse>(
    `${API_BASE}/genie/query`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        genie_space_id: genieSpaceId,
        question: question,
      }),
    },
    LONG_TIMEOUT // Genie can take time to respond
  )
}

/**
 * Execute SQL on a Databricks SQL Warehouse.
 */
export async function executeSql(
  sql: string,
  warehouseId?: string
): Promise<SqlExecutionResult> {
  return fetchWithTimeout<SqlExecutionResult>(
    `${API_BASE}/sql/execute`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sql: sql,
        warehouse_id: warehouseId,
      }),
    },
    LONG_TIMEOUT // SQL execution can be slow
  )
}

/**
 * Get application settings.
 */
export async function getSettings(): Promise<AppSettings> {
  return fetchWithTimeout<AppSettings>(`${API_BASE}/settings`, {}, DEFAULT_TIMEOUT)
}

/**
 * Progress event from streaming optimization.
 */
export interface OptimizationStreamProgress {
  status: "processing" | "complete" | "error"
  message?: string
  elapsed_seconds?: number
  data?: OptimizationResponse
}

/**
 * Stream optimization progress using Server-Sent Events.
 * Sends heartbeats to keep the connection alive during long LLM calls.
 */
export function streamOptimizations(
  genieSpaceId: string,
  spaceData: Record<string, unknown>,
  labelingFeedback: LabelingFeedbackItem[],
  onProgress: (progress: OptimizationStreamProgress) => void,
  onComplete: (result: OptimizationResponse) => void,
  onError: (error: Error) => void
): () => void {
  const abortController = new AbortController()

  fetch(`${API_BASE}/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      genie_space_id: genieSpaceId,
      space_data: spaceData,
      labeling_feedback: labelingFeedback,
    }),
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

      const processLine = (line: string) => {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6)) as OptimizationStreamProgress
            if (data.status === "complete" && data.data) {
              onComplete(data.data)
            } else if (data.status === "error") {
              onError(new Error(data.message || "Optimization failed"))
            } else {
              onProgress(data)
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          // Process any remaining data in the buffer
          if (buffer.trim()) {
            processLine(buffer.trim())
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          processLine(line)
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

export { ApiError }

