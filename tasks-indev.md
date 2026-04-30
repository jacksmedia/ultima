# In-Dev Patcher Migration Tasks

Migrate HTML5-app/Ultima-Plus-Patchapp-main/indev.html to pages/indev.tsx

## Phase 1: Setup (Copy Resources)

- [ ] T001 Copy all indev resources to public/indev/ preserving folder structure

## Phase 2: Core Page Implementation

- [ ] T002 Create pages/indev.tsx with Layout, Head (SEO), and basic structure
- [ ] T003 Define PATCH_CATEGORIES config array with 7 categories: map sprites, portraits, town & dungeon maps, world maps, monsters, battle bgs, mechanics
- [ ] T004 Add GIMMICK_MESSAGES array with 13 random messages for page load
- [ ] T005 Create useState hooks for: romFile, selectedPatches (per category), previewImage, manifest, downloadUrl
- [ ] T006 Implement ROM file upload input with .sfc/.smc accept filter

## Phase 3: Dynamic Patch Selectors

- [ ] T007 Create PatchSelector component that fetches manifest.json and renders select dropdown
- [ ] T008 Render 7 PatchSelector components (one per category) with labels
- [ ] T009 Wire onChange to update selectedPatches state and trigger preview image fetch

## Phase 4: Preview System

- [ ] T010 Create preview container with 400x400 placeholder styling
- [ ] T011 Implement preview image logic: convert .ips selection to .png path, HEAD check, display if exists
- [ ] T012 Handle no-preview case (mechanics category has no PNGs)

## Phase 5: Patching & Download

- [ ] T013 Import applyIPS from lib/patcher.ts
- [ ] T014 Implement "Select These Patches" button click handler
- [ ] T015 Loop through selected patches, fetch each .ips, apply to ROM sequentially
- [ ] T016 Build manifest array of applied patch names
- [ ] T017 Generate Blob download URL and display download link with manifest

## Phase 6: Styling & Polish

- [ ] T018 Add animated gradient background CSS (bgColorShift keyframes)
- [ ] T019 Style to match dark theme of other pages using Tailwind
- [ ] T020 Add abbreviations legend (WS = WonderSwan, BE = Brave Exvius)
- [ ] T021 Add footer credits for Gedankenschild and epigonone
- [ ] T022 Add link to Discord for bug reports

## Resource Summary

**7 Categories:**
1. map sprites (2 patches + previews)
2. portraits (3 patches + previews)
3. town & dungeon maps (1 patch + preview)
4. world maps (1 patch + preview)
5. monsters (1 patch + preview)
6. battle bgs (2 patches + previews)
7. mechanics (3 patches, no previews)

**Total Files:** 29 files (13 IPS + 9 PNG + 7 manifest.json)

## Dependencies

- lib/patcher.ts (existing applyIPS function)
- Layout component
- Tailwind CSS

## Test Criteria

1. Page loads with random gimmick message
2. All 7 category dropdowns populate from manifest.json
3. Selecting a patch shows preview image (except mechanics)
4. ROM upload works for .sfc and .smc files
5. "Select These Patches" applies all selected patches sequentially
6. Download link appears with correct manifest
7. Styling matches dark theme of other pages
