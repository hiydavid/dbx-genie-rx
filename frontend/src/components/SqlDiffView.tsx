/**
 * Side-by-side SQL diff view comparing generated SQL vs expected SQL.
 */

import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued"
import { useTheme } from "@/hooks/useTheme"

interface SqlDiffViewProps {
  generatedSql: string
  expectedSql: string
}

export function SqlDiffView({ generatedSql, expectedSql }: SqlDiffViewProps) {
  const { isDark } = useTheme()

  // Custom styles matching the design system
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

  return (
    <div className="rounded-lg overflow-hidden border border-default">
      <div className="flex border-b border-default">
        <div className="flex-1 px-4 py-2 bg-elevated text-sm font-medium text-secondary">
          Generated SQL (Genie)
        </div>
        <div className="flex-1 px-4 py-2 bg-elevated text-sm font-medium text-secondary border-l border-default">
          Expected SQL (Benchmark)
        </div>
      </div>
      <ReactDiffViewer
        oldValue={generatedSql}
        newValue={expectedSql}
        splitView={true}
        useDarkTheme={isDark}
        compareMethod={DiffMethod.WORDS}
        styles={customStyles}
        hideLineNumbers={false}
        showDiffOnly={false}
      />
    </div>
  )
}
