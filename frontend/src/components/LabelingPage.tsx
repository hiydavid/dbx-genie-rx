/**
 * Labeling page for reviewing benchmark questions one at a time.
 */

import { useState, useMemo } from "react"
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, Loader2, Sparkles, GitCompare, Check } from "lucide-react"
import { format as formatSqlLib } from "sql-formatter"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SqlCodeBlock } from "@/components/SqlCodeBlock"
import { SqlDiffView } from "@/components/SqlDiffView"
import { DataTable } from "@/components/DataTable"
import { queryGenie, executeSql } from "@/lib/api"
import type { BenchmarkQuestion, SqlExecutionResult } from "@/types"

interface LabelingPageProps {
  genieSpaceId: string
  spaceData: Record<string, unknown>
  selectedQuestions: string[]
  onBack: () => void
}

export function LabelingPage({
  genieSpaceId,
  spaceData,
  selectedQuestions,
  onBack,
}: LabelingPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Genie SQL generation state
  const [generatedSql, setGeneratedSql] = useState<Record<string, string>>({})
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [showDiff, setShowDiff] = useState(false)

  // SQL execution state (keyed by question ID for session persistence)
  const [genieResults, setGenieResults] = useState<Record<string, SqlExecutionResult | null>>({})
  const [expectedResults, setExpectedResults] = useState<Record<string, SqlExecutionResult | null>>({})
  const [isExecutingGenie, setIsExecutingGenie] = useState(false)
  const [isExecutingExpected, setIsExecutingExpected] = useState(false)

  // Labeling feedback state (keyed by question ID for session persistence)
  const [correctAnswers, setCorrectAnswers] = useState<Record<string, boolean | null>>({})
  const [feedbackTexts, setFeedbackTexts] = useState<Record<string, string>>({})

  // Get the selected questions in order
  const questions = useMemo(() => {
    const benchmarks = spaceData?.benchmarks as { questions?: BenchmarkQuestion[] }
    const allQuestions = benchmarks?.questions || []
    // Filter to only selected questions, preserving selection order
    return selectedQuestions
      .map(id => allQuestions.find(q => q.id === id))
      .filter((q): q is BenchmarkQuestion => q !== undefined)
  }, [spaceData, selectedQuestions])

  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex]
  // Count questions that have been labeled (have Yes/No feedback)
  const labeledCount = questions.filter(q => correctAnswers[q.id] !== undefined && correctAnswers[q.id] !== null).length
  const allLabeled = labeledCount === totalQuestions && totalQuestions > 0

  const handlePrev = () => {
    setCurrentIndex(i => Math.max(0, i - 1))
  }

  const handleNext = () => {
    setCurrentIndex(i => Math.min(totalQuestions - 1, i + 1))
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentIndex(Number(e.target.value))
  }

  const handleSegmentClick = (idx: number) => {
    setCurrentIndex(idx)
  }

  // Get expected SQL from answer (look for SQL format first, then fall back to first answer)
  const expectedSql = useMemo(() => {
    if (!currentQuestion?.answer?.length) return null
    const sqlAnswer = currentQuestion.answer.find(a =>
      a.format.toLowerCase() === "sql"
    )
    const answer = sqlAnswer || currentQuestion.answer[0]
    // Content array elements already include \n, so join with empty string
    return answer?.content?.join("") || null
  }, [currentQuestion])

  // Get current question's generated SQL
  const currentGeneratedSql = currentQuestion ? generatedSql[currentQuestion.id] : null
  const isGenerating = generatingFor === currentQuestion?.id

  // Get current question's execution results and feedback
  const genieResult = currentQuestion ? genieResults[currentQuestion.id] ?? null : null
  const expectedResult = currentQuestion ? expectedResults[currentQuestion.id] ?? null : null
  const isCorrect = currentQuestion ? correctAnswers[currentQuestion.id] ?? null : null
  const feedbackText = currentQuestion ? feedbackTexts[currentQuestion.id] ?? '' : ''

  // Format SQL using sql-formatter library for consistent display
  const formatSql = (sql: string): string => {
    try {
      return formatSqlLib(sql, {
        language: "sql",
        indentStyle: "standard",
        keywordCase: "upper",
        linesBetweenQueries: 1,
      })
    } catch {
      // If formatting fails, return original
      return sql
    }
  }

  // Format the generated SQL for display
  const formattedGeneratedSql = currentGeneratedSql ? formatSql(currentGeneratedSql) : null

  // Handler for generating SQL with Genie and executing both queries
  const handleGenerateSql = async () => {
    if (!currentQuestion) return

    const questionId = currentQuestion.id
    setGeneratingFor(questionId)
    setGenerateError(null)

    try {
      const questionText = currentQuestion.question.join(" ")
      const response = await queryGenie(genieSpaceId, questionText)

      if (response.status === "COMPLETED" && response.sql) {
        setGeneratedSql(prev => ({
          ...prev,
          [questionId]: response.sql!
        }))

        // Execute both SQLs in parallel
        setIsExecutingGenie(true)
        setIsExecutingExpected(true)

        const [genieExec, expectedExec] = await Promise.allSettled([
          executeSql(response.sql),
          expectedSql ? executeSql(expectedSql) : Promise.resolve(null),
        ])

        // Handle Genie result
        if (genieExec.status === "fulfilled" && genieExec.value) {
          setGenieResults(prev => ({ ...prev, [questionId]: genieExec.value }))
        } else if (genieExec.status === "rejected") {
          setGenieResults(prev => ({
            ...prev,
            [questionId]: {
              columns: [],
              data: [],
              row_count: 0,
              truncated: false,
              error: genieExec.reason?.message || "Failed to execute Genie SQL",
            }
          }))
        }

        // Handle Expected result
        if (expectedExec.status === "fulfilled" && expectedExec.value) {
          setExpectedResults(prev => ({ ...prev, [questionId]: expectedExec.value }))
        } else if (expectedExec.status === "rejected") {
          setExpectedResults(prev => ({
            ...prev,
            [questionId]: {
              columns: [],
              data: [],
              row_count: 0,
              truncated: false,
              error: expectedExec.reason?.message || "Failed to execute Expected SQL",
            }
          }))
        }

        setIsExecutingGenie(false)
        setIsExecutingExpected(false)
      } else if (response.error) {
        setGenerateError(response.error)
      } else {
        setGenerateError("Genie did not generate SQL for this question")
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Failed to generate SQL")
    } finally {
      setGeneratingFor(null)
      setIsExecutingGenie(false)
      setIsExecutingExpected(false)
    }
  }

  if (!currentQuestion) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Benchmarks
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted">No questions selected.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">
            Labeling Session
          </h1>
          <p className="text-muted">
            Space ID: <span className="font-mono text-secondary">{genieSpaceId}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Benchmarks
          </Button>
          <Button
            onClick={handleGenerateSql}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate and Compare Outputs
              </>
            )}
          </Button>
        </div>
      </div>

      {generateError && (
        <div className="text-sm text-danger">{generateError}</div>
      )}

      {/* Segmented Progress Bar with Navigation */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Prev
          </Button>

          {/* Segmented Bar */}
          <div className="flex-1 flex gap-1">
            {questions.map((q, idx) => {
              const labelValue = correctAnswers[q.id]
              const isLabeled = labelValue !== undefined && labelValue !== null
              const isCurrent = idx === currentIndex
              return (
                <button
                  key={q.id}
                  onClick={() => handleSegmentClick(idx)}
                  className={`
                    flex-1 h-2.5 rounded-full transition-all cursor-pointer
                    ${isLabeled
                      ? labelValue === true
                        ? "bg-green-500 dark:shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                        : "bg-red-500 dark:shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                      : isCurrent
                        ? "bg-secondary/40"
                        : "bg-elevated hover:bg-secondary/30"
                    }
                    ${isCurrent ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}
                  `}
                  title={`Question ${idx + 1}${isLabeled ? (labelValue ? " (correct)" : " (incorrect)") : ""}`}
                />
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex === totalQuestions - 1}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>

          <Button
            size="sm"
            disabled={!allLabeled}
          >
            <Check className="w-4 h-4 mr-1" />
            Finish
          </Button>
        </div>

        {/* Status text */}
        <p className="text-center text-sm text-muted">
          {labeledCount} of {totalQuestions} labeled
        </p>
      </div>

      {/* Question Display with Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted">Question</h3>
            <div className="relative">
              <select
                value={currentIndex}
                onChange={handleSelectChange}
                className="appearance-none text-sm text-secondary bg-elevated hover:bg-sunken pl-3 pr-8 py-1.5 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
              >
                {questions.map((q, idx) => {
                  const text = q.question.join(" ")
                  const truncated = text.length > 40 ? text.slice(0, 40) + "..." : text
                  return (
                    <option key={q.id} value={idx}>
                      {idx + 1}. {truncated}
                    </option>
                  )
                })}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            </div>
          </div>
          <p className="text-primary text-lg">
            {currentQuestion.question.join(" ")}
          </p>
        </CardContent>
      </Card>

      {/* Labeling Feedback Box */}
      <Card className={!genieResult ? 'opacity-50' : ''}>
        <CardContent className="py-4 px-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-primary">Label This Question</h3>
            {!genieResult && (
              <span className="text-xs text-muted">Run "Generate and Compare Outputs" first</span>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Question 1: Was Genie's output correct? */}
            <div>
              <label className="text-sm text-secondary mb-2 block">Was Genie's output correct?</label>
              <div className="flex gap-2">
                <button
                  onClick={() => currentQuestion && setCorrectAnswers(prev => ({ ...prev, [currentQuestion.id]: true }))}
                  disabled={!genieResult}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    isCorrect === true
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-default text-secondary hover:border-strong'
                  } disabled:cursor-not-allowed disabled:hover:border-default`}
                >
                  Yes
                </button>
                <button
                  onClick={() => currentQuestion && setCorrectAnswers(prev => ({ ...prev, [currentQuestion.id]: false }))}
                  disabled={!genieResult}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    isCorrect === false
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-default text-secondary hover:border-strong'
                  } disabled:cursor-not-allowed disabled:hover:border-default`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Question 2: What did Genie get wrong? */}
            <div className="flex-1">
              <label className="text-sm text-secondary mb-2 block">If not, what did Genie get wrong?</label>
              <textarea
                value={feedbackText}
                onChange={(e) => currentQuestion && setFeedbackTexts(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                placeholder="Describe what was incorrect..."
                disabled={!genieResult}
                className="w-full p-2 text-sm rounded-lg border border-default bg-surface text-primary placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors disabled:cursor-not-allowed disabled:bg-elevated"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side Output Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Genie's Output (left) */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted">Genie's Output</h3>
          <Card>
            <CardContent className="py-4">
              {isExecutingGenie ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted mr-2" />
                  <span className="text-muted text-sm">Executing SQL...</span>
                </div>
              ) : genieResult ? (
                genieResult.error ? (
                  <div className="text-danger text-sm py-4 text-center">{genieResult.error}</div>
                ) : (
                  <DataTable
                    columns={genieResult.columns}
                    data={genieResult.data}
                    truncated={genieResult.truncated}
                  />
                )
              ) : (
                <p className="text-muted text-sm text-center py-8">
                  Click "Generate and Compare Outputs" to proceed
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Expected Output (right) */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted">Expected Output</h3>
          <Card>
            <CardContent className="py-4">
              {isExecutingExpected ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted mr-2" />
                  <span className="text-muted text-sm">Executing SQL...</span>
                </div>
              ) : expectedResult ? (
                expectedResult.error ? (
                  <div className="text-danger text-sm py-4 text-center">{expectedResult.error}</div>
                ) : (
                  <DataTable
                    columns={expectedResult.columns}
                    data={expectedResult.data}
                    truncated={expectedResult.truncated}
                  />
                )
              ) : expectedSql ? (
                <p className="text-muted text-sm text-center py-8">
                  Click "Generate and Compare Outputs" to proceed
                </p>
              ) : (
                <p className="text-muted text-sm text-center py-8">
                  No expected SQL available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Side-by-side SQL Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Generated SQL (left) */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted">Genie's Generated SQL</h3>
          {formattedGeneratedSql ? (
            <SqlCodeBlock code={formattedGeneratedSql} maxLines={15} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted text-sm">
                  {isGenerating ? "Generating..." : "Click \"Generate and Compare Outputs\" to proceed"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Expected SQL (right) */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted">Expected SQL</h3>
          {expectedSql ? (
            <SqlCodeBlock code={expectedSql} maxLines={15} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted text-sm">No expected SQL available</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Collapsible Diff View - only shown when both SQLs exist */}
      {formattedGeneratedSql && expectedSql && (
        <div className="space-y-3">
          <button
            onClick={() => setShowDiff(!showDiff)}
            className="flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
          >
            <GitCompare className="w-4 h-4" />
            <span>Show Diff View</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showDiff ? "rotate-180" : ""}`} />
          </button>

          {showDiff && (
            <SqlDiffView
              generatedSql={formattedGeneratedSql}
              expectedSql={expectedSql}
            />
          )}
        </div>
      )}

    </div>
  )
}
