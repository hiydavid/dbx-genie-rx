/**
 * Main application component for the Genie Space Analyzer.
 */

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
import { FeedbackPage } from "@/components/FeedbackPage"
import { OptimizationPage } from "@/components/OptimizationPage"
import { PreviewPage } from "@/components/PreviewPage"
import { SettingsPage } from "@/components/SettingsPage"
import { ThemeToggle } from "@/components/ThemeToggle"

function App() {
  const { state, actions } = useAnalysis()
  useTheme() // Ensures theme is applied on mount

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
    if (state.optimizeView === "preview" && state.spaceData) {
      return (
        <PreviewPage
          currentConfig={state.spaceData}
          previewConfig={state.previewConfig}
          summary={state.previewSummary}
          isLoading={state.isGeneratingPreview}
          error={state.error}
          selectedCount={state.selectedSuggestions.size}
          onBack={actions.goToOptimization}
        />
      )
    }

    if (state.optimizeView === "optimization" && state.spaceData) {
      return (
        <OptimizationPage
          suggestions={state.optimizationSuggestions}
          summary={state.optimizationSummary}
          isLoading={state.isOptimizing}
          error={state.error}
          selectedSuggestions={state.selectedSuggestions}
          onBack={actions.goToFeedback}
          onToggleSuggestionSelection={actions.toggleSuggestionSelection}
          onSelectAllByPriority={actions.selectAllByPriority}
          onDeselectAllByPriority={actions.deselectAllByPriority}
          onCreateNewGenie={actions.generatePreviewConfig}
        />
      )
    }

    if (state.optimizeView === "feedback" && state.spaceData) {
      return (
        <FeedbackPage
          spaceData={state.spaceData}
          selectedQuestions={state.selectedQuestions}
          correctAnswers={state.labelingCorrectAnswers}
          feedbackTexts={state.labelingFeedbackTexts}
          onBack={actions.goToLabeling}
          onBeginOptimization={actions.startOptimization}
        />
      )
    }

    if (state.optimizeView === "labeling" && state.spaceData) {
      return (
        <LabelingPage
          genieSpaceId={state.genieSpaceId}
          spaceData={state.spaceData}
          selectedQuestions={state.selectedQuestions}
          // Lifted state
          currentIndex={state.labelingCurrentIndex}
          generatedSql={state.labelingGeneratedSql}
          genieResults={state.labelingGenieResults}
          expectedResults={state.labelingExpectedResults}
          correctAnswers={state.labelingCorrectAnswers}
          feedbackTexts={state.labelingFeedbackTexts}
          processingErrors={state.labelingProcessingErrors}
          // Actions
          onSetCurrentIndex={actions.setLabelingCurrentIndex}
          onSetCorrectAnswer={actions.setLabelingCorrectAnswer}
          onSetFeedbackText={actions.setLabelingFeedbackText}
          onBack={actions.goToBenchmarks}
          onFinish={actions.goToFeedback}
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
          // Processing state
          isProcessingBenchmarks={state.isProcessingBenchmarks}
          benchmarkProcessingProgress={state.benchmarkProcessingProgress}
          // Actions
          onProcessBenchmarksAndGoToLabeling={actions.processBenchmarksAndGoToLabeling}
          onCancelBenchmarkProcessing={actions.cancelBenchmarkProcessing}
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
            selectedSections={state.selectedSections}
            onToggleSectionSelection={actions.toggleSectionSelection}
            onSelectAllSections={actions.selectAllSections}
            onDeselectAllSections={actions.deselectAllSections}
            onAnalyzeAllSections={actions.analyzeAllSections}
            onGoToSection={actions.goToSection}
          />
        )

      case "analysis":
        return (
          <AnalysisPhase
            genieSpaceId={state.genieSpaceId}
            sections={state.sections}
            sectionAnalyses={state.sectionAnalyses}
            analysisViewIndex={state.analysisViewIndex}
            isLoading={state.isLoading}
            error={state.error}
            onAnalyzeSection={actions.analyzeCurrentSection}
            onSetAnalysisViewIndex={actions.setAnalysisViewIndex}
            onGoToSummary={actions.goToSummary}
          />
        )

      case "summary":
        return (
          <SummaryPhase
            genieSpaceId={state.genieSpaceId}
            sectionAnalyses={state.sectionAnalyses}
            selectedSections={state.selectedSections}
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
          hasAnalyzedSections={state.sectionAnalyses.some(a => a !== undefined)}
          analyzedCount={state.sectionAnalyses.filter(a => a !== undefined).length}
          allSectionsAnalyzed={state.allSectionsAnalyzed}
          showChecklist={state.showChecklist}
          showSettings={state.showSettings}
          hasLabelingSession={state.hasLabelingSession}
          hasOptimizationResults={state.optimizationSuggestions !== null}
          hasPreviewResults={state.previewConfig !== null}
          onGoToIngest={actions.goToIngest}
          onGoToAnalysis={actions.goToAnalysis}
          onGoToSummary={actions.goToSummary}
          onGoToBenchmarks={actions.goToBenchmarks}
          onGoToLabeling={actions.goToLabeling}
          onGoToFeedback={actions.goToFeedback}
          onGoToOptimization={actions.goToOptimization}
          onGoToPreview={actions.goToPreview}
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
