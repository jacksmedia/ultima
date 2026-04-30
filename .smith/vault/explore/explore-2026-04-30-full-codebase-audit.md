---
explored: 2026-04-30
status: conflicts-found
scope: all
feature: Full codebase audit for refactoring and LoC efficiency
---

# Exploration: Full Codebase Audit

## Proposed Change
Comprehensive audit of the FF4 Ultima Patcher codebase to identify refactoring opportunities, dead code, redundancies, and LoC efficiency improvements. Project built over ~1 year in fits and starts.

## Scope
- **Components**: 25 files audited
- **Lib utilities**: 7 files audited
- **Pages**: 11 files audited
- **Config/CSS**: next.config.ts, global.css, page.module.css, layout.tsx
- **Total LoC**: ~4,305 lines (excluding node_modules)

## Findings

### Dead Code (Delete Immediately)

| File | Lines | Issue |
|------|-------|-------|
| ✅ `lib/styles.ts` | 560 | **100% commented out** - legacy DOM manipulation code |
| ✅ `page.module.css` | 169 | **Not imported anywhere** - Next.js boilerplate |
| ✅ `components/FileUpload2.tsx` | ~40 | Obsolete/incomplete, superseded by FileUploader |
| ❌ `components/RomVerifier.tsx` | ~60 | Superseded by ExtensibleRomVerifier |
| ✅ `components/ConfigManager.tsx` | ~30 | Unused placeholder |
| ✅ `components/ApplyPatches.tsx` | ~30 | Has "needs implement" comment, incomplete |
| ✅ `components/PatchButton.tsx` | ~30 | Unused placeholder |
| ✅ `components/PatchSelector.tsx` | ~30 | Unused placeholder |

**Total dead code: ~950 lines (22% of codebase)**

### Component Consolidation Opportunities

| Current | Proposed | Lines Saved |
|---------|----------|-------------|
| `RomVerifier.tsx` | Use ExtensibleRomVerifier.tsx | ~60 |
| Map1.tsx, Map2.tsx, Map3.tsx | Single `<MapImage>` component | ~30 |
| DownloadRomButton.tsx, DownloadRomButtonClassic.tsx | Single parameterized component | ~70 |
| PlusTitle.tsx, ClassicTitle.tsx | Use BothTitles or parameterize | ~25 |
| ClassicPatcher.tsx, PlusPatcher.tsx | Shared `<RomPatcher>` base | ~100+ |
| StylesPanel.tsx, CustomOptionsPanel.tsx | Single `<PatchPanel>` component | ~150 |

**Potential savings: 375-500 lines**

### Lib Consolidation

| Issue | Files | Recommendation |
|-------|-------|----------------|
| Duplicate CRC32 | `lib/crc32.ts` uses `crc-32`, `lib/RomUtilities.ts` uses `crc` | Remove crc32.ts, standardize on one package |
| Duplicate IPS patching | `lib/IpsPatcher.ts`, `lib/patcher.ts` | Merge into single implementation with bounds checking + buffer expansion |
| Unclear utility | `lib/patchFetch.ts` | Verify usage, add type safety or remove |

### Pages Consolidation

| Issue | Files | Recommendation |
|-------|-------|----------------|
| 80% identical | underworldmap.tsx, overworldmap.tsx, lunarmap.tsx | Convert to dynamic route `/maps/[mapname].tsx` |
| Mixed extensions | `_app.js` vs all other `.tsx` | Rename to `_app.tsx` with types |

### Code Quality Issues

1. **Buffer overflow risk** - `lib/patcher.ts:49-51` RLE fills without growing buffer first
2. **Inefficient buffer growth** - `lib/IpsPatcher.ts:86-103` grows buffer per chunk instead of pre-allocating
3. **Missing SEO** - 10/11 pages missing custom meta tags (only optional.tsx has them)
4. **Duplicate npm packages** - Both `crc` and `crc-32` in package.json for same purpose
5. **Global CSS pollution** - `global.css` has component-specific styles that should be scoped

### Architecture Notes

**Good patterns found:**
- Shared Layout component correctly used across all pages
- Tailwind CSS properly integrated
- getStaticProps for manifest loading (index.tsx, classic.tsx)
- ExtensibleRomVerifier has good pluggable validation pattern

**Inconsistencies:**
- Some components use inline styles, others use Tailwind, others use global CSS classes
- No consistent error handling pattern across patchers
- State management varies (some useState, some prop drilling)

## Conflicts

### WARNING (Should Address)
- [ ] **Duplicate npm packages** - Remove either `crc` or `crc-32`, standardize
- [ ] **Buffer overflow risk** - Fix patcher.ts before it causes silent data corruption
- [ ] **Mixed file extensions** - Convert _app.js to _app.tsx
- [ ] **CSS architecture** - Component styles in global.css should be scoped or moved to Tailwind

### INFO (Context)
- Project uses Pages Router (not App Router) - migration would be major effort
- Public folder has 200+ IPS patches and PNG previews - legitimate game mod assets
- ulti.tsx at 488 lines is largest page - consider breaking into smaller components

## Recommendations

### Phase 1: Quick Wins (1-2 hours)
1. Delete dead code files (~950 lines)
2. Remove duplicate npm package (crc or crc-32)
3. Rename _app.js → _app.tsx

### Phase 2: Component Consolidation (4-6 hours)
1. Merge Map1/2/3 → single component
2. Merge DownloadRomButton variants
3. Merge Title variants
4. Convert map pages to dynamic route

### Phase 3: Major Refactors (1-2 days)
1. Create shared RomPatcher base component
2. Merge StylesPanel + CustomOptionsPanel
3. Consolidate IPS patching logic with proper bounds checking
4. Add custom meta tags to all pages

### Estimated Impact
- **Lines removed**: 950 (dead code)
- **Lines consolidated**: 400-500
- **Net reduction**: ~30% of current codebase
- **Maintainability**: Significantly improved through single-source-of-truth patterns

## Proceed?

Based on this exploration:
- [ ] **Clear to proceed** — no blocking issues
- [x] **Proceed with caution** — warnings to address
- [ ] **Do not proceed** — blocking issues require resolution first

**Recommended next step**: Start with Phase 1 quick wins to establish momentum and verify no hidden dependencies before larger refactors.
