# Security Code Review Report

**Project:** GenieRX - Genie Space Analyzer
**Review Date:** 2026-01-17
**Reviewer:** Claude Code Security Review

---

## Executive Summary

This security review identified **17 findings** across the GenieRX codebase. The application is a web-based tool that analyzes Databricks Genie Space configurations using LLM-powered evaluation. Key security concerns include SQL injection risks, overly permissive CORS configuration, information disclosure through debug endpoints, and potential prompt injection vulnerabilities.

| Severity | Count |
|----------|-------|
| **Critical** | 2 |
| **High** | 4 |
| **Medium** | 6 |
| **Low** | 5 |

---

## Critical Findings

### 1. SQL Injection via Direct SQL Execution

**Location:** `agent_server/sql_executor.py:64`, `agent_server/api.py:303-319`

**Description:** The `/api/sql/execute` endpoint accepts arbitrary SQL from the frontend and executes it directly against the Databricks SQL Warehouse without any validation or sanitization.

```python
# sql_executor.py:64
response = client.statement_execution.execute_statement(
    warehouse_id=warehouse_id,
    statement=sql,  # User-provided SQL executed directly
    wait_timeout=WAIT_TIMEOUT,
    row_limit=row_limit,
)
```

**Risk:** An attacker could execute arbitrary SQL queries, potentially reading sensitive data, modifying data, or performing denial-of-service attacks against the warehouse.

**Recommendation:**
- Implement a SQL allowlist pattern for permitted query types (e.g., SELECT only)
- Add query parsing to reject dangerous operations (DROP, DELETE, UPDATE, INSERT, GRANT, etc.)
- Consider using parameterized queries where possible
- Add query complexity limits (prevent expensive CROSS JOINs, etc.)
- Rate limit SQL execution requests

---

### 2. Arbitrary Python Code Evaluation via `ast.literal_eval`

**Location:** `agent_server/api.py:140`

**Description:** The `/api/space/parse` endpoint uses `ast.literal_eval()` as a fallback when JSON parsing fails. While `literal_eval` is safer than `eval()`, it still poses risks.

```python
try:
    raw_response = json.loads(request.json_content)
except json.JSONDecodeError:
    raw_response = ast.literal_eval(request.json_content)  # Risky fallback
```

**Risk:** Although `ast.literal_eval` only evaluates Python literal structures, it can still cause denial-of-service through deeply nested structures or very large literals. It also accepts Python-specific syntax that may lead to unexpected behavior.

**Recommendation:**
- Remove the `ast.literal_eval` fallback entirely
- Require strict JSON input only
- If Python dict syntax must be supported, use a dedicated safe parser with size/depth limits

---

## High Severity Findings

### 3. Debug Endpoint Exposing Authentication Information

**Location:** `agent_server/api.py:262-300`

**Description:** The `/api/debug/auth` endpoint is publicly accessible and exposes sensitive authentication context including hostname, auth type, username, and partial client IDs.

```python
@router.get("/debug/auth")
async def debug_auth():
    # Exposes: host, auth_type, current_user, env_vars
    return {
        "running_on_databricks_apps": is_running_on_databricks_apps(),
        "host": client.config.host,
        "auth_type": client.config.auth_type,
        "current_user": user_info,
        "env_vars": {...}
    }
```

**Risk:** Information disclosure that aids attackers in reconnaissance. Reveals workspace URLs, authentication mechanisms, and user identities.

**Recommendation:**
- Remove this endpoint in production builds
- If needed for debugging, protect it with authentication and authorization
- Add environment-based conditional to disable in production

---

### 4. Overly Permissive CORS Configuration

**Location:** `agent_server/start_server.py:94-100`

**Description:** The CORS middleware is configured with `allow_methods=["*"]` and `allow_headers=["*"]`, which is overly permissive.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],  # Too permissive
    allow_headers=["*"],  # Too permissive
)
```

**Risk:** While origins are restricted, allowing all methods and headers increases attack surface. In production (Databricks Apps), CORS may not be properly configured at all.

**Recommendation:**
- Explicitly list allowed methods: `["GET", "POST", "OPTIONS"]`
- Explicitly list required headers: `["Content-Type", "Authorization"]`
- Add production CORS configuration for Databricks Apps deployment
- Consider environment-based CORS settings

---

### 5. No Authentication/Authorization on API Endpoints

**Location:** `agent_server/api.py` (all endpoints)

**Description:** All API endpoints are publicly accessible without authentication checks. The application relies solely on Databricks SDK's OBO (on-behalf-of) authentication for backend API calls, but the FastAPI endpoints themselves have no auth middleware.

**Risk:**
- In local development, anyone with network access can use the application
- No rate limiting means API abuse is possible
- No authorization means no access control granularity

**Recommendation:**
- Add authentication middleware for all `/api/*` routes
- Implement session management or token validation
- Add rate limiting (e.g., using `slowapi`)
- Consider adding role-based access control for sensitive operations

---

### 6. LLM Prompt Injection Vulnerability

**Location:** `agent_server/prompts.py:21-57`, `agent_server/prompts.py:60-124`, `agent_server/prompts.py:127-218`

**Description:** User-provided data (Genie Space configurations, labeling feedback) is directly interpolated into LLM prompts without sanitization.

```python
# prompts.py:29-31
## Data to Analyze:
```json
{json.dumps(section_data, indent=2)}  # User data directly in prompt
```

**Risk:** Malicious data in Genie Space configurations could manipulate LLM behavior, potentially causing:
- Information disclosure from the LLM's training data
- Generation of malicious output
- Bypassing intended analysis logic

**Recommendation:**
- Implement input validation and sanitization for configuration data
- Consider using prompt templating that separates instructions from data
- Add output validation to detect anomalous LLM responses
- Consider sandboxing or filtering the LLM output

---

## Medium Severity Findings

### 7. Path Traversal Risk in Output File Writing

**Location:** `agent_server/agent.py:593-596`

**Description:** The `save_analysis_output` function uses the `genie_space_id` directly in the filename without sanitization.

```python
def save_analysis_output(output: AgentOutput) -> Path:
    OUTPUT_DIR.mkdir(exist_ok=True)
    filepath = OUTPUT_DIR / f"analysis_{output.genie_space_id}.md"
    # If genie_space_id contains "../", could write outside OUTPUT_DIR
```

**Risk:** A malicious `genie_space_id` containing path traversal characters (`../`) could write files outside the intended output directory.

**Recommendation:**
- Sanitize `genie_space_id` to remove path traversal characters
- Use `pathlib.Path.resolve()` and verify the result is within `OUTPUT_DIR`
- Example: `if not filepath.resolve().is_relative_to(OUTPUT_DIR.resolve()): raise`

---

### 8. Verbose Error Messages Leak Internal Information

**Location:** Multiple files - `api.py:123`, `api.py:178`, `api.py:193`, `api.py:242`, `api.py:319`, `api.py:363`, `ingest.py:63`, `sql_executor.py:119`

**Description:** Exception messages are directly returned to clients via `str(e)`, potentially leaking internal paths, configurations, or system details.

```python
except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))  # Leaks error details
```

**Risk:** Attackers can use detailed error messages to understand system internals and craft more targeted attacks.

**Recommendation:**
- Log detailed errors server-side
- Return generic error messages to clients: "An error occurred processing your request"
- Create an error classification system that maps internal errors to safe client messages

---

### 9. No Input Validation on Genie Space IDs

**Location:** `agent_server/api.py:98-123`, `agent_server/ingest.py:41-63`

**Description:** The `genie_space_id` is accepted and used without format validation.

```python
class FetchSpaceRequest(BaseModel):
    genie_space_id: str  # No validation pattern
```

**Risk:** Invalid or malicious IDs could cause unexpected behavior in downstream Databricks API calls or be used for injection attacks.

**Recommendation:**
- Add Pydantic field validation with a regex pattern
- Example: `genie_space_id: str = Field(..., pattern=r"^[a-f0-9]{32}$")`
- Validate ID format before making API calls

---

### 10. Sensitive Information in Application Logs

**Location:** `agent_server/auth.py:52-66`, `agent_server/ingest.py:49-52`

**Description:** Authentication and configuration details are logged, which could expose sensitive information if logs are accessible.

```python
# auth.py:64
if "CLIENT_ID" in var:
    logger.info(f"  {var}: {val[:8]}...")  # Partial secrets logged
```

**Risk:** If log files are compromised or accidentally exposed, sensitive authentication context could be revealed.

**Recommendation:**
- Remove or mask sensitive values in logs
- Use structured logging with sensitive field filtering
- Set appropriate log levels (DEBUG for auth details, not INFO)

---

### 11. No CSRF Protection on State-Changing Endpoints

**Location:** `agent_server/api.py` (all POST endpoints)

**Description:** POST endpoints that modify state or trigger actions lack CSRF protection tokens.

**Risk:** Cross-site request forgery attacks could trick authenticated users into performing unintended actions.

**Recommendation:**
- Implement CSRF token validation for state-changing endpoints
- Use the `SameSite` cookie attribute
- Consider using double-submit cookie pattern

---

### 12. Server-Sent Events Stream Without Per-Message Validation

**Location:** `agent_server/api.py:196-220`, `agent_server/start_server.py:140-161`

**Description:** The SSE streaming endpoints maintain long-lived connections without validating authentication state on each message.

**Risk:** If authentication is revoked during a streaming session, the stream continues. Token refresh/revocation is not checked.

**Recommendation:**
- Implement periodic authentication validation during long-running streams
- Add timeout limits on streaming connections
- Validate authentication on connection and periodically during stream

---

## Low Severity Findings

### 13. Missing Security Headers

**Location:** `agent_server/start_server.py`

**Description:** The FastAPI application does not set security headers such as `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, or `Strict-Transport-Security`.

**Recommendation:**
- Add security headers middleware:
```python
from starlette.middleware import Middleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

# Add headers via middleware or response hooks
```

---

### 14. Frontend API Client Lacks Request Timeout

**Location:** `frontend/src/lib/api.ts` (all fetch calls)

**Description:** Frontend API calls use `fetch()` without timeout configuration, which could lead to hung connections.

```typescript
const response = await fetch(`${API_BASE}/space/fetch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ genie_space_id: genieSpaceId }),
    // No timeout/AbortController for regular requests
})
```

**Recommendation:**
- Add `AbortController` with timeouts for all non-streaming requests
- Handle timeout errors gracefully in the UI

---

### 15. Hardcoded Development Configuration

**Location:** `agent_server/start_server.py:96`, `.env.example:14`

**Description:** Development-specific configurations (localhost CORS origins, example tokens) are hardcoded and could accidentally be deployed.

**Recommendation:**
- Use environment-based configuration for all environment-specific values
- Add deployment validation to ensure dev configs aren't in production
- Remove or comment out example credentials in templates

---

### 16. Dependency Version Pinning Inconsistency

**Location:** `pyproject.toml`, `requirements.txt`

**Description:** While `requirements.txt` has pinned versions, `pyproject.toml` uses loose version ranges (e.g., `>=0.38.0`), which could lead to installing vulnerable versions.

**Recommendation:**
- Use consistent version pinning strategy
- Regularly audit dependencies for known vulnerabilities
- Consider using tools like `pip-audit` or `safety` in CI/CD

---

### 17. Static Files Served Without Cache Headers

**Location:** `agent_server/start_server.py:108-125`

**Description:** Static frontend files are served without cache control headers, and the fallback to `index.html` for all paths could cause caching issues.

**Recommendation:**
- Add appropriate `Cache-Control` headers for static assets
- Use content hashing in filenames for cache busting
- Ensure HTML files are not cached or have short cache times

---

## Recommendations Summary

### Immediate Actions (Critical/High)
1. Implement SQL query validation/allowlisting for the execute endpoint
2. Remove `ast.literal_eval` fallback, require strict JSON
3. Disable or protect `/api/debug/auth` endpoint
4. Add authentication middleware to API routes
5. Restrict CORS methods and headers

### Short-term Improvements (Medium)
6. Add input validation patterns for all user-provided IDs
7. Sanitize file paths to prevent directory traversal
8. Implement generic error messages for clients
9. Add CSRF protection
10. Review and sanitize logging output

### Long-term Enhancements (Low)
11. Add security headers middleware
12. Implement request timeouts in frontend
13. Add automated dependency vulnerability scanning
14. Consider prompt injection mitigations for LLM calls

---

## Security Testing Recommendations

1. **Penetration Testing**: Conduct SQL injection testing on the `/api/sql/execute` endpoint
2. **API Fuzzing**: Fuzz test all endpoints with malformed inputs
3. **Authentication Testing**: Verify behavior when tokens expire mid-session
4. **CORS Validation**: Test cross-origin requests from unauthorized domains
5. **Prompt Injection Testing**: Test LLM prompts with adversarial inputs

---

## Conclusion

The GenieRX application has several security concerns that should be addressed before production deployment. The most critical issues relate to SQL execution without validation and the use of `ast.literal_eval`. The application's reliance on Databricks OBO authentication provides some protection, but the API layer itself lacks proper authentication and authorization controls.

Addressing the critical and high-severity findings should be prioritized before deploying this application to production environments with sensitive data access.
