---
trigger: manual
---

# Task: Fix Data Not Persisting After Page Refresh

## Problem Description
When saving data in the web application, the UI shows a "Success" message/notification, but after refreshing the page, the saved data disappears or is not reflected in the system.

## Objective
Analyze the codebase, identify the root cause of the data persistence failure, and implement a complete fix to ensure data is properly saved to the database and correctly reloaded when the page is refreshed.

---

## Analysis & Diagnostic Workflow
Please inspect the codebase in the following order:

### 1. Frontend Verification
- Check the submit/save handler for the form/action in question.
- Ensure an actual HTTP request (POST/PUT/PATCH) is sent to the backend API.
- Verify that the "Success" UI notification is triggered **ONLY AFTER** receiving a successful response (`200 OK` / `201 Created`) from the server, not optimistically without waiting for the API.
- Check if the page-reload / data-fetch logic on page load is calling the correct GET API endpoint to fetch the latest state.

### 2. Backend & API Controller Inspection
- Trace the API endpoint handling the save action.
- Verify that the handler receives the payload, validates it, and performs a real Database operation (INSERT / UPDATE / Save).
- Check if DB Transactions are used:
  - If a transaction is opened (`BEGIN TRANSACTION`), ensure `COMMIT` is called before returning a success response.
  - Check `catch` / error-handling blocks to ensure errors are not swallowed silently or causing unexpected rollbacks.
- Check if ORM or Query execution is missing a final save command (e.g., missing `.save()`, `.SaveChanges()`, or `commit()`).

### 3. Database Connection & Caching
- Verify that the READ (GET) and WRITE (POST/PUT) queries target the same Database connection / environment.
- Check for HTTP or API caching (e.g., Cache-Control headers) that might be returning stale GET responses after refresh.

---

## Instructions for Antigravity AI
1. Search and locate the relevant files for:
   - The UI Component / Form handling the save action.
   - The API Route / Controller receiving the save request.
   - The Service / Repository / Database layer performing the DB query.
   - The GET endpoint / Component logic fetching the data on page load.
2. Identify the exact failure point.
3. Apply the necessary code fixes.
4. Verify the fix and explain the root cause and solution in summary.