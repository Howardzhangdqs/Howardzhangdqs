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
  const svg = (await Bun.file(join(import.meta.dir, "icons", file)).text()).replace(/currentColor/g, "#FFFFFF");
  const encoded = encodeURIComponent(svg.trim());
  return { name, slug: file.replace(".svg", ""), src: `data:image/svg+xml,${encoded}`, scale };
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

nunjucks.configure(join(import.meta.dir, "templates"), { autoescape: false });

const readme = nunjucks.render("README.njk", { sections });

await Bun.write(join(import.meta.dir, "README.md"), readme);

console.log("README.md generated!");
