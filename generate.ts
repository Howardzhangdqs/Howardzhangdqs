import nunjucks from "nunjucks";
import { join } from "node:path";

interface Icon {
  name: string;
  slug: string;
  src: string;
}

interface Section {
  label: string;
  icons: Icon[];
}

const ICON_BASE = "https://cdn.simpleicons.org";

function cdnIcon(name: string, slug: string): Icon {
  return { name, slug, src: `${ICON_BASE}/${slug}/FFFFFF` };
}

async function localIcon(name: string, file: string): Promise<Icon> {
  const svg = (await Bun.file(join(import.meta.dir, "icons", file)).text()).replace(/currentColor/g, "#FFFFFF");
  const encoded = encodeURIComponent(svg.trim());
  return { name, slug: file.replace(".svg", ""), src: `data:image/svg+xml,${encoded}` };
}

const sections: Section[] = [
  {
    label: "My most commonly used programming languages",
    icons: [
      cdnIcon("TypeScript", "typescript"),
      cdnIcon("JavaScript", "javascript"),
      cdnIcon("Python", "python"),
      cdnIcon("Rust", "rust"),
      cdnIcon("C", "c"),
      cdnIcon("C++", "cplusplus"),
      cdnIcon("LaTeX", "latex"),
      await localIcon("MATLAB", "matlab.svg"),
      await localIcon("Java", "java.svg"),
    ],
  },
  {
    label: "My most commonly used development environments",
    icons: [
      cdnIcon("Node.js", "nodedotjs"),
      cdnIcon("npm", "npm"),
      cdnIcon("pnpm", "pnpm"),
      cdnIcon("Bun", "bun"),
      cdnIcon("uv", "uv"),
    ],
  },
];

nunjucks.configure(join(import.meta.dir, "templates"), { autoescape: false });

const readme = nunjucks.render("README.njk", { sections });

await Bun.write(join(import.meta.dir, "README.md"), readme);

console.log("README.md generated!");
