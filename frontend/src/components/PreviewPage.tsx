/**
 * PreviewPage component displaying side-by-side JSON diff of config changes.
 */

import { ArrowLeft, Loader2, Sparkles, AlertTriangle } from "lucide-react"
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTheme } from "@/hooks/useTheme"

interface PreviewPageProps {
  currentConfig: Record<string, unknown> | null
  previewConfig: Record<string, unknown> | null
  summary: string | null
  isLoading: boolean
  error: string | null
  selectedCount: number
  onBack: () => void
}

export function PreviewPage({
  currentConfig,
  previewConfig,
  summary,
  isLoading,
  error,
  selectedCount,
  onBack,
}: PreviewPageProps) {
  const { isDark } = useTheme()

  // Custom styles matching the design system (from SqlDiffView.tsx)
  const customStyles = {
    variables: {
      light: {
        diffViewerBackground: "#FFFFFF",
        diffViewerColor: "#0F172A",
        addedBackground: "#ECFDF5",
        addedColor: "#065F46",
        removedBackground: "#FEF2F2",
        removedColor: "#991B1B",
        wordAddedBackground: "#D1FAE5",
        wordRemovedBackground: "#FECACA",
        addedGutterBackground: "#D1FAE5",
        removedGutterBackground: "#FECACA",
        gutterBackground: "#F8FAFC",
        gutterBackgroundDark: "#F1F5F9",
        gutterColor: "#64748B",
        highlightBackground: "#FEF9C3",
        highlightGutterBackground: "#FEF08A",
        codeFoldGutterBackground: "#E2E8F0",
        codeFoldBackground: "#F1F5F9",
        codeFoldContentColor: "#475569",
        emptyLineBackground: "#F8FAFC",
      },
      dark: {
        diffViewerBackground: "#1E293B",
        diffViewerColor: "#F1F5F9",
        addedBackground: "#064E3B",
        addedColor: "#A7F3D0",
        removedBackground: "#7F1D1D",
        removedColor: "#FECACA",
        wordAddedBackground: "#065F46",
        wordRemovedBackground: "#991B1B",
        addedGutterBackground: "#064E3B",
        removedGutterBackground: "#7F1D1D",
        gutterBackground: "#0F172A",
        gutterBackgroundDark: "#1E293B",
        gutterColor: "#94A3B8",
        highlightBackground: "#713F12",
        highlightGutterBackground: "#854D0E",
        codeFoldGutterBackground: "#334155",
        codeFoldBackground: "#1E293B",
        codeFoldContentColor: "#94A3B8",
        emptyLineBackground: "#0F172A",
      },
    },
    contentText: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "13px",
      lineHeight: "1.6",
    },
    gutter: {
      minWidth: "40px",
      padding: "0 8px",
    },
    line: {
      padding: "2px 8px",
    },
  }

  const currentJson = currentConfig ? JSON.stringify(currentConfig, null, 2) : ""
  const previewJson = previewConfig ? JSON.stringify(previewConfig, null, 2) : ""

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">
            Configuration Preview
          </h1>
          <p className="text-muted">
            {isLoading
              ? "Generating merged configuration..."
              : `Preview of ${selectedCount} applied suggestion${selectedCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Suggestions
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="py-12 flex flex-col items-center justify-center gap-4">
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-accent animate-spin" />
              <Sparkles className="w-5 h-5 text-accent absolute animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-primary">
                Merging configuration changes
              </p>
              <p className="text-sm text-muted mt-1">
                AI is applying your selected suggestions to create the new configuration...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <Card className="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
          <CardContent className="py-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">
                Failed to generate preview
              </p>
              <p className="text-sm text-red-600 dark:text-red-500 mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary card */}
      {summary && !isLoading && (
        <Card className="border-accent/30 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-primary mb-1">Changes Applied</p>
                <p className="text-secondary text-sm">{summary}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diff viewer */}
      {previewConfig && !isLoading && (
        <div className="rounded-lg overflow-hidden border border-default">
          <div className="flex border-b border-default">
            <div className="flex-1 px-4 py-2 bg-elevated text-sm font-medium text-secondary">
              Current Configuration
            </div>
            <div className="flex-1 px-4 py-2 bg-elevated text-sm font-medium text-secondary border-l border-default">
              New Configuration
            </div>
          </div>
          <ReactDiffViewer
            oldValue={currentJson}
            newValue={previewJson}
            splitView={true}
            useDarkTheme={isDark}
            compareMethod={DiffMethod.WORDS}
            styles={customStyles}
            hideLineNumbers={false}
            showDiffOnly={false}
          />
        </div>
      )}
    </div>
  )
}
