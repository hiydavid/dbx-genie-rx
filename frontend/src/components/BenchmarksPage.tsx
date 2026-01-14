/**
 * Benchmarks page component for viewing benchmark questions from Genie Space.
 */

import { useState, useMemo } from "react"
import {
  MessageSquare,
  Code,
  ChevronDown,
  AlertCircle,
  Search,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { BenchmarkQuestion } from "@/types"

interface BenchmarksPageProps {
  genieSpaceId: string
  spaceData: Record<string, unknown>
}

export function BenchmarksPage({ genieSpaceId, spaceData }: BenchmarksPageProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState("")

  // Extract benchmark questions from space data
  const benchmarkQuestions = useMemo(() => {
    const benchmarks = spaceData?.benchmarks as { questions?: BenchmarkQuestion[] } | undefined
    return benchmarks?.questions || []
  }, [spaceData])

  // Filter questions based on search query
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return benchmarkQuestions
    const query = searchQuery.toLowerCase()
    return benchmarkQuestions.filter((q) => {
      const questionText = q.question.join(" ").toLowerCase()
      const answerText = q.answer?.map((a) => a.content.join(" ")).join(" ").toLowerCase() || ""
      return questionText.includes(query) || answerText.includes(query)
    })
  }, [benchmarkQuestions, searchQuery])

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const hasBenchmarks = benchmarkQuestions.length > 0

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">
            Benchmark Questions
          </h1>
          <p className="text-muted">
            Space ID: <span className="font-mono text-secondary">{genieSpaceId}</span>
          </p>
        </div>

        {hasBenchmarks && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">
              {benchmarkQuestions.length} question{benchmarkQuestions.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!hasBenchmarks && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-warning" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">
              No Benchmark Questions Found
            </h3>
            <p className="text-muted max-w-md">
              This Genie Space doesn't have any benchmark questions configured.
              Benchmark questions help evaluate the accuracy and quality of your
              Genie Space's responses.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Questions list */}
      {hasBenchmarks && (
        <>
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              placeholder="Search questions or answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Results count when searching */}
          {searchQuery && (
            <p className="text-sm text-muted">
              Showing {filteredQuestions.length} of {benchmarkQuestions.length} questions
            </p>
          )}

          {/* Questions */}
          <div className="space-y-3">
            {filteredQuestions.map((question, index) => {
              const isExpanded = expandedQuestions[question.id]
              const hasAnswer = question.answer && question.answer.length > 0

              return (
                <Card
                  key={question.id}
                  className={cn(
                    "transition-all duration-200",
                    isExpanded && "ring-1 ring-accent/30"
                  )}
                >
                  <CardHeader className="p-4">
                    <button
                      onClick={() => toggleQuestion(question.id)}
                      className="w-full flex items-start gap-3 text-left group cursor-pointer"
                    >
                      <span className="flex-shrink-0 w-7 h-7 mt-0.5 rounded-lg bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-medium text-primary leading-relaxed group-hover:text-accent transition-colors">
                          {question.question.join(" ")}
                        </CardTitle>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-5 h-5 text-muted transition-transform duration-200 flex-shrink-0",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>
                  </CardHeader>

                  <div
                    className={cn(
                      "grid transition-all duration-200 ease-in-out",
                      isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <CardContent className="p-4 pt-3">
                        {hasAnswer ? (
                          <div className="space-y-3">
                            {question.answer!.map((answer, answerIndex) => (
                              <div key={answerIndex}>
                                <div className="flex items-center gap-2 text-xs font-medium text-muted uppercase tracking-wider mb-2">
                                  <Code className="w-3.5 h-3.5" />
                                  Expected {answer.format}
                                </div>
                                <pre className="p-3 bg-elevated rounded-lg overflow-x-auto text-sm leading-snug font-mono text-secondary border border-default whitespace-pre-wrap">
                                  {answer.content
                                    .join("\n")
                                    .split("\n")
                                    .filter((line) => line.trim() !== "")
                                    .join("\n")}
                                </pre>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted italic">
                            No expected answer configured for this benchmark question.
                          </p>
                        )}

                        {/* Question ID */}
                        <div className="mt-4 pt-3 border-t border-default">
                          <p className="text-xs text-muted">
                            ID: <span className="font-mono">{question.id}</span>
                          </p>
                        </div>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* No results state when searching */}
          {searchQuery && filteredQuestions.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="w-8 h-8 text-muted mb-3" />
                <p className="text-muted">
                  No questions match "{searchQuery}"
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
