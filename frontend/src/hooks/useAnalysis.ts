/**
 * Custom hook for managing the Genie Space analysis state.
 */

import { useState, useCallback } from "react"
import type {
  Phase,
  AppMode,
  OptimizeView,
  SectionInfo,
  SectionAnalysis,
  FetchSpaceResponse,
} from "@/types"
import {
  fetchSpace,
  parseSpaceJson,
  analyzeSection,
  analyzeAllSections as analyzeAllSectionsApi,
} from "@/lib/api"

export interface AnalysisState {
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
  expandedSections: Record<string, boolean>
  analysisProgress: { completed: number; total: number } | null
  analyzingSection: number | null
  selectedQuestions: string[]
  hasLabelingSession: boolean
}

const initialState: AnalysisState = {
  mode: null,
  phase: "input",
  optimizeView: null,
  genieSpaceId: "",
  spaceData: null,
  sections: [],
  currentSectionIndex: 0,
  sectionAnalyses: [],
  allSectionsAnalyzed: false,
  showChecklist: false,
  isLoading: false,
  error: null,
  expandedSections: {},
  analysisProgress: null,
  analyzingSection: null,
  selectedQuestions: [],
  hasLabelingSession: false,
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>(initialState)

  const setMode = useCallback((mode: AppMode) => {
    setState((prev) => ({ ...prev, mode }))
  }, [])

  const setPhase = useCallback((phase: Phase) => {
    setState((prev) => ({ ...prev, phase, showChecklist: false, optimizeView: null }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, isLoading: false }))
  }, [])

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }))
  }, [])

  const handleFetchSpace = useCallback(async (spaceId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response: FetchSpaceResponse = await fetchSpace(spaceId)
      setState((prev) => ({
        ...prev,
        genieSpaceId: response.genie_space_id,
        spaceData: response.space_data,
        sections: response.sections,
        phase: "ingest",
        optimizeView: prev.mode === "optimize" ? "benchmarks" : null,
        isLoading: false,
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to fetch space",
        isLoading: false,
      }))
    }
  }, [])

  const handleParseJson = useCallback(async (jsonContent: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response: FetchSpaceResponse = await parseSpaceJson(jsonContent)
      setState((prev) => ({
        ...prev,
        genieSpaceId: response.genie_space_id,
        spaceData: response.space_data,
        sections: response.sections,
        phase: "ingest",
        optimizeView: prev.mode === "optimize" ? "benchmarks" : null,
        isLoading: false,
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to parse JSON",
        isLoading: false,
      }))
    }
  }, [])

  const startAnalysis = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: "analysis",
      currentSectionIndex: 0,
      sectionAnalyses: [],
      allSectionsAnalyzed: false,
    }))
  }, [])

  const analyzeAllSections = useCallback(async () => {
    const { sections, spaceData } = state
    if (!spaceData) return

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      analysisProgress: { completed: 0, total: sections.length },
    }))

    try {
      const results = await analyzeAllSectionsApi(
        sections,
        spaceData,
        (completed, total) =>
          setState((prev) => ({ ...prev, analysisProgress: { completed, total } }))
      )

      setState((prev) => ({
        ...prev,
        sectionAnalyses: results,
        allSectionsAnalyzed: true,
        phase: "summary",
        isLoading: false,
        analysisProgress: null,
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Analysis failed",
        isLoading: false,
        analysisProgress: null,
      }))
    }
  }, [state.sections, state.spaceData])

  const analyzeSingleSection = useCallback(
    async (index: number) => {
      const { sections, spaceData } = state
      if (!spaceData || index >= sections.length) return

      setState((prev) => ({ ...prev, analyzingSection: index, error: null }))

      try {
        const section = sections[index]
        const analysis = await analyzeSection({
          section_name: section.name,
          section_data: section.data,
          full_space: spaceData,
        })

        setState((prev) => {
          const newAnalyses = [...prev.sectionAnalyses]
          newAnalyses[index] = analysis
          return {
            ...prev,
            sectionAnalyses: newAnalyses,
            currentSectionIndex: index,
            phase: "analysis",
            analyzingSection: null,
          }
        })
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "Analysis failed",
          analyzingSection: null,
        }))
      }
    },
    [state.sections, state.spaceData]
  )

  const analyzeCurrentSection = useCallback(async () => {
    const { sections, currentSectionIndex, spaceData, sectionAnalyses } = state

    if (!spaceData || currentSectionIndex >= sections.length) return

    const section = sections[currentSectionIndex]

    // Check if already analyzed
    if (sectionAnalyses.length > currentSectionIndex) return

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const analysis = await analyzeSection({
        section_name: section.name,
        section_data: section.data,
        full_space: spaceData,
      })

      setState((prev) => {
        const newAnalyses = [...prev.sectionAnalyses, analysis]
        const allDone = newAnalyses.length === prev.sections.length

        return {
          ...prev,
          sectionAnalyses: newAnalyses,
          allSectionsAnalyzed: allDone,
          isLoading: false,
        }
      })
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Analysis failed",
        isLoading: false,
      }))
    }
  }, [state])

  const goToSection = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      phase: "analysis",
      currentSectionIndex: index,
      showChecklist: false,
    }))
  }, [])

  const nextSection = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentSectionIndex + 1
      if (nextIndex >= prev.sections.length) {
        return { ...prev, phase: "summary" }
      }
      return { ...prev, currentSectionIndex: nextIndex }
    })
  }, [])

  const prevSection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentSectionIndex: Math.max(0, prev.currentSectionIndex - 1),
    }))
  }, [])

  const goToSummary = useCallback(() => {
    setState((prev) => ({ ...prev, phase: "summary", showChecklist: false }))
  }, [])

  const goToIngest = useCallback(() => {
    setState((prev) => ({ ...prev, phase: "ingest", showChecklist: false, optimizeView: null }))
  }, [])

  const toggleChecklist = useCallback(() => {
    setState((prev) => ({ ...prev, showChecklist: !prev.showChecklist }))
  }, [])

  const toggleSectionExpanded = useCallback((sectionName: string) => {
    setState((prev) => ({
      ...prev,
      expandedSections: {
        ...prev.expandedSections,
        [sectionName]: !prev.expandedSections[sectionName],
      },
    }))
  }, [])

  const expandAllSections = useCallback(() => {
    setState((prev) => ({
      ...prev,
      expandedSections: Object.fromEntries(
        prev.sectionAnalyses.map((a) => [a.section_name, true])
      ),
    }))
  }, [])

  const collapseAllSections = useCallback(() => {
    setState((prev) => ({
      ...prev,
      expandedSections: {},
    }))
  }, [])

  const goToBenchmarks = useCallback(() => {
    setState((prev) => ({ ...prev, optimizeView: "benchmarks", showChecklist: false }))
  }, [])

  const toggleQuestionSelection = useCallback((questionId: string) => {
    setState((prev) => {
      const isSelected = prev.selectedQuestions.includes(questionId)
      return {
        ...prev,
        selectedQuestions: isSelected
          ? prev.selectedQuestions.filter((id) => id !== questionId)
          : [...prev.selectedQuestions, questionId],
      }
    })
  }, [])

  const selectAllQuestions = useCallback((questionIds: string[]) => {
    setState((prev) => ({ ...prev, selectedQuestions: questionIds }))
  }, [])

  const deselectAllQuestions = useCallback(() => {
    setState((prev) => ({ ...prev, selectedQuestions: [] }))
  }, [])

  const goToLabeling = useCallback(() => {
    setState((prev) => ({
      ...prev,
      optimizeView: "labeling",
      showChecklist: false,
      hasLabelingSession: true,
    }))
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  return {
    state,
    actions: {
      setMode,
      setPhase,
      setError,
      setLoading,
      handleFetchSpace,
      handleParseJson,
      startAnalysis,
      analyzeAllSections,
      analyzeSingleSection,
      analyzeCurrentSection,
      goToSection,
      nextSection,
      prevSection,
      goToSummary,
      goToIngest,
      goToBenchmarks,
      goToLabeling,
      toggleChecklist,
      toggleSectionExpanded,
      expandAllSections,
      collapseAllSections,
      toggleQuestionSelection,
      selectAllQuestions,
      deselectAllQuestions,
      reset,
    },
  }
}

