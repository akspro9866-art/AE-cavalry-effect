import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const regPath = path.join(ROOT, 'effect-registry.json');
const reg = JSON.parse(fs.readFileSync(regPath, 'utf8'));

const newEffects = {
  "levels": {
    "version": "1.0.0",
    "aeName": "Levels",
    "aeMatchName": "ADBE Levels2",
    "aeCategory": "Color Correction",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/levels/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/levels/implementation.js",
      "sksl": "effects/levels/levels.sksl",
      "parameterMap": "effects/levels/parameter-map.json",
      "technicalNotes": "effects/levels/technical-notes.md",
      "readme": "effects/levels/README.md"
    },
    "aliases": ["levels", "levels2", "adbe levels2", "color levels"]
  },
  "exposure": {
    "version": "1.0.0",
    "aeName": "Exposure",
    "aeMatchName": "ADBE Exposure2",
    "aeCategory": "Color Correction",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/exposure/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/exposure/implementation.js",
      "sksl": "effects/exposure/exposure.sksl",
      "parameterMap": "effects/exposure/parameter-map.json",
      "technicalNotes": "effects/exposure/technical-notes.md",
      "readme": "effects/exposure/README.md"
    },
    "aliases": ["exposure", "adbe exposure2", "exposure2"]
  },
  "hue-saturation": {
    "version": "1.0.0",
    "aeName": "Hue/Saturation",
    "aeMatchName": "ADBE HUE SATURATION",
    "aeCategory": "Color Correction",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/hue-saturation/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/hue-saturation/implementation.js",
      "sksl": "effects/hue-saturation/hue-saturation.sksl",
      "parameterMap": "effects/hue-saturation/parameter-map.json",
      "technicalNotes": "effects/hue-saturation/technical-notes.md",
      "readme": "effects/hue-saturation/README.md"
    },
    "aliases": ["hue saturation", "hue/saturation", "hue_saturation", "adbe hue saturation"]
  },
  "posterize": {
    "version": "1.0.0",
    "aeName": "Posterize",
    "aeMatchName": "ADBE Posterize",
    "aeCategory": "Color Correction",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/posterize/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/posterize/implementation.js",
      "sksl": "effects/posterize/posterize.sksl",
      "parameterMap": "effects/posterize/parameter-map.json",
      "technicalNotes": "effects/posterize/technical-notes.md",
      "readme": "effects/posterize/README.md"
    },
    "aliases": ["posterize", "adbe posterize"]
  },
  "sharpen": {
    "version": "1.0.0",
    "aeName": "Sharpen",
    "aeMatchName": "ADBE Sharpen",
    "aeCategory": "Blur & Sharpen",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/sharpen/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/sharpen/implementation.js",
      "sksl": "effects/sharpen/sharpen.sksl",
      "parameterMap": "effects/sharpen/parameter-map.json",
      "technicalNotes": "effects/sharpen/technical-notes.md",
      "readme": "effects/sharpen/README.md"
    },
    "aliases": ["sharpen", "adbe sharpen", "unsharp mask"]
  },
  "mosaic": {
    "version": "1.0.0",
    "aeName": "Mosaic",
    "aeMatchName": "ADBE Mosaic",
    "aeCategory": "Stylize",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/mosaic/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/mosaic/implementation.js",
      "sksl": "effects/mosaic/mosaic.sksl",
      "parameterMap": "effects/mosaic/parameter-map.json",
      "technicalNotes": "effects/mosaic/technical-notes.md",
      "readme": "effects/mosaic/README.md"
    },
    "aliases": ["mosaic", "adbe mosaic", "pixelate"]
  },
  "directional-blur": {
    "version": "1.0.0",
    "aeName": "Directional Blur",
    "aeMatchName": "ADBE Directional Blur",
    "aeCategory": "Blur & Sharpen",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/directional-blur/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/directional-blur/implementation.js",
      "sksl": "effects/directional-blur/directional-blur.sksl",
      "parameterMap": "effects/directional-blur/parameter-map.json",
      "technicalNotes": "effects/directional-blur/technical-notes.md",
      "readme": "effects/directional-blur/README.md"
    },
    "aliases": ["directional blur", "directional_blur", "adbe directional blur", "motion blur linear"]
  },
  "fast-box-blur": {
    "version": "1.0.0",
    "aeName": "Fast Box Blur",
    "aeMatchName": "ADBE Box Blur2",
    "aeCategory": "Blur & Sharpen",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/fast-box-blur/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/fast-box-blur/implementation.js",
      "sksl": "effects/fast-box-blur/fast-box-blur.sksl",
      "parameterMap": "effects/fast-box-blur/parameter-map.json",
      "technicalNotes": "effects/fast-box-blur/technical-notes.md",
      "readme": "effects/fast-box-blur/README.md"
    },
    "aliases": ["fast box blur", "box blur", "adbe box blur2", "box_blur"]
  },
  "radial-blur": {
    "version": "1.0.0",
    "aeName": "Radial Blur",
    "aeMatchName": "ADBE Radial Blur",
    "aeCategory": "Blur & Sharpen",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/radial-blur/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/radial-blur/implementation.js",
      "sksl": "effects/radial-blur/radial-blur.sksl",
      "parameterMap": "effects/radial-blur/parameter-map.json",
      "technicalNotes": "effects/radial-blur/technical-notes.md",
      "readme": "effects/radial-blur/README.md"
    },
    "aliases": ["radial blur", "radial_blur", "adbe radial blur", "zoom blur", "spin blur"]
  },
  "drop-shadow": {
    "version": "1.0.0",
    "aeName": "Drop Shadow",
    "aeMatchName": "ADBE Drop Shadow",
    "aeCategory": "Perspective",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/drop-shadow/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/drop-shadow/implementation.js",
      "sksl": "effects/drop-shadow/drop-shadow.sksl",
      "parameterMap": "effects/drop-shadow/parameter-map.json",
      "technicalNotes": "effects/drop-shadow/technical-notes.md",
      "readme": "effects/drop-shadow/README.md"
    },
    "aliases": ["drop shadow", "drop_shadow", "adbe drop shadow", "shadow"]
  },
  "glow": {
    "version": "1.0.0",
    "aeName": "Glow",
    "aeMatchName": "ADBE Glo2",
    "aeCategory": "Stylize",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/glow/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/glow/implementation.js",
      "sksl": "effects/glow/glow.sksl",
      "parameterMap": "effects/glow/parameter-map.json",
      "technicalNotes": "effects/glow/technical-notes.md",
      "readme": "effects/glow/README.md"
    },
    "aliases": ["glow", "adbe glo2", "ae glow", "standard glow"]
  },
  "cc-light-sweep": {
    "version": "1.0.0",
    "aeName": "CC Light Sweep",
    "aeMatchName": "CC Light Sweep",
    "aeCategory": "Generate",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/cc-light-sweep/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/cc-light-sweep/implementation.js",
      "sksl": "effects/cc-light-sweep/cc-light-sweep.sksl",
      "parameterMap": "effects/cc-light-sweep/parameter-map.json",
      "technicalNotes": "effects/cc-light-sweep/technical-notes.md",
      "readme": "effects/cc-light-sweep/README.md"
    },
    "aliases": ["cc light sweep", "light sweep", "sweep", "shine sweep"]
  },
  "bevel-alpha": {
    "version": "1.0.0",
    "aeName": "Bevel Alpha",
    "aeMatchName": "ADBE Bevel Alpha",
    "aeCategory": "Perspective",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/bevel-alpha/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/bevel-alpha/implementation.js",
      "sksl": "effects/bevel-alpha/bevel-alpha.sksl",
      "parameterMap": "effects/bevel-alpha/parameter-map.json",
      "technicalNotes": "effects/bevel-alpha/technical-notes.md",
      "readme": "effects/bevel-alpha/README.md"
    },
    "aliases": ["bevel alpha", "bevel_alpha", "adbe bevel alpha", "emboss alpha"]
  },
  "wave-warp": {
    "version": "1.0.0",
    "aeName": "Wave Warp",
    "aeMatchName": "ADBE Wave Warp",
    "aeCategory": "Distort",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/wave-warp/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/wave-warp/implementation.js",
      "sksl": "effects/wave-warp/wave-warp.sksl",
      "parameterMap": "effects/wave-warp/parameter-map.json",
      "technicalNotes": "effects/wave-warp/technical-notes.md",
      "readme": "effects/wave-warp/README.md"
    },
    "aliases": ["wave warp", "wave_warp", "adbe wave warp", "sine warp"]
  },
  "motion-tile": {
    "version": "1.0.0",
    "aeName": "Motion Tile",
    "aeMatchName": "ADBE Tile",
    "aeCategory": "Stylize",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/motion-tile/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/motion-tile/implementation.js",
      "sksl": "effects/motion-tile/motion-tile.sksl",
      "parameterMap": "effects/motion-tile/parameter-map.json",
      "technicalNotes": "effects/motion-tile/technical-notes.md",
      "readme": "effects/motion-tile/README.md"
    },
    "aliases": ["motion tile", "tile", "adbe tile", "mirror tile"]
  },
  "displacement-map": {
    "version": "1.0.0",
    "aeName": "Displacement Map",
    "aeMatchName": "ADBE Displacement Map",
    "aeCategory": "Distort",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/displacement-map/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/displacement-map/implementation.js",
      "sksl": "effects/displacement-map/displacement-map.sksl",
      "parameterMap": "effects/displacement-map/parameter-map.json",
      "technicalNotes": "effects/displacement-map/technical-notes.md",
      "readme": "effects/displacement-map/README.md"
    },
    "aliases": ["displacement map", "displacement_map", "adbe displacement map", "displace"]
  },
  "cc-kaleida": {
    "version": "1.0.0",
    "aeName": "CC Kaleida",
    "aeMatchName": "CC Kaleida",
    "aeCategory": "Stylize",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/cc-kaleida/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/cc-kaleida/implementation.js",
      "sksl": "effects/cc-kaleida/cc-kaleida.sksl",
      "parameterMap": "effects/cc-kaleida/parameter-map.json",
      "technicalNotes": "effects/cc-kaleida/technical-notes.md",
      "readme": "effects/cc-kaleida/README.md"
    },
    "aliases": ["cc kaleida", "kaleida", "kaleidoscope"]
  },
  "optics-compensation": {
    "version": "1.0.0",
    "aeName": "Optics Compensation",
    "aeMatchName": "ADBE Optics Compensation",
    "aeCategory": "Distort",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/optics-compensation/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/optics-compensation/implementation.js",
      "sksl": "effects/optics-compensation/optics-compensation.sksl",
      "parameterMap": "effects/optics-compensation/parameter-map.json",
      "technicalNotes": "effects/optics-compensation/technical-notes.md",
      "readme": "effects/optics-compensation/README.md"
    },
    "aliases": ["optics compensation", "optics_compensation", "adbe optics compensation", "lens distortion", "fisheye"]
  },
  "venetian-blinds": {
    "version": "1.0.0",
    "aeName": "Venetian Blinds",
    "aeMatchName": "ADBE Venetian Blinds",
    "aeCategory": "Transition",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/venetian-blinds/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/venetian-blinds/implementation.js",
      "sksl": "effects/venetian-blinds/venetian-blinds.sksl",
      "parameterMap": "effects/venetian-blinds/parameter-map.json",
      "technicalNotes": "effects/venetian-blinds/technical-notes.md",
      "readme": "effects/venetian-blinds/README.md"
    },
    "aliases": ["venetian blinds", "venetian_blinds", "adbe venetian blinds", "blinds"]
  },
  "curves": {
    "version": "1.0.0",
    "aeName": "Curves",
    "aeMatchName": "ADBE CurvesCustom",
    "aeCategory": "Color Correction",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/curves/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/curves/implementation.js",
      "sksl": "effects/curves/curves.sksl",
      "parameterMap": "effects/curves/parameter-map.json",
      "technicalNotes": "effects/curves/technical-notes.md",
      "readme": "effects/curves/README.md"
    },
    "aliases": ["curves", "adbe curvescustom", "rgb curves", "color curves"]
  },
  "color-balance": {
    "version": "1.0.0",
    "aeName": "Color Balance",
    "aeMatchName": "ADBE Color Balance2",
    "aeCategory": "Color Correction",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/color-balance/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/color-balance/implementation.js",
      "sksl": "effects/color-balance/color-balance.sksl",
      "parameterMap": "effects/color-balance/parameter-map.json",
      "technicalNotes": "effects/color-balance/technical-notes.md",
      "readme": "effects/color-balance/README.md"
    },
    "aliases": ["color balance", "color_balance", "adbe color balance2", "color balance2"]
  },
  "gradient-ramp": {
    "version": "1.0.0",
    "aeName": "Gradient Ramp",
    "aeMatchName": "ADBE Ramp",
    "aeCategory": "Generate",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/gradient-ramp/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/gradient-ramp/implementation.js",
      "sksl": "effects/gradient-ramp/gradient-ramp.sksl",
      "parameterMap": "effects/gradient-ramp/parameter-map.json",
      "technicalNotes": "effects/gradient-ramp/technical-notes.md",
      "readme": "effects/gradient-ramp/README.md"
    },
    "aliases": ["gradient ramp", "ramp", "adbe ramp", "linear ramp", "radial ramp"]
  },
  "find-edges": {
    "version": "1.0.0",
    "aeName": "Find Edges",
    "aeMatchName": "ADBE Find Edges",
    "aeCategory": "Stylize",
    "status": "mock-tested",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/find-edges/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/find-edges/implementation.js",
      "sksl": "effects/find-edges/find-edges.sksl",
      "parameterMap": "effects/find-edges/parameter-map.json",
      "technicalNotes": "effects/find-edges/technical-notes.md",
      "readme": "effects/find-edges/README.md"
    },
    "aliases": ["find edges", "find_edges", "adbe find edges", "edge detection"]
  },
  "echo": {
    "version": "1.0.0",
    "aeName": "Echo",
    "aeMatchName": "ADBE Echo",
    "aeCategory": "Time",
    "status": "approximation",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/echo/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/echo/implementation.js",
      "sksl": "effects/echo/echo.sksl",
      "parameterMap": "effects/echo/parameter-map.json",
      "technicalNotes": "effects/echo/technical-notes.md",
      "readme": "effects/echo/README.md"
    },
    "aliases": ["echo", "adbe echo", "motion trail", "temporal echo"]
  },
  "time-displacement": {
    "version": "1.0.0",
    "aeName": "Time Displacement",
    "aeMatchName": "ADBE Time Displacement",
    "aeCategory": "Time",
    "status": "approximation",
    "primaryStrategy": "sksl-filter",
    "cavalryNodeTypes": ["skslFilter"],
    "entryScript": "effects/time-displacement/implementation.js",
    "metadata": {
      "requiresSelection": true,
      "supportsMultipleLayers": true,
      "supportsEmptySelection": false,
      "supportsAnimation": true,
      "supportsKeyframes": true
    },
    "artifacts": {
      "implementation": "effects/time-displacement/implementation.js",
      "sksl": "effects/time-displacement/time-displacement.sksl",
      "parameterMap": "effects/time-displacement/parameter-map.json",
      "technicalNotes": "effects/time-displacement/technical-notes.md",
      "readme": "effects/time-displacement/README.md"
    },
    "aliases": ["time displacement", "time_displacement", "adbe time displacement", "time lag"]
  }
};

for (const [slug, def] of Object.entries(newEffects)) {
  // Validate that all referenced artifacts exist
  for (const [artKey, artPath] of Object.entries(def.artifacts)) {
    const absPath = path.join(ROOT, artPath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`Missing artifact for ${slug}: ${artKey} at ${absPath}`);
    }
  }
  reg.effects[slug] = def;
}

fs.writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n', 'utf8');
console.log(`Successfully updated effect-registry.json with ${Object.keys(reg.effects).length} total effects!`);
