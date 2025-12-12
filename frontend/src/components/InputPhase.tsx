/**
 * Input phase component for entering Genie Space ID or pasting JSON.
 */

import { useState } from "react"
import { Search, FileJson, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface InputPhaseProps {
  onFetchSpace: (spaceId: string) => Promise<void>
  onParseJson: (jsonContent: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

export function InputPhase({
  onFetchSpace,
  onParseJson,
  isLoading,
  error,
}: InputPhaseProps) {
  const [spaceId, setSpaceId] = useState("")
  const [jsonContent, setJsonContent] = useState("")

  const handleFetch = async () => {
    if (spaceId.trim()) {
      await onFetchSpace(spaceId.trim())
    }
  }

  const handleParse = async () => {
    if (jsonContent.trim()) {
      await onParseJson(jsonContent.trim())
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-slate-900">
            Get Started
          </CardTitle>
          <CardDescription className="text-base">
            Enter your Genie Space ID or paste the JSON configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fetch" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="fetch">
                <Search className="w-4 h-4 mr-2" />
                Fetch by ID
              </TabsTrigger>
              <TabsTrigger value="paste">
                <FileJson className="w-4 h-4 mr-2" />
                Paste JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fetch">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="space-id"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Genie Space ID
                  </label>
                  <div className="flex gap-3">
                    <Input
                      id="space-id"
                      placeholder="e.g., 01f0627099691651968d0a92a26b06e9"
                      value={spaceId}
                      onChange={(e) => setSpaceId(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleFetch}
                      disabled={!spaceId.trim() || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Fetch
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-slate-500">
                  The unique identifier for your Databricks Genie Space. You can find
                  this in the Genie Space URL.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="paste">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="json-content"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Genie Space JSON
                  </label>
                  <Textarea
                    id="json-content"
                    placeholder='{"serialized_space": "{\\"config\\": {...}, \\"data_sources\\": {...}, ...}", ...}'
                    value={jsonContent}
                    onChange={(e) => setJsonContent(e.target.value)}
                    disabled={isLoading}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleParse}
                    disabled={!jsonContent.trim() || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <FileJson className="w-4 h-4 mr-2" />
                        Load JSON
                      </>
                    )}
                  </Button>
                </div>

                <details className="text-sm text-slate-600 cursor-pointer">
                  <summary className="font-medium hover:text-slate-900 transition-colors">
                    How to get the serialized JSON
                  </summary>
                  <pre className="mt-3 p-4 bg-slate-100 rounded-lg overflow-x-auto text-xs">
{`import requests

your_workspace_url = "https://your-workspace.cloud.databricks.com"
your_genie_space_id = ""

response = requests.get(
    f"{your_workspace_url}/api/2.0/genie/spaces/{your_genie_space_id}",
    headers={
        "Authorization": f"Bearer {token}",  # enter PAT token
        "Content-Type": "application/json",
    },
    params={
        "include_serialized_space": "true",
    },
)

response.json()`}
                  </pre>
                </details>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 flex items-start gap-2 p-4 bg-danger-light rounded-lg text-danger">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

