/**
 * Main application component for the Genie Space Analyzer.
 */

import { useEffect } from "react"
import { Sparkles } from "lucide-react"
import { useAnalysis } from "@/hooks/useAnalysis"
import { useTheme } from "@/hooks/useTheme"
import { SidebarNav } from "@/components/SidebarNav"
import { InputPhase } from "@/components/InputPhase"
import { IngestPhase } from "@/components/IngestPhase"
import { AnalysisPhase } from "@/components/AnalysisPhase"
import { SummaryPhase } from "@/components/SummaryPhase"
import { ChecklistPage } from "@/components/ChecklistPage"
import { BenchmarksPage } from "@/components/BenchmarksPage"
import { LabelingPage } from "@/components/LabelingPage"
import { SettingsPage } from "@/components/SettingsPage"
import { ThemeToggle } from "@/components/ThemeToggle"

function App() {
  const { state, actions } = useAnalysis()
  const { resolvedTheme } = useTheme()

  // Initialize theme on mount (ensures dark class is applied)
  useEffect(() => {
    // Theme hook handles this automatically
  }, [resolvedTheme])

  const renderPhase = () => {
    if (state.showSettings) {
      return (
        <SettingsPage
          onBack={actions.toggleSettings}
          currentGenieSpaceId={state.genieSpaceId}
        />
      )
    }

    if (state.showChecklist) {
      return <ChecklistPage onBack={actions.toggleChecklist} />
    }

    // Handle optimize views
    if (state.optimizeView === "labeling" && state.spaceData) {
      return (
        <LabelingPage
          genieSpaceId={state.genieSpaceId}
          spaceData={state.spaceData}
          selectedQuestions={state.selectedQuestions}
          onBack={actions.goToBenchmarks}
        />
      )
    }

    if (state.optimizeView === "benchmarks" && state.spaceData) {
      return (
        <BenchmarksPage
          genieSpaceId={state.genieSpaceId}
          spaceData={state.spaceData}
          selectedQuestions={state.selectedQuestions}
          onToggleSelection={actions.toggleQuestionSelection}
          onSelectAll={actions.selectAllQuestions}
          onDeselectAll={actions.deselectAllQuestions}
          onBeginLabeling={actions.goToLabeling}
        />
      )
    }

    switch (state.phase) {
      case "input":
        return (
          <InputPhase
            spaceData={state.spaceData}
            onSelectMode={actions.setMode}
            onClearSpaceData={actions.clearSpaceData}
            onFetchSpace={actions.handleFetchSpace}
            onParseJson={actions.handleParseJson}
            isLoading={state.isLoading}
            error={state.error}
          />
        )

      case "ingest":
        return (
          <IngestPhase
            genieSpaceId={state.genieSpaceId}
            spaceData={state.spaceData!}
            sections={state.sections}
            sectionAnalyses={state.sectionAnalyses}
            isLoading={state.isLoading}
            analysisProgress={state.analysisProgress}
            analyzingSection={state.analyzingSection}
            onAnalyzeAllSections={actions.analyzeAllSections}
            onAnalyzeSingleSection={actions.analyzeSingleSection}
            onGoToSection={actions.goToSection}
          />
        )

      case "analysis":
        return (
          <AnalysisPhase
            genieSpaceId={state.genieSpaceId}
            sections={state.sections}
            currentSectionIndex={state.currentSectionIndex}
            sectionAnalyses={state.sectionAnalyses}
            allSectionsAnalyzed={state.allSectionsAnalyzed}
            isLoading={state.isLoading}
            error={state.error}
            onAnalyzeSection={actions.analyzeCurrentSection}
            onPrevSection={actions.prevSection}
            onNextSection={actions.nextSection}
            onGoToSummary={actions.goToSummary}
          />
        )

      case "summary":
        return (
          <SummaryPhase
            genieSpaceId={state.genieSpaceId}
            sectionAnalyses={state.sectionAnalyses}
            expandedSections={state.expandedSections}
            onToggleSection={actions.toggleSectionExpanded}
            onExpandAll={actions.expandAllSections}
            onCollapseAll={actions.collapseAllSections}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-pattern flex">
      {/* Sidebar */}
      {state.phase !== "input" && (
        <SidebarNav
          phase={state.phase}
          optimizeView={state.optimizeView}
          sections={state.sections}
          currentSectionIndex={state.currentSectionIndex}
          sectionAnalyses={state.sectionAnalyses}
          allSectionsAnalyzed={state.allSectionsAnalyzed}
          showChecklist={state.showChecklist}
          showSettings={state.showSettings}
          hasLabelingSession={state.hasLabelingSession}
          onGoToIngest={actions.goToIngest}
          onGoToSection={actions.goToSection}
          onGoToSummary={actions.goToSummary}
          onGoToBenchmarks={actions.goToBenchmarks}
          onGoToLabeling={actions.goToLabeling}
          onToggleChecklist={actions.toggleChecklist}
          onToggleSettings={actions.toggleSettings}
          onReset={actions.reset}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="relative overflow-hidden border-b border-default bg-surface">
          {/* Gradient overlay */}
          <div className="absolute inset-0 gradient-header" />

          <div className="relative flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              {/* Logo icon */}
              <div className="relative">
                <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-accent/20 dark:shadow-accent/10 dark:glow-accent">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                {/* Subtle glow ring */}
                <div className="absolute inset-0 rounded-xl opacity-0 dark:opacity-50 animate-pulse-glow pointer-events-none" />
              </div>

              <div>
                <h1 className="text-xl font-display font-bold tracking-tight text-primary">
                  Genie<span className="text-accent">Rx</span>
                </h1>
                <p className="text-sm text-muted">
                  Analyze and Optimize Genie Configuration
                </p>
              </div>
            </div>

            {/* Right side: Theme toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">{renderPhase()}</div>
      </main>
    </div>
  )
}

export default App
