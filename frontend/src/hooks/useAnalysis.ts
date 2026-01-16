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
  SqlExecutionResult,
  OptimizationSuggestion,
  BenchmarkQuestion,
} from "@/types"
import {
  fetchSpace,
  parseSpaceJson,
  analyzeSection,
  analyzeAllSections as analyzeAllSectionsApi,
  generateOptimizations as generateOptimizationsApi,
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
  showSettings: boolean
  isLoading: boolean
  error: string | null
  expandedSections: Record<string, boolean>
  analysisProgress: { completed: number; total: number } | null
  analyzingSection: number | null
  selectedQuestions: string[]
  hasLabelingSession: boolean
  // Labeling session state (persists across navigation)
  labelingCurrentIndex: number
  labelingGeneratedSql: Record<string, string>
  labelingGenieResults: Record<string, SqlExecutionResult | null>
  labelingExpectedResults: Record<string, SqlExecutionResult | null>
  labelingCorrectAnswers: Record<string, boolean | null>
  labelingFeedbackTexts: Record<string, string>
  // Optimization state
  optimizationSuggestions: OptimizationSuggestion[] | null
  optimizationSummary: string | null
  isOptimizing: boolean
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
  showSettings: false,
  isLoading: false,
  error: null,
  expandedSections: {},
  analysisProgress: null,
  analyzingSection: null,
  selectedQuestions: [],
  hasLabelingSession: false,
  // Labeling session state
  labelingCurrentIndex: 0,
  labelingGeneratedSql: {},
  labelingGenieResults: {},
  labelingExpectedResults: {},
  labelingCorrectAnswers: {},
  labelingFeedbackTexts: {},
  // Optimization state
  optimizationSuggestions: null,
  optimizationSummary: null,
  isOptimizing: false,
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>(initialState)

  const setMode = useCallback((mode: AppMode | null) => {
    setState((prev) => {
      // If clearing mode or no space data, just update mode
      if (!mode || !prev.spaceData) {
        return { ...prev, mode }
      }
      // Space data loaded + mode selected → transition to ingest
      return {
        ...prev,
        mode,
        phase: "ingest",
        optimizeView: mode === "optimize" ? "benchmarks" : null,
      }
    })
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
    setState((prev) => ({ ...prev, showChecklist: !prev.showChecklist, showSettings: false }))
  }, [])

  const toggleSettings = useCallback(() => {
    setState((prev) => ({ ...prev, showSettings: !prev.showSettings, showChecklist: false }))
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

  const goToFeedback = useCallback(() => {
    setState((prev) => ({
      ...prev,
      optimizeView: "feedback",
      showChecklist: false,
    }))
  }, [])

  const goToOptimization = useCallback(() => {
    setState((prev) => ({
      ...prev,
      optimizeView: "optimization",
      showChecklist: false,
    }))
  }, [])

  const startOptimization = useCallback(async () => {
    const { genieSpaceId, spaceData, selectedQuestions, labelingCorrectAnswers, labelingFeedbackTexts } = state
    if (!spaceData) return

    setState((prev) => ({ ...prev, isOptimizing: true, error: null, optimizeView: "optimization" }))

    try {
      // Get benchmark questions and build labeling feedback
      const benchmarks = spaceData?.benchmarks as { questions?: BenchmarkQuestion[] }
      const allQuestions = benchmarks?.questions || []

      // Build feedback items from selected questions
      const labelingFeedback = selectedQuestions.map(id => {
        const question = allQuestions.find(q => q.id === id)
        return {
          question_text: question?.question.join(" ") || "",
          is_correct: labelingCorrectAnswers[id] ?? null,
          feedback_text: labelingFeedbackTexts[id] || null,
        }
      })

      const response = await generateOptimizationsApi(
        genieSpaceId,
        spaceData,
        labelingFeedback
      )

      setState((prev) => ({
        ...prev,
        optimizationSuggestions: response.suggestions,
        optimizationSummary: response.summary,
        isOptimizing: false,
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Optimization failed",
        isOptimizing: false,
      }))
    }
  }, [state.genieSpaceId, state.spaceData, state.selectedQuestions, state.labelingCorrectAnswers, state.labelingFeedbackTexts])

  const clearSpaceData = useCallback(() => {
    setState((prev) => ({
      ...prev,
      genieSpaceId: "",
      spaceData: null,
      sections: [],
    }))
  }, [])

  // Labeling session actions
  const setLabelingCurrentIndex = useCallback((index: number) => {
    setState((prev) => ({ ...prev, labelingCurrentIndex: index }))
  }, [])

  const setLabelingGeneratedSql = useCallback((questionId: string, sql: string) => {
    setState((prev) => ({
      ...prev,
      labelingGeneratedSql: { ...prev.labelingGeneratedSql, [questionId]: sql },
    }))
  }, [])

  const setLabelingGenieResult = useCallback(
    (questionId: string, result: SqlExecutionResult | null) => {
      setState((prev) => ({
        ...prev,
        labelingGenieResults: { ...prev.labelingGenieResults, [questionId]: result },
      }))
    },
    []
  )

  const setLabelingExpectedResult = useCallback(
    (questionId: string, result: SqlExecutionResult | null) => {
      setState((prev) => ({
        ...prev,
        labelingExpectedResults: { ...prev.labelingExpectedResults, [questionId]: result },
      }))
    },
    []
  )

  const setLabelingCorrectAnswer = useCallback(
    (questionId: string, answer: boolean | null) => {
      setState((prev) => ({
        ...prev,
        labelingCorrectAnswers: { ...prev.labelingCorrectAnswers, [questionId]: answer },
      }))
    },
    []
  )

  const setLabelingFeedbackText = useCallback((questionId: string, text: string) => {
    setState((prev) => ({
      ...prev,
      labelingFeedbackTexts: { ...prev.labelingFeedbackTexts, [questionId]: text },
    }))
  }, [])

  const clearLabelingSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      hasLabelingSession: false,
      labelingCurrentIndex: 0,
      labelingGeneratedSql: {},
      labelingGenieResults: {},
      labelingExpectedResults: {},
      labelingCorrectAnswers: {},
      labelingFeedbackTexts: {},
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
      goToFeedback,
      goToOptimization,
      startOptimization,
      toggleChecklist,
      toggleSettings,
      toggleSectionExpanded,
      expandAllSections,
      collapseAllSections,
      toggleQuestionSelection,
      selectAllQuestions,
      deselectAllQuestions,
      clearSpaceData,
      // Labeling session actions
      setLabelingCurrentIndex,
      setLabelingGeneratedSql,
      setLabelingGenieResult,
      setLabelingExpectedResult,
      setLabelingCorrectAnswer,
      setLabelingFeedbackText,
      clearLabelingSession,
      reset,
    },
  }
}

