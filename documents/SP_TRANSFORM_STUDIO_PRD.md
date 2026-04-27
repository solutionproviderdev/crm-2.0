# SP Transform Studio — Product Requirements Document

**Version:** 1.0.0  
**Date:** 2026-04-20  
**Status:** Ready for Development  
**Owner:** Solution Provider (SP) Internal Team  
**Document Format:** Markdown (.md) — AI-agent-native  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Personas](#4-user-personas)
5. [System Architecture Overview](#5-system-architecture-overview)
6. [Feature Requirements](#6-feature-requirements)
7. [AI Provider Integration Layer](#7-ai-provider-integration-layer)
8. [UI/UX Specifications](#8-uiux-specifications)
9. [Data Models & Schema](#9-data-models--schema)
10. [API Specifications](#10-api-specifications)
11. [Security & Access Control](#11-security--access-control)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)
13. [Scalability Plan](#13-scalability-plan)
14. [Out of Scope (v1.0)](#14-out-of-scope-v10)
15. [Acceptance Criteria](#15-acceptance-criteria)
16. [Glossary](#16-glossary)

---

## 1. Executive Summary

**SP Transform Studio** is a web-based internal tool for Solution Provider's marketing and design team. It enables any team member — regardless of AI expertise — to take a customer-submitted apartment photo, paint three cabinet zones on it with a single click each, and auto-generate a realistic before→after transformation image and a 5-second social media video using configurable AI providers (Adobe Firefly, Kling AI, and future providers).

The tool abstracts all AI API complexity behind a clean, opinionated UI. Adding a new AI provider requires only a single config file edit — no code change needed.

**Target stack:** Node.js (Next.js 14 App Router) + PostgreSQL + Redis + Docker → deployed on Hostinger VPS.

---

## 2. Problem Statement

### Current Pain Points

| Pain | Impact |
|---|---|
| Team manually prompts AI tools one-by-one | Slow, inconsistent results, high skill ceiling |
| No zone isolation — full room gets restyled | Customer room context is lost |
| Prompts are stored in chat history, not reusable | Knowledge locked to individuals |
| No before/after comparison or approval flow | Quality control is ad hoc |
| Switching AI provider requires rewriting prompts | Vendor lock-in |

### Core Insight
The workflow is **Image Inpainting + Video Generation**, not text-to-image. The tool must:
1. Accept a customer photo
2. Let the operator define exactly three zones (Lower / Middle / Upper)
3. Send zone-masked prompts to the right AI provider
4. Return a polished before→after image and a transformation video

---

## 3. Goals & Success Metrics

### Business Goals
- Reduce per-job time from ~45 minutes → under 15 minutes
- Reduce per-job cost to < $0.50
- Enable any team member to run a job without AI expertise
- Support 100+ jobs/month on a single VPS

### KPIs (measured at 60 days post-launch)

| Metric | Target |
|---|---|
| Average job completion time | ≤ 15 minutes |
| Per-job AI cost | ≤ $0.50 |
| Jobs completed per month | ≥ 100 |
| Failed generations (requiring redo) | < 10% |
| Team onboarding time (new member) | ≤ 30 minutes |
| AI provider swap time (config only) | ≤ 10 minutes |

---

## 4. User Personas

### Persona A — Design Operator (Primary)
- **Role:** Junior/mid-level team member
- **Tech level:** Moderate (uses Canva, social media tools)
- **Goal:** Upload photo → paint zones → get output → send to client
- **Frustration:** Complex prompting, inconsistent AI results, multiple tabs

### Persona B — Team Lead / QC Reviewer
- **Role:** Senior designer or manager
- **Goal:** Review outputs before delivery, approve or request regeneration
- **Need:** Side-by-side before/after comparison, one-click approve/reject

### Persona C — Admin / DevOps
- **Role:** Technical team member
- **Goal:** Add new AI providers, manage API keys, monitor costs
- **Need:** Provider config panel, usage dashboard, error logs

---

## 5. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER CLIENT                           │
│  Next.js 14 App Router + React + Tailwind CSS + Fabric.js      │
│  [Upload] → [Zone Painter] → [Config Panel] → [Output Viewer]   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS / REST + WebSocket (job status)
┌──────────────────────▼──────────────────────────────────────────┐
│                      NEXT.JS API ROUTES                         │
│  /api/jobs  /api/providers  /api/generate  /api/approve         │
└────────┬───────────────────────────┬────────────────────────────┘
         │                           │
┌────────▼──────────┐    ┌──────────▼──────────────────────────┐
│   PostgreSQL DB   │    │         AI PROVIDER LAYER            │
│   (jobs, assets,  │    │  ┌──────────────────────────────┐   │
│    users, presets)│    │  │  Provider Registry (JSON)    │   │
└───────────────────┘    │  │  adobe-firefly.json          │   │
                         │  │  kling-ai.json               │   │
┌──────────────────┐     │  │  [new-provider].json         │   │
│  Redis (BullMQ)  │     │  └──────────────────────────────┘   │
│  Job Queue       │     │  Provider Adapter Interface          │
└──────────────────┘     │  → FireflyAdapter                   │
                         │  → KlingAdapter                      │
┌──────────────────┐     │  → [NewProviderAdapter]             │
│  File Storage    │     └─────────────────────────────────────┘
│  /uploads        │
│  /outputs        │
│  (local → S3     │
│   when scaling)  │
└──────────────────┘
```

### Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR + API routes in one repo |
| Canvas / Zone Painting | Fabric.js | Polygon/brush masking on images |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent UI |
| Backend API | Next.js Route Handlers | Collocated, simple deploy |
| Job Queue | BullMQ + Redis | Async AI calls, retry logic |
| Database | PostgreSQL (via Prisma ORM) | Relational, audit logs |
| File Storage | Local disk (v1) → S3-compatible (v2) | Progressive upgrade |
| Auth | NextAuth.js (credentials) | Simple team auth |
| Deployment | Docker Compose on Hostinger VPS | Simple, reproducible |
| Reverse Proxy | Nginx | SSL termination |

---

## 6. Feature Requirements

### 6.1 Job Creation Flow (Core)

**F-01: Photo Upload**
- Accept JPG, PNG, WEBP, MP4 (video for future use)
- Max file size: 20 MB image / 200 MB video
- Auto-generate thumbnail on upload
- Store in `/uploads/jobs/{job_id}/source.jpg`
- Display upload progress bar

**F-02: Zone Painter Canvas**
- Display uploaded image full-width on canvas
- Three zone tool buttons: `[LOWER]` `[MIDDLE]` `[UPPER]` with color indicators:
  - LOWER → Black overlay (#000000, 40% opacity)
  - MIDDLE → Yellow overlay (#FFD700, 40% opacity)
  - UPPER → Red overlay (#FF3B30, 40% opacity)
- Brush tool: adjustable size slider (20px – 150px)
- Eraser tool to undo brush strokes per zone
- Auto-suggest zones button: AI auto-detects wall segment and pre-paints zones (optional, v1.1)
- Zone lock toggle: lock a completed zone before painting another
- Undo/Redo (Ctrl+Z / Ctrl+Y)
- Export mask as PNG per zone (used internally for API calls)

**F-03: Cabinet Configuration Panel**
- Preset selector dropdown (Preset A / B / C + custom)
- Fields:
  - Room Type (dropdown: kitchen, living room, bedroom)
  - Room Size Description (text)
  - Light Condition (dropdown + free text)
  - Wall Position Description (auto-detect or manual)
  - Cabinet Depth (mm, default 600)
  - Series Name
  - Finish Type (dropdown)
  - Color Code (text, e.g. SP-WH01)
  - Color Name (text)
  - Handle Style (dropdown: slim silver / J-profile / handleless / G-profile)
  - Countertop Material + Thickness + Color
  - Backsplash Description
  - Style Tags (multi-select: modern, minimal, Scandinavian, warm contemporary)
  - Mood Tags (multi-select: cozy, premium, lived-in, bright, luxury)
- Output Config:
  - Aspect Ratio (9:16 / 1:1 / 16:9)
  - Video Duration (4–6 seconds, default 5)
  - Generate Image Only / Image + Video toggle
- Save as new preset button

**F-04: Provider Selection**
- Dropdown to select AI provider per generation step:
  - Image Inpainting Provider (default: Adobe Firefly)
  - Video Generation Provider (default: Kling AI)
- Provider health indicator (green/yellow/red dot) showing API status
- Estimated credit cost shown before generation

**F-05: Generation & Job Tracking**
- "Generate" button triggers job creation
- Real-time progress bar via WebSocket (SSE fallback):
  - Step 1: Preparing zones
  - Step 2: Generating LOWER zone
  - Step 3: Generating MIDDLE zone
  - Step 4: Generating UPPER zone
  - Step 5: Compositing final image
  - Step 6: Generating video (if selected)
- Cancel job button (cancels queued/in-progress job)
- Estimated time remaining display

**F-06: Output Viewer**
- Side-by-side Before / After image comparison (slider reveal)
- Video player for generated transformation video
- Download buttons: Image (PNG), Video (MP4)
- Regenerate individual zone button (re-runs only that zone's inpaint)
- Send to Review button (notifies Team Lead)
- Job metadata panel: provider used, credits consumed, time taken

**F-07: Approval Flow**
- Team Lead sees "Pending Review" jobs in their dashboard
- Approve → job marked complete, assets moved to `/outputs/approved/`
- Reject with comment → operator gets notification, can regenerate
- Approved jobs auto-generate a shareable link (internal only, v1)

### 6.2 Preset Management

**F-08: Preset Library**
- Create, edit, delete presets
- System presets (Preset A, B, C from brief) — locked, cannot delete
- Team presets — editable by any operator
- Export presets as JSON
- Import presets from JSON

### 6.3 Admin Panel

**F-09: Provider Management** *(See Section 7 for full spec)*
- Add / edit / disable AI providers
- Store API keys (encrypted at rest)
- View per-provider usage and cost

**F-10: Usage Dashboard**
- Jobs per day / week / month chart
- Credits consumed per provider
- Average job time
- Failure rate per provider
- Export as CSV

**F-11: User Management**
- Roles: Admin, Team Lead, Operator
- Invite by email (sends magic link)
- Deactivate user

---

## 7. AI Provider Integration Layer

This is the most critical architectural decision. The system uses a **Provider Registry + Adapter Pattern** so any new AI provider can be added by creating one JSON config file and one TypeScript adapter class.

### 7.1 Provider Registry

Each provider is defined in `/config/providers/{provider-id}.json`:

```json
{
  "id": "adobe-firefly",
  "name": "Adobe Firefly",
  "version": "3.0",
  "capabilities": ["image_inpaint", "text_to_image"],
  "status": "active",
  "baseUrl": "https://firefly-api.adobe.io",
  "authType": "oauth2_client_credentials",
  "authConfig": {
    "tokenUrl": "https://ims-na1.adobelogin.com/ims/token/v3",
    "scopes": ["firefly_api"]
  },
  "credentialsEnvKeys": {
    "clientId": "FIREFLY_CLIENT_ID",
    "clientSecret": "FIREFLY_CLIENT_SECRET"
  },
  "rateLimit": {
    "requestsPerMinute": 20,
    "concurrent": 4
  },
  "costPerCall": {
    "image_inpaint": 0.033
  },
  "endpoints": {
    "image_inpaint": {
      "path": "/v3/images/fill",
      "method": "POST",
      "inputMapping": {
        "image": "$.image.source.uploadId",
        "mask": "$.mask.source.uploadId",
        "prompt": "$.prompt",
        "negativePrompt": "$.negativePrompt",
        "outputFormat": "$.outputFormat"
      },
      "outputMapping": {
        "resultUrl": "$.outputs[0].image.presignedUrl"
      }
    }
  },
  "defaultParams": {
    "outputFormat": "png",
    "numVariations": 4
  }
}
```

```json
{
  "id": "kling-ai",
  "name": "Kling AI",
  "version": "1.6",
  "capabilities": ["image_to_video"],
  "status": "active",
  "baseUrl": "https://api.klingai.com",
  "authType": "bearer",
  "credentialsEnvKeys": {
    "apiKey": "KLING_API_KEY"
  },
  "rateLimit": {
    "requestsPerMinute": 10,
    "concurrent": 2
  },
  "costPerCall": {
    "image_to_video": 0.28
  },
  "endpoints": {
    "image_to_video": {
      "path": "/v1/videos/image2video",
      "method": "POST",
      "inputMapping": {
        "startFrameUrl": "$.image.url",
        "endFrameUrl": "$.tail_image.url",
        "prompt": "$.prompt",
        "duration": "$.duration",
        "aspectRatio": "$.aspect_ratio"
      },
      "outputMapping": {
        "taskId": "$.data.task_id"
      },
      "pollingEndpoint": "/v1/videos/image2video/{taskId}",
      "pollingResultPath": "$.data.task_result.videos[0].url",
      "pollingCompletionStatus": "succeed"
    }
  }
}
```

### 7.2 Adapter Interface (TypeScript)

```typescript
// /lib/providers/adapter.interface.ts

export interface ProviderAdapter {
  readonly providerId: string;
  
  // Image inpainting: takes image + mask + prompt → returns result image URL
  inpaintZone(params: InpaintParams): Promise<InpaintResult>;
  
  // Image to video: takes before + after image → returns video URL
  generateVideo(params: VideoParams): Promise<VideoResult>;
  
  // Health check
  checkStatus(): Promise<ProviderStatus>;
  
  // Estimate cost before running (does not call API)
  estimateCost(operation: OperationType, params: Record<string, unknown>): number;
}

export interface InpaintParams {
  sourceImagePath: string;   // local file path
  maskImagePath: string;     // binary mask PNG, white = area to replace
  prompt: string;
  negativePrompt?: string;
  zoneId: 'lower' | 'middle' | 'upper';
  outputFormat?: 'png' | 'jpg';
}

export interface InpaintResult {
  resultImageUrl: string;    // URL or local path
  variationUrls?: string[];  // multiple options if provider returns them
  creditsUsed: number;
  providerJobId: string;
}

export interface VideoParams {
  startFramePath: string;   // original customer photo
  endFramePath: string;     // final after-image
  motionPrompt: string;
  durationSeconds: number;
  aspectRatio: '9:16' | '1:1' | '16:9';
}

export interface VideoResult {
  videoUrl: string;
  creditsUsed: number;
  providerJobId: string;
}
```

### 7.3 Adding a New Provider (Step-by-Step for Admin)

To add, say, **Stable Diffusion (Replicate)**:

1. Create `/config/providers/replicate-sd.json` (copy template, fill values)
2. Create `/lib/providers/adapters/ReplicateSDAdapter.ts` implementing `ProviderAdapter`
3. Register in `/lib/providers/registry.ts` — one line: `import ReplicateSDAdapter from './adapters/ReplicateSDAdapter'`
4. Add env keys to `.env` and Hostinger VPS environment
5. Provider appears automatically in the UI dropdown

**No other code changes required.**

### 7.4 Prompt Generation Engine

The system auto-builds structured prompts from the job configuration:

```typescript
// /lib/prompt-engine/buildZonePrompt.ts

export function buildZonePrompt(zone: ZoneId, config: JobConfig): string {
  const zoneSpecs = {
    lower: `Modular base cabinet run by Solution Provider, 
      ${config.finish} finish ${config.colorCode} "${config.colorName}", 
      ${config.handleStyle} handles, 
      floor-to-countertop height 850mm, depth ${config.cabinetDepthMm}mm, 
      soft-close drawers, photorealistic, sharp edges, 
      matching existing floor lighting and shadow direction, 
      no change to floor tiles or adjacent walls, lived-in realistic look.`,
    
    middle: `Engineered quartz countertop ${config.countertopThicknessMm}mm in ${config.countertopColor}, 
      integrated backsplash ${config.backsplashDescription}, 
      seamless joint with the lower ${config.finish} cabinets below, 
      photorealistic reflection, no change outside this zone.`,
    
    upper: `Overhead wall-mounted cabinet row by Solution Provider, 
      ${config.finish} finish ${config.colorCode} matching lower cabinets exactly, 
      ${config.handleStyle}, height 700mm, depth 350mm, 
      aligned horizontally with base cabinets, 
      soft LED under-cabinet light strip along bottom edge, 
      photorealistic, ceiling untouched.`
  };
  
  const styleContext = `Interior style: ${config.styleTags.join(', ')}. 
    Mood: ${config.moodTags.join(', ')}. 
    Room: ${config.roomType}, ${config.roomSizeDescription}. 
    Lighting: ${config.lightCondition}. 
    The space should look realistic and lived-in, not like a showroom render.`;
  
  const negativePrompt = `showroom render, CGI artifacts, changed floor, 
    changed ceiling, changed windows, extra furniture, text overlay, 
    logo, watermark, distorted perspective, changed camera angle`;
  
  return {
    positive: `${zoneSpecs[zone]} ${styleContext}`,
    negative: negativePrompt
  };
}
```

---

## 8. UI/UX Specifications

### 8.1 Layout & Navigation

```
┌─────────────────────────────────────────────────────────┐
│  SP Transform Studio    [Jobs] [Presets] [Admin] [User]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Sidebar: Job List]    [Main Content Area]              │
│  - Pending (3)          - Current job workspace          │
│  - In Progress (1)                                       │
│  - Review (2)                                            │
│  - Approved (41)                                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Job Workspace — 3-Step Wizard

The workspace is a **linear 3-step wizard**. No step can be skipped.

**Step 1: Upload**
```
┌──────────────────────────────────────────────────────┐
│  Step 1 of 3 — Upload Customer Photo                 │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  │   Drag & drop or click to upload             │   │
│  │   JPG / PNG / WEBP — max 20 MB               │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│  [Or paste image URL]                                │
│                                         [Next →]     │
└──────────────────────────────────────────────────────┘
```

**Step 2: Paint Zones**
```
┌──────────────────────────────────────────────────────────────┐
│  Step 2 of 3 — Paint Cabinet Zones                           │
│                                                              │
│  ┌─── Tool Bar ────────────────────────────────────────┐    │
│  │  [■ LOWER]  [■ MIDDLE]  [■ UPPER]  [Eraser]  [Undo] │    │
│  │  Brush Size: ───●──── 60px                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─── Canvas (full width) ─────────────────────────────┐    │
│  │                                                     │    │
│  │          [Customer photo displayed here]            │    │
│  │          [Zone overlays painted by user]            │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Zone Status:  ■ LOWER ✓   ■ MIDDLE ✓   ■ UPPER ○           │
│                                          [← Back] [Next →]   │
└──────────────────────────────────────────────────────────────┘
```

**Step 3: Configure & Generate**
```
┌──────────────────────────────────────────────────────────────┐
│  Step 3 of 3 — Configure & Generate                          │
│                                                              │
│  Preset: [Preset A — Matte White ▾]  [Save as new preset]    │
│                                                              │
│  ┌── Cabinet Specs ──────────────────────────────────────┐  │
│  │  Room Type: [Kitchen ▾]    Size: [8×10 ft          ]  │  │
│  │  Light: [Soft daylight, right ▾]                      │  │
│  │  Finish: [Matte ▾]  Color: [SP-WH01]  Name: [White]  │  │
│  │  Handle: [Slim silver ▾]                              │  │
│  │  Countertop: [Quartz ▾] 20mm  Color: [Warm Beige]    │  │
│  │  Backsplash: [Cream ceramic 60×30cm subway]           │  │
│  │  Style: [Modern ×] [Minimal ×] [+ add]               │  │
│  │  Mood: [Warm ×] [Premium ×] [+ add]                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌── Output ─────────────────────────────────────────────┐  │
│  │  Image Provider: [Adobe Firefly ▾]  ● Online          │  │
│  │  Video Provider: [Kling AI ▾]       ● Online          │  │
│  │  Aspect Ratio: (●) 9:16  ( ) 1:1  ( ) 16:9           │  │
│  │  Output: (●) Image + Video  ( ) Image Only            │  │
│  │  Estimated Cost: ~$0.41   Est. Time: ~8 min           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│                              [← Back]  [🚀 Generate Now]     │
└──────────────────────────────────────────────────────────────┘
```

### 8.3 Output Viewer

```
┌────────────────────────────────────────────────────────────────────┐
│  Job #JOB-042 — Kitchen Walnut Gloss — Completed 8m 34s            │
│                                                                     │
│  ┌─── Before ──────────────────┐  ┌─── After ────────────────────┐ │
│  │                             │◄►│                              │ │
│  │   [Original customer photo] │  │   [AI-generated result]      │ │
│  │                             │  │                              │ │
│  └─────────────────────────────┘  └──────────────────────────────┘ │
│              [Slider reveal comparison mode]                        │
│                                                                     │
│  ┌─── Transformation Video ──────────────────────────────────────┐ │
│  │  [▶ Play]  5s  9:16  Kling AI 1.6                            │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  [⬇ Download Image]  [⬇ Download Video]  [↻ Regenerate Zone ▾]    │
│                                                                     │
│  Providers: Firefly (3 credits, $0.10) + Kling ($0.28) = $0.38    │
│                                                                     │
│  [✗ Reject & Comment]                        [✓ Approve & Done]    │
└────────────────────────────────────────────────────────────────────┘
```

### 8.4 Design Tokens

```css
/* Color palette */
--color-bg:           #0F0F0F;   /* near-black background */
--color-surface:      #1A1A1A;   /* card surface */
--color-surface-2:    #242424;   /* elevated surface */
--color-border:       #2E2E2E;   /* subtle border */
--color-accent:       #4F7BFF;   /* primary blue */
--color-accent-hover: #6B93FF;
--color-success:      #22C55E;
--color-warning:      #F59E0B;
--color-error:        #EF4444;
--color-text-primary: #F5F5F5;
--color-text-muted:   #888888;

/* Zone colors */
--zone-lower:  rgba(0,   0,   0,   0.45);  /* black */
--zone-middle: rgba(255, 215, 0,   0.45);  /* yellow */
--zone-upper:  rgba(255, 59,  48,  0.45);  /* red */

/* Typography */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Spacing scale: 4px base */
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-6: 24px;  --space-8: 32px;

/* Border radius */
--radius-sm: 6px;  --radius-md: 10px;  --radius-lg: 16px;
```

---

## 9. Data Models & Schema

```sql
-- Users
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('admin', 'team_lead', 'operator')),
  password_hash TEXT NOT NULL,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Presets
CREATE TABLE presets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  is_system       BOOLEAN DEFAULT FALSE,
  created_by      UUID REFERENCES users(id),
  config          JSONB NOT NULL,   -- full JobConfig object
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs
CREATE TABLE jobs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number         SERIAL UNIQUE,            -- human-readable JOB-001
  created_by         UUID REFERENCES users(id),
  status             TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','queued','processing','review','approved','failed')),
  preset_id          UUID REFERENCES presets(id),
  config_snapshot    JSONB NOT NULL,           -- copy of config at time of generation
  source_file_path   TEXT NOT NULL,
  zones              JSONB,                   -- {lower: maskPath, middle: maskPath, upper: maskPath}
  image_provider_id  TEXT NOT NULL,
  video_provider_id  TEXT,
  output_image_path  TEXT,
  output_video_path  TEXT,
  total_cost_usd     NUMERIC(8,4),
  duration_seconds   INTEGER,
  reviewer_id        UUID REFERENCES users(id),
  review_comment     TEXT,
  reviewed_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Generation Steps (for per-zone tracking)
CREATE TABLE generation_steps (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           UUID REFERENCES jobs(id) ON DELETE CASCADE,
  step_name        TEXT NOT NULL,  -- 'lower_zone','middle_zone','upper_zone','composite','video'
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','running','done','failed')),
  provider_id      TEXT,
  provider_job_id  TEXT,
  prompt_used      TEXT,
  result_path      TEXT,
  cost_usd         NUMERIC(8,4),
  error_message    TEXT,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ
);

-- Provider Usage Log
CREATE TABLE provider_usage (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       UUID REFERENCES jobs(id),
  provider_id  TEXT NOT NULL,
  operation    TEXT NOT NULL,
  cost_usd     NUMERIC(8,4),
  credits_used NUMERIC(8,2),
  success      BOOLEAN,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### JobConfig JSON Schema

```typescript
interface JobConfig {
  roomType: 'kitchen' | 'living_room_tv_wall' | 'bedroom_wardrobe_wall';
  roomSizeDescription: string;
  lightCondition: string;
  wallPositionDescription: string;
  wallWidthFt: number | 'auto';
  cabinetDepthMm: number;
  seriesName: string;
  configurationText: string;
  carcassMaterial: string;
  carcassThicknessMm: number;
  shutterMaterial: string;
  shutterThicknessMm: number;
  finishType: string;
  colorCode: string;
  colorName: string;
  handleStyle: string;
  countertopMaterial: string;
  countertopThicknessMm: number;
  countertopColor: string;
  backsplashDescription: string;
  styleTags: string[];
  moodTags: string[];
  aspectRatio: '9:16' | '1:1' | '16:9';
  videoDurationSec: number;
  generateVideo: boolean;
  imageProviderId: string;
  videoProviderId: string | null;
}
```

---

## 10. API Specifications

All API routes are Next.js Route Handlers under `/app/api/`.

### Endpoints

```
POST   /api/auth/login                — credentials login
POST   /api/auth/logout

GET    /api/jobs                      — list jobs (paginated, filtered)
POST   /api/jobs                      — create new job (upload + config)
GET    /api/jobs/:id                  — get job detail
PATCH  /api/jobs/:id                  — update job (status, reviewer action)
DELETE /api/jobs/:id                  — delete draft job

POST   /api/jobs/:id/upload           — upload source image (multipart)
POST   /api/jobs/:id/zones            — save zone mask PNGs
POST   /api/jobs/:id/generate         — trigger generation pipeline
POST   /api/jobs/:id/regenerate-zone  — regenerate a single zone
GET    /api/jobs/:id/status           — SSE stream of live job progress

GET    /api/presets                   — list presets
POST   /api/presets                   — create preset
PUT    /api/presets/:id               — update preset
DELETE /api/presets/:id               — delete (non-system only)

GET    /api/providers                 — list all providers + health status
POST   /api/providers/:id/test        — ping provider API to check credentials
GET    /api/providers/:id/estimate    — estimate cost for a given operation

GET    /api/admin/usage               — usage dashboard data
GET    /api/admin/users               — list users
POST   /api/admin/users/invite        — invite user
PATCH  /api/admin/users/:id           — update role / deactivate
```

### Example: POST /api/jobs/:id/generate

**Request:**
```json
{
  "config": { ...JobConfig },
  "imageProviderId": "adobe-firefly",
  "videoProviderId": "kling-ai"
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "uuid",
  "queuePosition": 2,
  "estimatedWaitSeconds": 180,
  "statusStreamUrl": "/api/jobs/uuid/status"
}
```

### SSE Status Stream Format

```
data: {"step":"lower_zone","status":"running","progress":0.2,"message":"Generating lower cabinet zone..."}
data: {"step":"lower_zone","status":"done","progress":0.4,"resultPath":"/outputs/uuid/lower.png"}
data: {"step":"middle_zone","status":"running","progress":0.4}
...
data: {"step":"video","status":"done","progress":1.0,"videoPath":"/outputs/uuid/video.mp4","totalCost":0.38}
```

---

## 11. Security & Access Control

### Role Permissions Matrix

| Action | Operator | Team Lead | Admin |
|---|---|---|---|
| Create job | ✓ | ✓ | ✓ |
| Generate image/video | ✓ | ✓ | ✓ |
| View own jobs | ✓ | ✓ | ✓ |
| View all jobs | ✗ | ✓ | ✓ |
| Approve/reject jobs | ✗ | ✓ | ✓ |
| Manage presets | Own only | ✓ | ✓ |
| Manage providers | ✗ | ✗ | ✓ |
| View API keys | ✗ | ✗ | ✓ (masked) |
| Manage users | ✗ | ✗ | ✓ |
| View usage dashboard | ✗ | ✓ | ✓ |

### Security Requirements

- All API keys stored encrypted in DB (AES-256) or in environment variables
- API keys never exposed in API responses (show last 4 chars only)
- All file uploads virus-scanned via ClamAV (optional, v1.1)
- HTTPS enforced via Nginx + Let's Encrypt
- Rate limiting on generation endpoints: 10 requests/minute per user
- Input sanitization on all user-provided text fields (used in AI prompts)
- CSRF protection via NextAuth
- Session timeout: 8 hours

---

## 12. Deployment & Infrastructure

### Docker Compose (Single VPS — Hostinger)

```yaml
# docker-compose.yml
version: '3.9'

services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://sp:pass@postgres:5432/sptransform
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - FIREFLY_CLIENT_ID=${FIREFLY_CLIENT_ID}
      - FIREFLY_CLIENT_SECRET=${FIREFLY_CLIENT_SECRET}
      - KLING_API_KEY=${KLING_API_KEY}
    volumes:
      - ./uploads:/app/uploads
      - ./outputs:/app/outputs
      - ./config/providers:/app/config/providers
    depends_on: [postgres, redis]

  postgres:
    image: postgres:16-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: sptransform
      POSTGRES_USER: sp
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes: [redis_data:/data]

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./certbot/conf:/etc/letsencrypt
    depends_on: [app]

volumes:
  postgres_data:
  redis_data:
```

### Hostinger VPS Minimum Spec
- Plan: VPS 4 (4 vCPU, 8 GB RAM, 200 GB SSD)
- OS: Ubuntu 22.04 LTS
- Docker + Docker Compose installed

### CI/CD (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: SSH deploy
        run: |
          ssh user@vps "cd /opt/sptransform && git pull && docker compose up -d --build"
```

### Environment Variables (.env.example)
```bash
# App
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://transform.solutionprovider.com.bd
NEXT_PUBLIC_APP_URL=https://transform.solutionprovider.com.bd

# Database
DATABASE_URL=postgresql://sp:<password>@postgres:5432/sptransform
DB_PASSWORD=<strong-password>

# Redis
REDIS_URL=redis://redis:6379

# AI Providers
FIREFLY_CLIENT_ID=
FIREFLY_CLIENT_SECRET=
KLING_API_KEY=

# File Storage
UPLOAD_DIR=/app/uploads
OUTPUT_DIR=/app/outputs
MAX_UPLOAD_SIZE_MB=20

# Optional (v2 S3)
# S3_BUCKET=
# S3_REGION=
# S3_ACCESS_KEY=
# S3_SECRET_KEY=
```

---

## 13. Scalability Plan

### Phase 1 — v1.0 (Launch, Month 1–3)
- Single VPS, SQLite → PostgreSQL
- Local file storage
- Manual provider JSON config
- 2 providers: Firefly + Kling
- Target: 100 jobs/month

### Phase 2 — v1.5 (Month 4–6, if volume grows)
- Move file storage to S3-compatible (Cloudflare R2 — cheapest)
- Add horizontal workers (BullMQ worker processes)
- Add 2–3 more providers (Replicate SD, Runway ML, ComfyUI)
- Add auto-zone detection (SAM2 / Segment Anything API)
- Add batch job mode: upload 10 photos → generate all in queue

### Phase 3 — v2.0 (Scale to 1000+ jobs/month)
- Firefly API Enterprise tier (batch, webhook)
- Kubernetes on managed cloud (if needed)
- Customer-facing portal (client submits their own photo)
- WhatsApp/Messenger bot integration (customer sends photo → gets before/after)

---

## 14. Out of Scope (v1.0)

- Mobile app (PWA considered for v1.5)
- Customer-facing interface (internal team only)
- Video editing beyond what Kling provides
- 3D room modeling
- AR preview on device
- Real-time collaboration / multi-user editing of same job
- Stripe / payment integration
- WhatsApp bot

---

## 15. Acceptance Criteria

A job is considered **done** when ALL of these pass:

- [ ] Operator can complete end-to-end job in ≤ 15 minutes
- [ ] Zone painting canvas works on Chrome, Firefox, Edge (latest)
- [ ] Zones (lower/middle/upper) are correctly isolated — no bleed into other zones
- [ ] Generated image: floor, ceiling, windows, doors unchanged from original photo
- [ ] Generated image: cabinet zone reflects the selected preset and color code
- [ ] Video: first 1s shows original photo unchanged
- [ ] Video: 3s smooth transition on cabinet zone only
- [ ] Video: last 1s holds on after-state with subtle push-in
- [ ] Adding a new AI provider requires no code changes to the main app
- [ ] 100 concurrent jobs do not crash the VPS
- [ ] API keys are never exposed in browser network tab
- [ ] All outputs downloadable as PNG + MP4

---

## 16. Glossary

| Term | Definition |
|---|---|
| Zone | A painted region on the customer photo (Lower/Middle/Upper) representing a cabinet area |
| Inpainting | AI technique to replace a masked region of an image while keeping the rest unchanged |
| Mask | Binary image (white = replace, black = keep) sent to inpainting AI |
| Preset | Saved cabinet configuration (finish, color, handles, etc.) reusable across jobs |
| Provider | External AI service (Adobe Firefly, Kling AI, etc.) accessed via API |
| Adapter | TypeScript class implementing the `ProviderAdapter` interface for a specific provider |
| Registry | JSON config files in `/config/providers/` that define provider capabilities |
| Job | A single end-to-end transformation task for one customer photo |
| Composite | Final merged image combining all three zone outputs into one coherent after-image |
| SSE | Server-Sent Events — used to stream real-time job progress to the browser |

---

*Document end. All sections are agent-executable. Variables marked `${...}` are environment secrets. Code blocks are copy-paste ready.*
