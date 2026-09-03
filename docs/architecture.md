# Architecture Overview

The project has two independently runnable applications:

- `frontend`: a React single-page application. `PublicLayout` and `AdminLayout` deliberately keep the future public site and protected administration experience distinct. Routes are declared centrally and API communication goes through `services/apiClient.ts`.
- `backend`: a FastAPI application exposing versioned endpoints under `/api/v1`. Route modules handle HTTP concerns; schemas validate data; services will own business rules; models own persistence.

Configuration is loaded from environment variables by `app.core.config`. SQLAlchemy sessions are provided through the `get_db` dependency. Alembic reads the same database setting for migrations. PostgreSQL is required outside lightweight import checks.

Authentication and domain modules are intentionally only scaffolded in Phase 1. Protected endpoints must use authorization dependencies once authentication is implemented.

## Domain architecture (Phase 4)

The PostgreSQL domain is split into public content and private administration data. Private tables are `admin_users`, `roles`, `families`, `members`, `member_relationships`, `dues`, `payments`, and `donations`. They have no public routes. Future `/api/v1/admin/*` routes must use server-side authorization dependencies; role assignment is data-driven through `Role` rather than route-local checks.

Public content tables are `events`, `announcements`, `gallery_albums`, `gallery_images`, `sermon_series`, `sermons`, `page_content`, `site_settings`, and `service_times`. Only published/active, intentionally projected fields are returned under `/api/v1/public/*`. Public response schemas deliberately omit status and administrative timestamps where they are not needed.

Families may have many members, but a member may be independent; removing a family sets its members' `family_id` to null. Member and financial foreign keys use `RESTRICT`, preserving accounting history and favouring status-based archival over deletion. Gallery images cascade when their album record is removed; external image objects are never deleted by the database. Sermon-series removal sets a sermon's series to null.

Dues express an obligation for a member or family. Payments record settlement activity and may be linked to a due. Donations are intentionally separate, may be anonymous, and are not linked to a member. Every currency column is PostgreSQL `NUMERIC(12,2)` with database checks preventing negative or zero amounts as applicable. Timestamps are timezone-aware and application data is stored/queried in UTC.

The initial migration is `20260831_0001_domain_foundation`. It creates all tables, foreign keys, selected query indexes, uniqueness constraints, and enum types. No demo members or financial data are seeded.

## Authentication and authorization (Phase 5)

Private administration uses an opaque, random session identifier in a `HttpOnly`, `SameSite=Lax` cookie. The server stores only a SHA-256 digest of that identifier in `admin_sessions`, with an eight-hour configurable expiry (`SESSION_EXPIRE_MINUTES`). Sessions are revoked at logout and all active sessions are revoked when an administrator is deactivated. Browser JavaScript never receives a token and no token is stored in local storage. `COOKIE_SECURE` must be enabled in production; configured CORS origins are explicit and credentialed, never wildcard origins.

Passwords are Argon2 hashes in `admin_users.password_hash`; plaintext passwords and hashes are omitted from every response schema. Emails are trimmed and case-folded before storage/comparison, preserving one identity per address. Login failures use the same generic response for unknown, inactive, and invalid-password accounts. The in-process login throttle allows ten attempts per IP per minute; production deployments should place the API behind an edge rate limiter as well.

All private routes use `get_current_admin` and permission dependencies. Roles are `SUPER_ADMIN`, `CONTENT_ADMIN`, `MEMBER_ADMIN`, and `TREASURER`, with default deny. Super Admin has all permissions; Content Admin manages public content; Member Admin manages members/families and dues; Treasurer manages dues/payments and views donations. Treasurer has no member directory permission. The frontend mirrors these permissions only to improve navigation; the API remains the security boundary.

`POST /auth/login`, `POST /auth/logout`, and `GET /auth/me` provide the authentication contract. Administrative account endpoints are Super-Admin-only. The last active Super Admin cannot be deactivated or demoted. The first account is created only with `python -m app.cli create-super-admin ...` after migration; it prompts for credentials rather than accepting a password argument.

`audit_logs` is an append-only application foundation for administrator, member, finance, content, and settings actions. This phase records administrator creation and updates, intentionally excluding passwords, tokens, and other sensitive metadata. Future mutations must call the audit service before they are mounted.

## CMS content management (Phase 7)

Phase 7 delivers the full church content management system, allowing authorized administrators to manage all public-facing website content without editing source code or redeploying.

### Content areas

| Area | Admin route | Public API |
|------|-------------|------------|
| Homepage sections | `/admin/content/homepage` | `/api/v1/public/content?page=homepage` |
| About page sections | `/admin/content/about` | `/api/v1/public/content?page=about` |
| Events | `/admin/content/events` | `/api/v1/public/events` |
| Announcements | `/admin/content/announcements` | `/api/v1/public/announcements` |
| Sermons | `/admin/content/sermons` | `/api/v1/public/sermons` |
| Gallery albums & images | `/admin/content/gallery` | `/api/v1/public/gallery` |
| Service times | `/admin/content/service-times` | `/api/v1/public/service-times` |
| Site settings | `/admin/content/settings` | `/api/v1/public/settings` |

### Publishing model

Every content entity has an explicit publication state. The public APIs only return content in the correct state:

- `DRAFT` — visible to admins only, never returned by public endpoints
- `PUBLISHED` — returned by public endpoints and displayed on the public website
- `ARCHIVED` — hidden from public endpoints, retained for history

Service times use `is_active: bool` instead of a publication status enum.

### CMS permission matrix

| Role | CMS access |
|------|------------|
| SUPER_ADMIN | Full CMS management |
| CONTENT_ADMIN | Full CMS management |
| MEMBER_ADMIN | Denied |
| TREASURER | Denied |

Every CMS endpoint enforces `content:manage` permission server-side via the `require_permission` dependency. The frontend mirrors this only for navigation display.

### API routes

All CMS routes are under `/api/v1/admin/cms` and require a valid session with `content:manage` permission.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/cms/dashboard` | Counts summary |
| GET/POST | `/admin/cms/events` | List / create events |
| GET/PATCH | `/admin/cms/events/{id}` | Get / update event |
| POST | `/admin/cms/events/{id}/publish` | Publish |
| POST | `/admin/cms/events/{id}/unpublish` | Unpublish |
| POST | `/admin/cms/events/{id}/archive` | Archive |
| GET/POST | `/admin/cms/announcements` | List / create |
| GET/PATCH | `/admin/cms/announcements/{id}` | Get / update |
| POST | `/admin/cms/announcements/{id}/publish\|unpublish\|archive` | Status transitions |
| GET/POST | `/admin/cms/sermon-series` | List / create series |
| GET/POST | `/admin/cms/sermons` | List / create sermons |
| GET/PATCH | `/admin/cms/sermons/{id}` | Get / update |
| POST | `/admin/cms/sermons/{id}/publish\|unpublish\|archive` | Status transitions |
| GET/POST | `/admin/cms/gallery` | List / create albums |
| GET/PATCH | `/admin/cms/gallery/{id}` | Get / update album |
| POST | `/admin/cms/gallery/{id}/publish\|unpublish\|archive` | Status transitions |
| POST | `/admin/cms/gallery/{id}/images` | Add image |
| PATCH/DELETE | `/admin/cms/gallery/{id}/images/{img_id}` | Update / remove image |
| GET/POST | `/admin/cms/service-times` | List / create |
| PATCH/DELETE | `/admin/cms/service-times/{id}` | Update / delete |
| GET | `/admin/cms/content/{page}` | List page sections |
| PUT | `/admin/cms/content/{page}/{section}` | Upsert section |
| GET | `/admin/cms/settings` | List settings |
| PUT | `/admin/cms/settings/{key}` | Upsert setting |

### Media / image storage

Images remain represented by validated absolute `https://` URLs in PostgreSQL, preserving existing records. Authenticated CMS image uploads are validated server-side and stored in the public Supabase Storage bucket configured by `SUPABASE_STORAGE_BUCKET`; the service-role key is backend-only. Create that bucket as public, restrict object creation to the service role, and do not expose the service-role key in Vite variables. Google OAuth uses the exact callback `GOOGLE_REDIRECT_URI`, and an administrator must be explicitly linked by setting `admin_users.auth_subject` to `google:<Google subject>`; email alone never authorizes an account. All image URL fields reject non-HTTP(S) schemes (e.g. `javascript:`, `data:`, `ftp:`).

### Audit logging

All CMS mutations write to `audit_logs`: content created, updated, published, unpublished, archived, images added/removed, page content updated, settings updated. Passwords, tokens, and secrets are never written.

### Migration

`20260901_0004_phase7_cms_sort_order` — adds `sort_order INTEGER NOT NULL DEFAULT 0` to `service_times`.

### Frontend hooks (`src/hooks/useCms.ts`)

`useCmsDashboard`, `useAdminEvents`, `useAdminEvent`, `useCreateEvent`, `useUpdateEvent`, `usePublishEvent`, `useAdminAnnouncements`, `useAdminAnnouncement`, `useCreateAnnouncement`, `useUpdateAnnouncement`, `usePublishAnnouncement`, `useSermonSeries`, `useCreateSermonSeries`, `useAdminSermons`, `useAdminSermon`, `useCreateSermon`, `useUpdateSermon`, `usePublishSermon`, `useAdminAlbums`, `useAdminAlbum`, `useCreateAlbum`, `useUpdateAlbum`, `usePublishAlbum`, `useAddImage`, `useRemoveImage`, `useAdminServiceTimes`, `useCreateServiceTime`, `useUpdateServiceTime`, `useDeleteServiceTime`, `useAdminPageContent`, `useUpsertPageContent`, `useAdminSettings`, `useUpsertSetting`.

Public hooks are in `src/hooks/usePublicContent.ts`: `usePublicEvents`, `usePublicAnnouncements`, `usePublicGallery`, `usePublicSermons`, `usePublicContent`, `usePublicSettings`, `usePublicServiceTimes`.

Cache invalidation: publishing/unpublishing any content invalidates both the admin query and the corresponding public query key so the public website reflects changes immediately.

### siteContent.ts

The file is retained for purely structural/static data: navigation links, demo ministry previews (not yet CMS-managed), and demo images used on static public pages (About, Ministries, Contact, Donate, Sermons, Gallery). Homepage dynamic content (hero, intro, visit, CTA, service times, events) is now database-backed. The public Events, Announcements, Sermons, and Gallery pages consume live API data with graceful empty states.

## Member and family management (Phase 6)

Phase 6 delivers the full church member and family management system inside the authenticated admin dashboard. No member data is exposed through public routes.

### API routes

All routes require a valid admin session cookie. Authorization is enforced server-side on every endpoint.

| Method | Path | Permission required |
|--------|------|---------------------|
| GET | `/api/v1/admin/members` | `members:view` |
| POST | `/api/v1/admin/members` | `members:manage` |
| GET | `/api/v1/admin/members/{member_id}` | `members:view` |
| PATCH | `/api/v1/admin/members/{member_id}` | `members:manage` |
| GET | `/api/v1/admin/members/{member_id}/relationships` | `members:view` |
| POST | `/api/v1/admin/members/{member_id}/relationships` | `members:manage` |
| GET | `/api/v1/admin/families` | `members:view` |
| POST | `/api/v1/admin/families` | `members:manage` |
| GET | `/api/v1/admin/families/{family_id}` | `members:view` |
| PATCH | `/api/v1/admin/families/{family_id}` | `members:manage` |

### Permission matrix

| Role | View members/families | Manage members/families |
|------|-----------------------|-------------------------|
| SUPER_ADMIN | ✓ | ✓ |
| MEMBER_ADMIN | ✓ | ✓ |
| CONTENT_ADMIN | ✗ | ✗ |
| TREASURER | ✗ | ✗ |

### Member list query parameters

`page`, `page_size` (1–100), `search` (name/email/phone ilike), `status` (MembershipStatus enum), `family_id` (UUID).

All list endpoints return paginated envelopes: `{ items, total, page, page_size, pages }`.

### Validation

Backend validates: required fields, string lengths, valid enum values, email normalization (casefold), family existence on assignment, self-relationship prevention, and duplicate relationship uniqueness (database constraint).

### Audit logging

The following actions are written to `audit_logs` on every mutation:

- `member.created` — name in metadata
- `member.updated` — changed field names in metadata
- `member.status_changed` — changed field names in metadata
- `member.relationship_added` — both member IDs and relationship type
- `family.created` — family name in metadata
- `family.updated` — family name in metadata

Passwords, session tokens, and other sensitive values are never written to audit logs.

### Migration

`20260831_0003_phase6_member_family_indexes` — adds case-insensitive lower() indexes on `members.first_name`, `members.last_name`, and `families.family_name` to support efficient ilike search queries.

### Frontend routes

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/members` | MembersPage | List with search, filters, pagination |
| `/admin/members/new` | AddMemberPage | Create member form |
| `/admin/members/:memberId` | MemberDetailPage | Full member profile |
| `/admin/members/:memberId/edit` | EditMemberPage | Edit member form |
| `/admin/families` | FamiliesPage | List with search, pagination, member count |
| `/admin/families/new` | AddFamilyPage | Create family form |
| `/admin/families/:familyId` | FamilyDetailPage | Family detail with member list |
| `/admin/families/:familyId/edit` | EditFamilyPage | Edit family form |

Search and filter state is preserved in URL query parameters (`search`, `status`, `family_id`, `page`) so admins can refresh, share, and use browser back/forward.

### React Query hooks (`src/hooks/useMembers.ts`)

`useMembers`, `useMember`, `useCreateMember`, `useUpdateMember`, `useFamilies`, `useFamily`, `useCreateFamily`, `useUpdateFamily`. Mutations invalidate the relevant list queries and optimistically update detail cache entries.
