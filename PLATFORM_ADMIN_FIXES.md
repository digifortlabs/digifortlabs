# Platform Admin — Bug Fixes & Permanent Delete Feature

**Date:** 2026-05-19
**Scope:** Platform Admin (`admin.localhost:3000`) — Manage Clients page, sidebar navigation, and Recycle Bin permanent-delete capability.

---

## 1. Summary

Three bugs were fixed and one feature was added:

| # | Item | Type | Status |
|---|------|------|--------|
| 1 | Overview link jumped to `dashboard.localhost` | Bug | Fixed |
| 2 | "NO CLIENTS FOUND" — client list always empty | Bug | Fixed |
| 3 | Permanent delete in Recycle Bin | Feature | Added |
| 4 | "Delete Forever" button stayed disabled | Bug | Fixed |

The live database (AWS EC2 PostgreSQL, SSH tunnel `localhost:5433` → `digifort_db`) contains real production data. Every change was validated **without** mutating production rows (read-only dry runs, rolled-back transactions, isolated test clients).

---

## 2. Bug #1 — Overview link redirected to `dashboard.localhost`

### Symptom
Clicking **Overview** in the sidebar while on `admin.localhost:3000` navigated to `dashboard.localhost:3000` (a non-existent tenant → landing page).

### Root cause
`Sidebar.tsx` computed:

```ts
const dashboardSubdomain = hospitalSlug || 'dashboard';
```

For a platform admin there is no `hospitalSlug` (it is excluded in `dashboard/layout.tsx`), so it fell back to the literal string `'dashboard'`. `getDomainUrl('dashboard', '')` then produced `http://dashboard.localhost:3000`, a different subdomain that the proxy treats as the landing page.

### Fix — `frontend/src/components/Sidebar.tsx`

```ts
// before
const dashboardSubdomain = hospitalSlug || 'dashboard';
// after
const dashboardSubdomain = hospitalSlug || null;
```

```tsx
// before
href={getDomainUrl(dashboardSubdomain, '')}
// after
href={getDomainUrl(dashboardSubdomain, '/') || '/'}
```

`getDomainUrl(null, path)` returns the **relative** path, so admin links stay on the current subdomain (`admin.localhost:3000`) and the proxy rewrites them to `/dashboard/...` correctly. Hospital users (with a slug) are unaffected.

---

## 3. Bug #2 — "NO CLIENTS FOUND" (client list always empty)

### Symptom
Manage Clients showed **"NO CLIENTS FOUND"** even though the stat cards correctly showed "4 Active". The database had valid hospitals.

### Investigation (key clue)
- Stats endpoint `/api/hospitals/stats/platform` **worked** ("4 Active").
- List endpoint `/api/hospitals/?include_deleted=false` returned an empty list.
- The only difference: the list URL has a **trailing slash before `?`**.

Backend was proven correct in isolation — a direct `TestClient` request returned `200` with all 4 hospitals serialized fine.

### Root cause — a double-redirect chain that drops the auth cookie

1. Browser `fetch('/api/hospitals/?include_deleted=false')`.
2. **Next.js** (`trailingSlash: false` default) issues a **308** redirect, stripping the slash → `/api/hospitals?include_deleted=false`.
3. Proxied (rewrite `/api/:path*` → `localhost:8000/:path*`) to backend `/hospitals` (**no slash**).
4. **FastAPI** route was `@router.get("/")` (canonical `/hospitals/`), so it issues a **307** redirect to the **absolute** URL `http://localhost:8000/hospitals/?include_deleted=false`.
5. The browser is on `admin.localhost:3000`; following a redirect to `localhost:8000` is **cross-origin** → the auth cookie is not sent → request fails → `listRes.ok` is `false` → `setHospitals` is never called → empty list.

The stats endpoint had no trailing slash, so it never entered this chain — which is exactly why stats worked while the list did not.

### Fixes

Several layered fixes; the **last two** are the decisive ones.

**a) `backend/app/routers/hospitals.py` — `HospitalResponse` schema alignment**
- `hospital_type` → `organization_type` (model/DB use `organization_type`; mismatched field caused 500s on serialization).
- Added `is_deleted: bool = False` so the Recycle Bin tab can identify soft-deleted records.

**b) `frontend/src/app/dashboard/hospitals/page.tsx` — interface + filter null-safety**
- `Hospital` interface: `hospital_type?` → `organization_type?`.
- Filter hardened against `null`/`undefined`:
  - `h.is_active === false` (suspended)
  - `!!h.pending_updates` (pending)
  - `h.is_active !== false` (active)

**c) `frontend/next.config.mjs` — stop Next.js stripping the trailing slash**

```js
skipTrailingSlashRedirect: true,
```

This stops Next.js's own 308. (It does not stop the rewrite itself from normalizing the path, hence fix **d**.)

**d) `backend/app/routers/hospitals.py` — serve both slash variants directly (THE fix)**

Added empty-path route aliases so FastAPI serves **both** `/hospitals` and `/hospitals/` directly with `200` — **no 307 redirect at all**, regardless of how the proxy normalizes the path:

```python
@router.get("", response_model=List[HospitalResponse], include_in_schema=False)
@router.get("/", response_model=List[HospitalResponse])
def list_hospitals(...): ...

@router.post("", response_model=HospitalResponse, include_in_schema=False)
@router.post("/", response_model=HospitalResponse)
def create_hospital(...): ...
```

This also fixes the 6 other pages that call `/hospitals/` (HospitalLedgerList, InvoiceGenerationModal, GlobalHospitalSelector, reports, appointments, RecordManager).

### Verification
- Direct `TestClient`: `GET /hospitals/?include_deleted=false` → `200`, 4 hospitals.
- Both `/hospitals` and `/hospitals/` → `200`, `count=4`, **no redirect**.
- Backend runs with `uvicorn --reload` (auto-applied). Next.js config change required a dev-server restart (since applied).

---

## 4. Feature #3 — Permanent Delete in Recycle Bin

### Goal
Allow a platform admin to **permanently** purge a soft-deleted hospital and its entire data subtree.

### Constraints discovered
- **29** foreign-key constraints reference `hospitals`; **0** have `ON DELETE CASCADE`. A direct delete fails with FK violations.
- A hospital's full transitive subtree spans **54 tables** (patients, files, invoices, appointments, staff, dental/ENT/pharma/legal records, etc.).
- Production data — must be atomic and irreversible-by-design with a strong confirmation.

### Backend — `backend/app/routers/hospitals.py`

**`_purge_hospital_cascade(db, hospital_id)`** — runtime FK-graph topological cascade:

1. Reads the live FK graph and primary keys from `information_schema` (so it stays correct as the schema evolves — no hand-maintained table list to rot).
2. **BFS** from the hospital row, collecting the exact set of PK values to delete in every dependent table (resolves non-PK FK targets and handles multiple FK paths via set union).
3. **Topological sort** so a table is only deleted after every table that references it (children before parents). Cyclic leftovers are appended and resolved.
4. Deletes bottom-up, **chunked (5000)**, all inside the caller's transaction.
5. **Fails loud** if any involved table lacks a single-column PK → caller rolls back → **no partial purge**.

**`DELETE /hospitals/{hospital_id}/permanent`**:
- **Safety gate:** returns `400` unless the hospital is already soft-deleted (`is_deleted == True`) — you cannot purge an active client directly.
- Runs the cascade in one transaction; **any error → full rollback**.
- Audit-logged as `HOSPITAL_PURGED` with `hospital_id=None` (platform-scoped, so the audit row is **not** part of the purged subtree and survives the commit).
- CSRF-protected (same as all mutative endpoints).

### Frontend — `frontend/src/app/dashboard/hospitals/page.tsx`
- Red **"Delete Permanently"** button next to **Restore**, shown **only in the Bin Recycle tab**.
- **Type-the-exact-hospital-name** confirmation modal; "Delete Forever" stays disabled until the typed name matches. Spinner while purging, inline error display, auto-refreshes on success.
- New state: `purgeTarget`, `purgeConfirmText`, `purgeBusy`, `purgeError`; handler `handlePermanentDelete`.

### Verification (no production data touched)
- Read-only dry run against test hospital: **54 tables** in subtree, **all single-column PKs**, **no cycles**, correct delete order (leaf tables first, `hospitals` last), 96 rows total — **0 DELETEs executed, rolled back**.
- Safety gate: route registered, CSRF-enforced, active hospital rejected, row still present.

### Workflow
1. Suspend a client → it moves to **Bin Recycle** (soft delete).
2. In the Bin tab → **Delete Permanently** → type the hospital's exact name → **Delete Forever**.

---

## 5. Bug #4 — "Delete Forever" stayed disabled

### Symptom
Typing the hospital name did not enable the **Delete Forever** button.

### Root causes (two)
1. The confirmation label had a CSS `uppercase` transform, so the name was **displayed** uppercased regardless of its real casing — the user typed what they saw, which did not match the stored value.
2. The Recycle-Bin hospital's stored name was **`'TEST HOSPITAL '`** — with a **trailing space** (id=15). The strict `!==` comparison failed against the typed `TEST HOSPITAL`.

### Fix — `frontend/src/app/dashboard/hospitals/page.tsx`
- Name span set to `normal-case` so the modal shows the **true casing** to type.
- Comparison changed to **trim + case-insensitive** in both the submit guard and the button `disabled` prop:

```ts
purgeConfirmText.trim().toLowerCase() !== purgeTarget.legal_name.trim().toLowerCase()
```

Still requires the full hospital name — remains a strong gate — but trailing whitespace / casing no longer blocks a genuine confirmation.

---

## 6. Live Database Facts (as of 2026-05-19)

- **Host:** AWS EC2 PostgreSQL, SSH tunnel `localhost:5433` → `digifort_db`.
- **Hospitals:**

| id | legal_name | state |
|----|------------|-------|
| 1 | `Dixit Hospital` | active |
| 7 | `Shivam Dental Care` | active |
| 9 | `Adarsh Dental Care` | active |
| 14 | `Dome` | active |
| 15 | `TEST HOSPITAL ` (trailing space) | Recycle Bin (soft-deleted) |

- `hospitals` uses column `organization_type` (NOT `hospital_type`).
- 29 FK constraints → `hospitals`, none with `ON DELETE CASCADE`.
- A hospital's full dependency subtree = **54 tables**.

### Optional cleanup (not applied — requires a production write)
`hospitals.legal_name` for id=15 has a stray trailing space (`'TEST HOSPITAL '`). The frontend fix already handles this, so no action is required. If a tidy value is desired:

```sql
UPDATE hospitals SET legal_name = TRIM(legal_name)
WHERE hospital_id = 15 AND legal_name <> TRIM(legal_name);
```

---

## 7. Files Changed

| File | Change |
|------|--------|
| `frontend/src/components/Sidebar.tsx` | `dashboardSubdomain` fallback `null` (not `'dashboard'`); Overview href → `/` |
| `frontend/next.config.mjs` | `skipTrailingSlashRedirect: true` |
| `backend/app/routers/hospitals.py` | `HospitalResponse`: `organization_type` + `is_deleted`; empty-path route aliases for list/create; `text, bindparam` import; `_purge_hospital_cascade()`; `DELETE /hospitals/{id}/permanent` |
| `frontend/src/app/dashboard/hospitals/page.tsx` | Interface `organization_type`; filter null-safety; purge state/handler/button/modal; modal `normal-case`; trim+case-insensitive confirmation |

No database migrations were run. No production rows were modified.

---

## 8. Operational Notes

- **Backend** auto-reloads (`uvicorn --reload`) — code changes are live.
- **`next.config.mjs`** changes require a **Next.js dev-server restart** (already done).
- **React/TSX** changes hot-reload — refresh the browser (reopen modals to pick up modal fixes).
- All temporary diagnostic scripts created during investigation were removed; the repo's existing utilities (`check_schema.py`, `add_missing_columns.py`) were left intact.
