# Contributing to AE Effects for Cavalry

Thank you for your interest in contributing to `ae-effects-cavalry`! We welcome contributions that expand our effect catalog, improve mathematical accuracy, optimize GPU shaders, or enhance cross-platform tooling.

---

## 1. Cleanroom Implementation Policy

To preserve the integrity, legality, and open-source licensing of this project, all contributors must strictly adhere to our cleanroom engineering standard:

1. **Independent Mathematical Reconstruction**:
   - Algorithms must be derived from first principles, published computer graphics literature (e.g. SIGGRAPH papers, textbook equations), or standard signal processing techniques.
   - **Do not inspect, decompile, reverse-engineer, or extract code from proprietary binaries, DLLs, plugins, or closed-source applications.**
2. **Open Source Shaders**:
   - Any reference shaders incorporated must carry compatible open-source licenses (MIT, Apache 2.0, BSD) and be properly attributed in the shader header and `PROVENANCE.md`.
3. **Nominative Trademark Usage**:
   - Reference to Adobe After Effects, Cycore, or third-party plugin names is strictly nominative for compatibility description. Do not claim official endorsement or affiliation.

---

## 2. Contribution Workflow

1. **Fork & Branch**:
   Create a feature branch with a descriptive name:
   ```bash
   git checkout -b feature/radial-fast-blur
   ```

2. **Develop the Effect**:
   Follow the directory structure outlined in [DEVELOPMENT.md](DEVELOPMENT.md):
   ```
   effects/<slug>/
   ├── <slug>.sksl
   ├── parameter-map.json
   ├── math-model.mjs
   ├── implementation.js
   ├── README.md
   └── technical-notes.md
   ```

3. **Register in `effect-registry.json`**:
   Add the new effect definition following Schema v1.1.0.

4. **Synchronize Artifacts**:
   Always run the synchronizer scripts to update embedded sources and bundle outputs:
   ```bash
   npm run sync:embedded
   npm run sync:script
   npm run sync:agents
   ```

5. **Author Tests**:
   Create `test/<slug>.test.mjs` verifying:
   - Tier 1: Static validation and embedded sync.
   - Tier 2: Mathematical invariants and boundary conditions.
   - Tier 3: Headless Mock Stallion execution and dynamic slot provisioning.

6. **Validate Locally**:
   Ensure all checks pass cleanly:
   ```bash
   npm test
   npm run check
   ```

7. **Submit a Pull Request**:
   Describe your mathematical formulation, list verified tiers, and reference any academic papers or published articles used in your research.

---

## 3. Pull Request Checklist

Before submitting your PR, verify that:
- [ ] `npm test` passes 100% of unit tests with zero failures.
- [ ] `npm run check` confirms all embedded shaders, agent configurations, and distribution scripts match source files with zero diffs.
- [ ] No machine-specific or developer-specific file paths are committed.
- [ ] New parameters have sensible defaults, types, and descriptive tooltips.
- [ ] Implementation returns the standardized error contract (`scripts/lib/effect-runtime.mjs`).
- [ ] Cleanroom provenance is documented and no proprietary code is present.
