/**
 * Analysis phase component showing section-by-section analysis.
 */

import { useEffect } from "react"
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChecklistProgress } from "@/components/ChecklistProgress"
import type { SectionInfo, SectionAnalysis } from "@/types"

interface AnalysisPhaseProps {
  genieSpaceId: string
  sections: SectionInfo[]
  currentSectionIndex: number
  sectionAnalyses: SectionAnalysis[]
  allSectionsAnalyzed: boolean
  isLoading: boolean
  error: string | null
  onAnalyzeSection: () => Promise<void>
  onPrevSection: () => void
  onNextSection: () => void
  onGoToSummary: () => void
}

function formatSectionName(sectionName: string): string {
  return sectionName
    .replace(/_/g, " ")
    .replace(/\./g, " → ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export function AnalysisPhase({
  genieSpaceId,
  sections,
  currentSectionIndex,
  sectionAnalyses,
  allSectionsAnalyzed,
  isLoading,
  error,
  onAnalyzeSection,
  onPrevSection,
  onNextSection,
  onGoToSummary,
}: AnalysisPhaseProps) {
  const currentSection = sections[currentSectionIndex]
  const currentAnalysis = sectionAnalyses[currentSectionIndex]
  const isReviewing = currentSectionIndex < sectionAnalyses.length

  // Auto-analyze when reaching a new section
  useEffect(() => {
    if (!isReviewing && !isLoading && !error) {
      onAnalyzeSection()
    }
  }, [currentSectionIndex, isReviewing, isLoading, error, onAnalyzeSection])

  const displayName = formatSectionName(currentSection.name)
  const isLastSection = currentSectionIndex === sections.length - 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{displayName}</h2>
          <p className="text-sm text-slate-500">
            Section {currentSectionIndex + 1} of {sections.length} •{" "}
            <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{genieSpaceId}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onPrevSection}
            disabled={currentSectionIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Prev
          </Button>
          {isLastSection && allSectionsAnalyzed ? (
            <Button onClick={onGoToSummary}>
              Summary
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={onNextSection}
              disabled={!isReviewing && !currentAnalysis}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-lg font-medium">Analyzing {displayName}...</p>
            <p className="text-sm">This may take a moment</p>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card className="border-danger/30 bg-danger/5">
          <CardContent className="py-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-danger">Analysis Failed</p>
              <p className="text-sm text-slate-600 mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onAnalyzeSection}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis content */}
      {currentAnalysis && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Section Data */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-base">Section Data</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              {!currentSection.has_data ? (
                <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-lg text-warning">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">
                    This section is not configured in your Genie Space.
                  </p>
                </div>
              ) : (
                <pre className="text-xs overflow-auto flex-1 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  {JSON.stringify(currentSection.data, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-base">Checklist</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {currentAnalysis.summary && (
                <div className="flex items-start gap-3 p-4 bg-info/10 rounded-lg mb-4">
                  <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">{currentAnalysis.summary}</p>
                </div>
              )}

              {currentAnalysis.checklist.length > 0 ? (
                <ChecklistProgress checklist={currentAnalysis.checklist} />
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">
                  No checklist items for this section.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

