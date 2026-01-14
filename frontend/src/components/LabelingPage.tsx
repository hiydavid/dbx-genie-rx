/**
 * Labeling page for reviewing benchmark questions one at a time.
 */

import { useState, useMemo } from "react"
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SqlCodeBlock } from "@/components/SqlCodeBlock"
import type { BenchmarkQuestion } from "@/types"

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
  // Track processed questions (empty for now, will be populated when processing feature is added)
  const [processedQuestions] = useState<Set<string>>(new Set())

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
  const processedCount = questions.filter(q => processedQuestions.has(q.id)).length

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
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Benchmarks
        </Button>
      </div>

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
              const isProcessed = processedQuestions.has(q.id)
              const isCurrent = idx === currentIndex
              return (
                <button
                  key={q.id}
                  onClick={() => handleSegmentClick(idx)}
                  className={`
                    flex-1 h-2.5 rounded-full transition-all cursor-pointer
                    ${isProcessed
                      ? "bg-accent dark:shadow-[0_0_8px_rgba(79,70,229,0.5)]"
                      : isCurrent
                        ? "bg-secondary/40"
                        : "bg-elevated hover:bg-secondary/30"
                    }
                    ${isCurrent ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}
                  `}
                  title={`Question ${idx + 1}${isProcessed ? " (labeled)" : ""}`}
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
        </div>

        {/* Status text */}
        <p className="text-center text-sm text-muted">
          {processedCount} of {totalQuestions} labeled
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

      {/* Expected SQL Display */}
      {expectedSql && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted">Expected SQL</h3>
          <SqlCodeBlock code={expectedSql} maxLines={10} />
        </div>
      )}

      {/* Show message if no expected answer */}
      {!expectedSql && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted">No expected SQL answer available for this question.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
