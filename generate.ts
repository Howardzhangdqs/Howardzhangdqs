import nunjucks from "nunjucks";
import { join } from "node:path";

interface Icon {
  name: string;
  slug: string;
  src: string;
  scale?: number;
}

interface Section {
  label: string;
  icons: Icon[];
}

const ICON_BASE = "https://cdn.simpleicons.org";

function cdnIcon(name: string, slug: string, scale?: number): Icon {
  return { name, slug, src: `${ICON_BASE}/${slug}/FFFFFF`, scale };
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
      cdnIcon("TypeScript", "typescript", 0.9),
      cdnIcon("JavaScript", "javascript", 0.9),
      cdnIcon("Python", "python"),
      cdnIcon("Rust", "rust"),
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
      cdnIcon("Node.js", "nodedotjs", 1.05),
      cdnIcon("npm", "npm"),
      cdnIcon("pnpm", "pnpm"),
      cdnIcon("Bun", "bun", 1.05),
      cdnIcon("uv", "uv"),
    ],
  },
  {
    label: "My frontend tech stack",
    icons: [
      cdnIcon("Vue.js", "vuedotjs"),
      cdnIcon("React", "react"),
      cdnIcon("Vite", "vite"),
      cdnIcon("Vuetify", "vuetify"),
      cdnIcon("Webpack", "webpack"),
    ],
  },
  {
    label: "My favorite operating systems",
    icons: [
      await localIcon("Termux", "termux.svg", 1.1),
      cdnIcon("Ubuntu", "ubuntu"),
      cdnIcon("Debian", "debian"),
    ],
  },
];

const BOX_SIZE = 48;
const ICON_SIZE = 32;
const PADDING = (BOX_SIZE - ICON_SIZE) / 2;
const GAP = 10;

const sectionSvgs: string[] = [];

for (const section of sections) {
  const rowWidth = section.icons.length * BOX_SIZE + (section.icons.length - 1) * GAP;
  const svgWidth = rowWidth + 40;
  const svgHeight = BOX_SIZE + 20;
  const startX = 20;

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

    iconParts.push(`<g transform="translate(${x}, ${y})">`);
    iconParts.push(`<rect width="${BOX_SIZE}" height="${BOX_SIZE}" rx="6" fill="#0d1117"/>`);
    iconParts.push(`<svg x="${PADDING + offset}" y="${PADDING + offset}" width="${ICON_SIZE * scale}" height="${ICON_SIZE * scale}" viewBox="${parsed.viewBox}" fill="#FFFFFF">`);
    iconParts.push(parsed.content);
    iconParts.push(`</svg>`);
    iconParts.push(`</g>`);
  }

  const sectionSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
${iconParts.join("\n")}
</svg>`;
  sectionSvgs.push(sectionSvg);
}

nunjucks.configure(join(import.meta.dir, "templates"), { autoescape: false });

const readme = nunjucks.render("README.njk", { sections: sections.map((s, i) => ({ label: s.label, svg: sectionSvgs[i] })) });

await Bun.write(join(import.meta.dir, "README.md"), readme);

console.log("README.md generated!");
