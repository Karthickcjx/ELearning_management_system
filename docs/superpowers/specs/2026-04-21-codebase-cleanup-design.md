# LMS Codebase Cleanup — Design Spec

**Date:** 2026-04-21
**Scope:** B (Medium) — delete junk, fix gitignore, restructure backend + frontend, reorganize docs
**Branch:** `cleanup/restructure-b`

## Goals

- Remove accumulated junk (log dumps, diff dumps, stub files, committed build artifacts)
- Enforce consistent naming conventions
- Convert backend from mixed layered/modular to feature-sliced packages
- Normalize frontend folder casing to lowercase-kebab
- Update `.gitignore` to prevent regression

## Non-Goals

- No behavioral code changes
- No dependency upgrades
- No new tests
- No refactoring within feature modules (AI + Room stay internally as-is)
- No commit history rewrite (existing tracked big files removed going forward only)

## Section 1 — Root Junk Removal

Delete from repo root:

| File | Size | Reason |
|------|------|--------|
| `files.txt` | 656b | Ephemeral dump |
| `git-log.txt` | 43K | Log export artifact |
| `git-log-utf8.txt` | 24K | Duplicate of above |
| `room-diff.txt` | 12K | Diff dump artifact |
| `room-diff-utf8.txt` | 8K | Duplicate |
| `models.json` | 4K | Artifact (AI model list dump) |
| `models_full.json` | 24K | Duplicate with more detail |
| `requirement.txt` | 3K | Typo + not needed (Java/JS project) |
| `package-lock.json` (root) | 112b | Empty stub — real one lives in `frontend/` |
| `LICENSE` | 2b | Empty — replace with real MIT license |
| `test-results/` | dir | Playwright artifact — should be gitignored |

## Section 2 — .gitignore Hardening

Append to `.gitignore`:

```gitignore
# Build artifacts
frontend/build/
frontend/dist/
backend/target/

# IDE
.idea/
.vscode/
*.iml

# Test artifacts
test-results/
playwright-report/

# Node
node_modules/

# Env/secrets
.env
.env.local
backend/.env
frontend/.env

# OS
.DS_Store
Thumbs.db

# Logs
*.log
```

Untrack from git (keep on disk):
- `frontend/build/`
- `.idea/`
- `.vscode/`

## Section 3 — Docs Reorganization

Current: flat `docs/` with feature markdowns mixed with folders.

Target:
```
docs/
├── README.md                        # new index
├── features/
│   ├── ai-realtime-feature.md
│   └── collaborative-rooms-feature.md
├── presentation/
│   └── LMS_Presentation.html
├── qa/                              # existing
└── superpowers/                     # existing (plans/, specs/)
```

## Section 4 — Backend Package Restructure (Feature-Sliced)

### Current

```
com.lms.dev/
├── controller/  (15)    # all features mixed
├── service/     (17)
├── entity/      (14)
├── repository/  (13)
├── dto/         (30)
├── config/      (2)
├── security/    (5)
├── exception/   (1)
├── enums/       (3)
├── ai/          (34)    # already hexagonal
└── room/        (25)    # already feature-module
```

### Target

```
com.lms.dev/
├── LmsApplication.java
├── common/              # shared cross-cutting
│   ├── config/
│   ├── dto/             # ApiResponse, error envelopes
│   ├── exception/       # GlobalExceptionHandler
│   └── enums/
├── security/            # jwt/, util/ (unchanged)
├── user/                # UserController, UserService, UserRepository, User entity, DTOs
├── course/
├── assessment/          # merge Question + Assessment
├── learning/            # Learning + Progress entities
├── discussion/
├── feedback/
├── certificate/
├── notification/
├── auth/                # login/register/otp controllers + services
├── chat/                # existing dto/chat + related
├── roadmap/             # existing dto/roadmap + related
├── ai/                  # existing hexagonal module — unchanged internals
└── room/                # existing feature module — unchanged internals
```

### Migration strategy

1. For each feature, create new package dir
2. `git mv` Java files to new package
3. Update `package` declaration in file
4. Update all `import` statements referencing moved classes
5. Run `./mvnw compile` to catch missed imports
6. Commit per feature move to keep diffs reviewable

### Feature-to-file map

Determined during execution by reading each controller/entity to classify. Committed as separate commits per feature for rollback safety.

## Section 5 — Frontend Restructure (lowercase-kebab)

### Renames

| From | To |
|------|-----|
| `Components/` | `components/` |
| `Components/common/` | `components/common/` |
| `pages/dashBoard/` | `pages/dashboard/` |
| `pages/userDashboard/` | `pages/user-dashboard/` |

### Windows case-sensitivity workaround

`git mv Components tmp_Components && git mv tmp_Components components`

Same pattern for `dashBoard` → `dashboard`.

### Import updates

All `.js`/`.jsx` files importing from renamed paths. Strategy:
- `grep -rln "from.*['\"].*Components"` → update each
- `grep -rln "dashBoard"` → update each
- `grep -rln "userDashboard"` → update each

## Section 6 — Git Strategy

- Create branch `cleanup/restructure-b` off current HEAD
- Commits (logical chunks):
  1. `chore: remove root junk artifacts`
  2. `chore: harden .gitignore and untrack build/IDE dirs`
  3. `docs: reorganize docs/ folder structure`
  4. `refactor(backend): feature-slice packages — <feature>` (one per feature)
  5. `refactor(frontend): lowercase-kebab folder naming`
  6. `build: verify backend compile + frontend build`
- No push until user approves final result

## Verification

- Backend: `./mvnw -q compile` passes after restructure; `./mvnw test` best-effort (pre-existing failures noted but not fixed)
- Frontend: `npm run build` passes after rename; imports all resolve
- Manual spot-check: open 2-3 controllers + 2-3 pages, confirm imports resolved

## Risks + Mitigations

| Risk | Mitigation |
|------|------------|
| Backend imports broken across 100+ files | Incremental commits per feature; `mvnw compile` between each |
| Frontend case-sensitive rename breaks on Windows | Two-step `git mv` via intermediate name |
| Spring security/config references old package paths | Grep for old FQCN before deleting old packages |
| `@ComponentScan` may need update | Verify application boots after restructure |
| Reflection-based refs (Jackson, JPA) break silently | Integration test smoke-run after each backend commit |

## Rollback

Each section = 1+ commits on branch. Any section fails verification → `git reset --hard <prev-commit>` or abandon branch. Main branch untouched.

## Out of Scope (deferred)

- Split large files inside AI module (34 files, some may be big)
- Refactor duplicated logic across controllers
- Test coverage additions
- Dependency upgrades
- Dockerfile optimization
- Commit history rewrite to purge old build artifacts (size cost acceptable)
