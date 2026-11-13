# Platform & Runtime Compatibility Matrix

This document defines the supported host applications, operating systems, GPU graphics backends, and known API limitations for `ae-effects-cavalry`.

---

## 1. Supported Applications & Engines

| Software | Supported Versions | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Cavalry** | **2.8.0+** | **Fully Supported** | Primary target application. Validated on Cavalry 2.8+. |
| **Cavalry** | 2.5 – 2.7 | Untested / Partial | May lack certain SkSL filter dynamic slot binding features. |
| **Adobe After Effects** | CC 2020 – 2024 | Reference Standard | Serves as the mathematical and visual reference specification. |

---

## 2. Operating Systems

| OS | Architectures | Cavalry GUI Panel | CLI / Test Suite | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Windows 10 / 11** | x86_64 | Supported (`%APPDATA%\Cavalry\Scripts`) | Node 18, 20, 22 | **Verified** |
| **macOS 12+** | Apple Silicon (arm64), Intel (x86_64) | Supported (`~/Library/Application Support/Cavalry/Scripts`) | Node 18, 20, 22 | **Verified** |
| **Linux** (Ubuntu 20.04+) | x86_64 | Supported (where Cavalry is available) | Node 18, 20, 22 | **Verified** |

---

## 3. GPU Backends & SkSL Shader Capabilities

Cavalry uses Google Skia for its 2D rendering pipeline, compiling SkSL (Skia Shading Language) into native GPU bytecode via the host platform's graphics API:
- **Direct3D 12** (Windows)
- **Metal** (macOS)
- **Vulkan** (Windows, Linux, Android)
- **OpenGL / OpenGL ES** (Legacy fallback)

### SkSL Constraints & Design Rules

To ensure universal compatibility across all GPU backends:
1. **No Recursion**: SkSL prohibits recursive function calls. All algorithms are non-recursive.
2. **Compile-Time Constant Loop Bounds**: Dynamic loop conditions (`for (int i = 0; i < dynamicCount; i++)`) can cause shader compilation errors on certain GPU drivers. All shader loops in this library use fixed compile-time constants (e.g. `const int TAPS = 37;`).
3. **Single-Pass Architecture**: Cavalry's `skslFilter` evaluates a single fragment pass. Multi-pass algorithms (e.g. separable Gaussian blur, bloom pyramids) are mathematically mapped into single-pass 2D Vogel golden-spiral convolutions or compound analytical falloffs.

---

## 4. Standalone Cavalry Script Environment

The standalone distribution script (`cavalry-script/AE Effects.js`) runs inside Cavalry's embedded V8 JavaScript environment.

### Embedded Runtime Characteristics:
- **No Node.js APIs**: Modules such as `fs`, `path`, `http`, or `process` are **not available** inside Cavalry's script runner.
- **Zero Dependencies**: The script is 100% self-contained. All effect definitions, parameter maps, and UI definitions are bundled directly into the file.
- **Portability**: Does not depend on external paths or local development folders. If the original development source tree is deleted or moved, the script continues to operate without degradation.

---

## 5. Known API Limitations

1. **Selection Preconditions**:
   - SkSL Filters require at least one visual renderable layer selected (Shape, Text, Group, Image, or Pre-Comp).
   - Composition workflows (`Null Object`, `Adjustment Layer`) gracefully support empty selections:
     - `Null Object` instantiates at `(0, 0)` when nothing is selected.
     - `Adjustment Layer` wraps all root composition layers when nothing is selected.
2. **Dynamic Slot Names**:
   Cavalry dynamic attribute keys must adhere to standard camelCase naming without special characters or spaces.
3. **Filter Ordering**:
   Cavalry evaluates attached filters in array index order. Applying multiple effects chains them sequentially.
