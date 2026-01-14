/**
 * Sidebar navigation component showing analysis progress.
 */

import { useState } from "react"
import {
  Download,
  BarChart3,
  ClipboardCheck,
  RotateCcw,
  Check,
  AlertTriangle,
  Circle,
  Search,
  ChevronDown,
  MessageSquare,
  Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Phase, OptimizeView, SectionInfo, SectionAnalysis } from "@/types"

interface SidebarNavProps {
  phase: Phase
  optimizeView: OptimizeView | null
  sections: SectionInfo[]
  currentSectionIndex: number
  sectionAnalyses: SectionAnalysis[]
  allSectionsAnalyzed: boolean
  showChecklist: boolean
  hasLabelingSession: boolean
  onGoToIngest: () => void
  onGoToSection: (index: number) => void
  onGoToSummary: () => void
  onGoToBenchmarks: () => void
  onGoToLabeling: () => void
  onToggleChecklist: () => void
  onReset: () => void
}

function getShortSectionName(sectionName: string): string {
  return sectionName
    .split(".")
    .pop()!
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/Sql/g, "SQL")
}

export function SidebarNav({
  phase,
  optimizeView,
  sections,
  currentSectionIndex,
  sectionAnalyses,
  allSectionsAnalyzed,
  showChecklist,
  hasLabelingSession,
  onGoToIngest,
  onGoToSection,
  onGoToSummary,
  onGoToBenchmarks,
  onGoToLabeling,
  onToggleChecklist,
  onReset,
}: SidebarNavProps) {
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true)
  const [isOptimizeExpanded, setIsOptimizeExpanded] = useState(true)
  const completedCount = sectionAnalyses.length
  const progressPercentage = sections.length > 0 ? (completedCount / sections.length) * 100 : 0

  if (phase === "input") {
    return (
      <aside className="w-64 bg-surface border-r border-default p-4 min-h-screen">
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-primary mb-1">Progress</h2>
          <p className="text-xs text-muted">
            Enter a Genie Space ID to begin
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 bg-surface border-r border-default p-4 min-h-screen flex flex-col relative overflow-hidden">
      {/* Subtle inner shadow for depth */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-border-strong to-transparent opacity-50" />

      {/* Progress header */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-primary mb-2">Progress</h2>
        <div className="flex items-center justify-between text-xs text-muted mb-2">
          <span>{completedCount}/{sections.length} sections</span>
          <span className="font-mono">{Math.round(progressPercentage)}%</span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500 ease-out dark:shadow-[0_0_8px_rgba(79,70,229,0.5)]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        {/* Ingest step */}
        <button
          onClick={onGoToIngest}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
            phase === "ingest" && !showChecklist
              ? "gradient-accent text-white shadow-lg shadow-accent/20 dark:glow-accent"
              : "bg-success/10 text-success hover:bg-success/20 dark:bg-success/15"
          )}
        >
          {phase === "ingest" && !showChecklist ? (
            <Download className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Ingest Preview
        </button>

        <hr className="border-default my-3" />

        {/* Analysis group */}
        <div>
          <button
            type="button"
            onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted uppercase tracking-wider hover:text-secondary transition-colors"
          >
            <span>Analysis</span>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                isAnalysisExpanded && "rotate-180"
              )}
            />
          </button>

          <div
            className={cn(
              "grid transition-all duration-200 ease-in-out",
              isAnalysisExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              {/* Section steps */}
              <div className="space-y-1 pl-2 mt-1">
                {sections.map((section, index) => {
                  const shortName = getShortSectionName(section.name)
                  const isMissing = !section.has_data
                  const isCurrent =
                    phase === "analysis" && index === currentSectionIndex && !showChecklist
                  const isCompleted = sectionAnalyses[index] !== undefined

                  let icon = <Circle className="w-4 h-4" />
                  let className =
                    "bg-elevated text-muted cursor-not-allowed opacity-60"

                  if (isCurrent) {
                    icon = isMissing ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )
                    className = "gradient-accent text-white shadow-lg shadow-accent/20 dark:glow-accent dark:animate-pulse-glow"
                  } else if (isCompleted) {
                    icon = isMissing ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )
                    className = isMissing
                      ? "bg-warning/10 text-warning hover:bg-warning/20 cursor-pointer dark:bg-warning/15"
                      : "bg-success/10 text-success hover:bg-success/20 cursor-pointer dark:bg-success/15"
                  } else if (isMissing) {
                    icon = <AlertTriangle className="w-4 h-4" />
                    className = "bg-warning/10 text-warning opacity-50"
                  }

                  return (
                    <button
                      key={section.name}
                      onClick={() => isCompleted && onGoToSection(index)}
                      disabled={!isCompleted}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                        className
                      )}
                    >
                      {icon}
                      <span className="truncate">{shortName}</span>
                    </button>
                  )
                })}
              </div>

              {/* Summary step - inside Analysis group */}
              <div className="pl-2 mt-2">
                <button
                  onClick={onGoToSummary}
                  disabled={!allSectionsAnalyzed && completedCount !== sections.length}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                    phase === "summary" && !showChecklist
                      ? "gradient-accent text-white shadow-lg shadow-accent/20 dark:glow-accent"
                      : allSectionsAnalyzed || completedCount === sections.length
                      ? "bg-elevated text-secondary hover:bg-sunken cursor-pointer"
                      : "bg-elevated text-muted cursor-not-allowed opacity-60"
                  )}
                >
                  <BarChart3 className="w-4 h-4" />
                  Summary
                </button>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-default my-3" />

        {/* Optimize group */}
        <div>
          <button
            type="button"
            onClick={() => setIsOptimizeExpanded(!isOptimizeExpanded)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted uppercase tracking-wider hover:text-secondary transition-colors"
          >
            <span className="flex items-center gap-1.5">
              Optimize
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-warning/20 text-warning normal-case tracking-normal">
                Soon
              </span>
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                isOptimizeExpanded && "rotate-180"
              )}
            />
          </button>

          <div
            className={cn(
              "grid transition-all duration-200 ease-in-out",
              isOptimizeExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="space-y-1 pl-2 mt-1">
                {/* Benchmarks button */}
                <button
                  onClick={onGoToBenchmarks}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                    optimizeView === "benchmarks" && !showChecklist
                      ? "gradient-accent text-white shadow-lg shadow-accent/20 dark:glow-accent"
                      : "bg-elevated text-secondary hover:bg-sunken cursor-pointer"
                  )}
                >
                  <MessageSquare className="w-4 h-4" />
                  Benchmarks
                </button>

                {/* Labeling button */}
                <button
                  onClick={onGoToLabeling}
                  disabled={!hasLabelingSession}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                    optimizeView === "labeling" && !showChecklist
                      ? "gradient-accent text-white shadow-lg shadow-accent/20 dark:glow-accent"
                      : hasLabelingSession
                      ? "bg-elevated text-secondary hover:bg-sunken cursor-pointer"
                      : "bg-elevated text-muted cursor-not-allowed opacity-60"
                  )}
                >
                  <Tag className="w-4 h-4" />
                  Labeling
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="mt-6 space-y-2">
        <hr className="border-default mb-3" />

        <Button
          variant="ghost"
          className="w-full justify-start text-secondary"
          onClick={onToggleChecklist}
        >
          <ClipboardCheck className="w-4 h-4 mr-2" />
          Checklist
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-muted hover:text-danger"
          onClick={onReset}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Start Over
        </Button>
      </div>
    </aside>
  )
}
