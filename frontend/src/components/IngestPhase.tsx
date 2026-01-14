/**
 * Ingest phase component showing space metadata and section preview.
 */

import {
  Play,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AccordionItem } from "@/components/ui/accordion"
import type { SectionInfo, SectionAnalysis } from "@/types"

interface IngestPhaseProps {
  genieSpaceId: string
  spaceData: Record<string, unknown>
  sections: SectionInfo[]
  sectionAnalyses: SectionAnalysis[]
  isLoading: boolean
  analysisProgress: { completed: number; total: number } | null
  analyzingSection: number | null
  onAnalyzeAllSections: () => void
  onAnalyzeSingleSection: (index: number) => void
  onGoToSection: (index: number) => void
}

function formatSectionName(sectionName: string): string {
  return sectionName
    .replace(/_/g, " ")
    .replace(/\./g, " → ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export function IngestPhase({
  genieSpaceId,
  sections,
  sectionAnalyses,
  isLoading,
  analysisProgress,
  analyzingSection,
  onAnalyzeAllSections,
  onAnalyzeSingleSection,
  onGoToSection,
}: IngestPhaseProps) {
  const configuredCount = sections.filter((s) => s.has_data).length

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-semibold text-primary">
            Ingested Serialized Space
          </h2>
          <p className="text-sm text-muted">
            Space ID:{" "}
            <code className="px-1.5 py-0.5 bg-elevated rounded text-secondary font-mono text-xs">
              {genieSpaceId}
            </code>
          </p>
        </div>
        <Button onClick={onAnalyzeAllSections} disabled={isLoading}>
          {analysisProgress ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing {analysisProgress.completed}/{analysisProgress.total}...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Analysis
            </>
          )}
        </Button>
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success dark:bg-success/15">
          <Check className="w-4 h-4" />
          <span className="font-medium">{configuredCount} configured</span>
        </div>
        {sections.length - configuredCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 text-warning dark:bg-warning/15">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">
              {sections.length - configuredCount} missing
            </span>
          </div>
        )}
      </div>

      {/* Sections Preview */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-display font-semibold text-primary mb-4">
            Serialized Space Data
          </h3>
          <div className="space-y-3">
            {sections.map((section, index) => {
              const displayName = formatSectionName(section.name)
              const itemCount = Array.isArray(section.data) ? section.data.length : 1
              const isAnalyzingThis = analyzingSection === index
              const analysis = sectionAnalyses[index]
              const isAnalyzed = analysis !== undefined

              if (!section.has_data) {
                return (
                  <AccordionItem
                    key={section.name}
                    title={
                      <span className="flex items-center gap-2">
                        <span className="text-warning">{displayName}</span>
                        <span className="text-xs text-muted">(not configured)</span>
                      </span>
                    }
                    icon={<AlertTriangle className="w-4 h-4 text-warning" />}
                    className="border-warning/30"
                  >
                    <p className="text-sm text-muted">
                      This section is not configured in your Genie Space.
                    </p>
                  </AccordionItem>
                )
              }

              // Calculate score for analyzed sections
              const passed = analysis?.checklist.filter((c) => c.passed).length ?? 0
              const total = analysis?.checklist.length ?? 0
              const percentage = total > 0 ? (passed / total) * 100 : 100

              return (
                <AccordionItem
                  key={section.name}
                  title={
                    <span className="flex items-center gap-2">
                      <span>{displayName}</span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-accent/10 text-accent rounded-full dark:bg-accent/20">
                        {itemCount}
                      </span>
                      {isAnalyzed && (
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            percentage === 100
                              ? "bg-success/10 text-success dark:bg-success/20"
                              : percentage >= 60
                              ? "bg-warning/10 text-warning dark:bg-warning/20"
                              : "bg-danger/10 text-danger dark:bg-danger/20"
                          }`}
                        >
                          {passed}/{total}
                        </span>
                      )}
                    </span>
                  }
                  icon={<Check className="w-4 h-4 text-success" />}
                  action={
                    isAnalyzed ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onGoToSection(index)
                        }}
                        className="h-7 w-7 p-0 text-success hover:text-success"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoading || analyzingSection !== null}
                        onClick={(e) => {
                          e.stopPropagation()
                          onAnalyzeSingleSection(index)
                        }}
                        className="h-7 w-7 p-0 text-accent hover:text-accent hover:bg-accent/10"
                        title="Analyze this section"
                      >
                        {isAnalyzingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    )
                  }
                >
                  <pre className="text-xs font-mono overflow-auto max-h-[32rem] p-3 bg-surface rounded-lg border border-default">
                    {JSON.stringify(section.data, null, 2)}
                  </pre>
                </AccordionItem>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
