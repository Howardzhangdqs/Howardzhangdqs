import nunjucks from "nunjucks";
import { join } from "node:path";

interface Icon {
  name: string;
  slug: string;
  src: string;
  scale?: number;
  note?: string;
  favorite?: boolean;
}

interface Section {
  label: string;
  icons: Icon[];
}

const ICON_BASE = "https://cdn.simpleicons.org";

function cdnIcon(name: string, slug: string, scale?: number, note?: string, favorite?: boolean): Icon {
  return { name, slug, src: `${ICON_BASE}/${slug}/FFFFFF`, scale, note, favorite };
}

async function localIcon(name: string, file: string, scale?: number): Promise<Icon> {
  const filePath = join(import.meta.dir, "icons", file);
  const svg = (await Bun.file(filePath).text()).replace(/currentColor/g, "#FFFFFF");
  const encoded = encodeURIComponent(svg.trim());
  return { name, slug: file.replace(".svg", ""), src: `data:image/svg+xml,${encoded}`, scale };
}

async function fetchSvg(url: string): Promise<string> {
  const resp = await fetch(url);
  return await resp.text();
}

function parseSvg(svgText: string): { content: string; viewBox: string } {
  const tagMatch = svgText.match(/<svg[^>]*>/i);
  const contentMatch = svgText.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  const tag = tagMatch ? tagMatch[0] : "";
  const content = contentMatch ? contentMatch[1].trim() : svgText;

  const vbMatch = tag.match(/viewBox="([^"]*)"/i);
  const viewBox = vbMatch ? vbMatch[1] : "0 0 24 24";

  let processed = content.replace(/fill="([^"]+)"/g, (m, color) =>
    color === "none" ? m : 'fill="#FFFFFF"'
  );
  processed = processed.replace(/stroke="([^"]+)"/g, (m, color) =>
    color === "none" ? m : 'stroke="#FFFFFF"'
  );

  return { content: processed, viewBox };
}

const sections: Section[] = [
  {
    label: "My most commonly used programming languages",
    icons: [
      cdnIcon("TypeScript", "typescript", 0.9, undefined, true),
      cdnIcon("JavaScript", "javascript", 0.9),
      cdnIcon("Python", "python", undefined, undefined, true),
      cdnIcon("Rust", "rust", undefined, undefined, true),
      cdnIcon("C", "c", 0.85),
      cdnIcon("C++", "cplusplus", 0.85),
      cdnIcon("LaTeX", "latex", 1.2),
      await localIcon("MATLAB", "matlab.svg", 1.05),
      await localIcon("Java", "java.svg", 1.1),
    ],
  },
  {
    label: "My most commonly used development environments",
    icons: [
      cdnIcon("Node.js", "nodedotjs", 1.05, "used to use"),
      cdnIcon("npm", "npm", undefined, "used to use"),
      cdnIcon("pnpm", "pnpm", undefined, "used to use"),
      cdnIcon("Bun", "bun", 1.05, undefined, true),
      cdnIcon("uv", "uv", undefined, undefined, true),
    ],
  },
  {
    label: "My frontend tech stack",
    icons: [
      cdnIcon("Vue.js", "vuedotjs", undefined, undefined, true),
      cdnIcon("React", "react"),
      cdnIcon("Vite", "vite", undefined, undefined, true),
      cdnIcon("Webpack", "webpack", undefined, "used to use"),
      cdnIcon("Vuetify", "vuetify"),
      cdnIcon("WebAssembly", "webassembly"),
    ],
  },
  {
    label: "My backend tech stack",
    icons: [
      cdnIcon("FastAPI", "fastapi", undefined, undefined, true),
      cdnIcon("SQLite", "sqlite"),
      cdnIcon("PostgreSQL", "postgresql"),
    ],
  },
  {
    label: "My deep learning research",
    icons: [
      cdnIcon("PyTorch", "pytorch", undefined, undefined, true),
      cdnIcon("TensorFlow", "tensorflow"),
      cdnIcon("CUDA", "nvidia"),
    ],
  },
  {
    label: "My favorite operating systems",
    icons: [
      await localIcon("Termux", "termux.svg", 1.1),
      cdnIcon("Ubuntu", "ubuntu", undefined, undefined, true),
      cdnIcon("Debian", "debian"),
    ],
  },
];

const BOX_SIZE = 48;
const ICON_SIZE = 32;
const PADDING = (BOX_SIZE - ICON_SIZE) / 2;
const GAP = 10;
const LABEL_FONT_SIZE = 11;
const NOTE_FONT_SIZE = 9;
const LABEL_HEIGHT = 16;
const NOTE_HEIGHT = 14;

const GRADIENTS = [
  { x1: "0%", y1: "0%", x2: "100%", y2: "100%", colors: ["#00f2fe", "#7f00ff", "#f093fb"] },
];

const ASSETS_DIR = join(import.meta.dir, "assets");

const sectionFiles: string[] = [];

for (let si = 0; si < sections.length; si++) {
  const section = sections[si]!;
  const rowWidth = section.icons.length * BOX_SIZE + (section.icons.length - 1) * GAP;
  const svgWidth = rowWidth + 40;
  const hasFav = section.icons.some(ic => ic.favorite);
  const hasNote = section.icons.some(ic => ic.note);
  const svgHeight = BOX_SIZE + LABEL_HEIGHT + (hasNote ? NOTE_HEIGHT : 0) + 20;
  const startX = 20;

  const defsParts: string[] = [];
  let localFavIdx = 0;
  if (hasFav) {
    defsParts.push("<defs>");
    defsParts.push(`<filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>`);
    for (const ic of section.icons) {
      if (!ic.favorite) continue;
      const g = GRADIENTS[localFavIdx % GRADIENTS.length];
      const stops = g.colors.map((c, ci) => `<stop offset="${Math.round(ci / (g.colors.length - 1) * 100)}%" stop-color="${c}"/>`).join("");
      defsParts.push(`<linearGradient id="fav-${localFavIdx}" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">${stops}</linearGradient>`);
      localFavIdx++;
    }
    defsParts.push("</defs>");
    localFavIdx = 0;
  }

  const iconParts: string[] = [];

  for (let i = 0; i < section.icons.length; i++) {
    const icon = section.icons[i]!;
    const x = startX + i * (BOX_SIZE + GAP);
    const y = 10;
    const scale = icon.scale ?? 1;
    const offset = (ICON_SIZE * (1 - scale)) / 2;

    let parsed: { content: string; viewBox: string };
    if (icon.src.startsWith("data:image/svg+xml,")) {
      const decoded = decodeURIComponent(icon.src.slice("data:image/svg+xml,".length));
      parsed = parseSvg(decoded);
    } else {
      const fetched = await fetchSvg(icon.src);
      parsed = parseSvg(fetched);
    }

    const isFav = icon.favorite === true;
    const boxFill = "#0d1117";
    const boxStroke = isFav ? `url(#fav-${localFavIdx++})` : "none";
    const boxStrokeWidth = isFav ? 2 : 0;
    const boxFilter = isFav ? 'filter="url(#glow)"' : "";

    iconParts.push(`<g transform="translate(${x}, ${y})">`);
    iconParts.push(`<rect width="${BOX_SIZE}" height="${BOX_SIZE}" rx="6" fill="${boxFill}" stroke="${boxStroke}" stroke-width="${boxStrokeWidth}" ${boxFilter}/>`);
    iconParts.push(`<svg x="${PADDING + offset}" y="${PADDING + offset}" width="${ICON_SIZE * scale}" height="${ICON_SIZE * scale}" viewBox="${parsed.viewBox}" fill="#FFFFFF">`);
    iconParts.push(parsed.content);
    iconParts.push(`</svg>`);
    iconParts.push(`</g>`);
    iconParts.push(`<text x="${x + BOX_SIZE / 2}" y="${y + BOX_SIZE + LABEL_FONT_SIZE + 2}" fill="#8b949e" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="${LABEL_FONT_SIZE}" text-anchor="middle">${icon.name}</text>`);
    if (icon.note) {
      iconParts.push(`<text x="${x + BOX_SIZE / 2}" y="${y + BOX_SIZE + LABEL_FONT_SIZE + NOTE_FONT_SIZE + 4}" fill="#6e7681" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="${NOTE_FONT_SIZE}" text-anchor="middle" font-style="italic">${icon.note}</text>`);
    }
  }

  const fileName = `section-${si + 1}.svg`;
  const sectionSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
${defsParts.join("\n")}
${iconParts.join("\n")}
</svg>`;
  await Bun.write(join(ASSETS_DIR, fileName), sectionSvg);
  sectionFiles.push(`assets/${fileName}`);
}

nunjucks.configure(join(import.meta.dir, "templates"), { autoescape: false });

const readme = nunjucks.render("README.njk", { sections: sections.map((s, i) => ({ label: s.label, svgPath: sectionFiles[i] })) });

await Bun.write(join(import.meta.dir, "README.md"), readme);

console.log("README.md generated!");
