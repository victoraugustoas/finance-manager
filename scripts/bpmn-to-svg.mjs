import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';

const nodeRequire = createRequire(import.meta.url);
const viewerScript = nodeRequire.resolve('bpmn-js/dist/bpmn-viewer.production.min.js');

const PAGE_HTML = `<!DOCTYPE html>
<html>
  <head>
    <style>
      html, body, #canvas { width: 100%; height: 800px; margin: 0; }
    </style>
  </head>
  <body>
    <div id="canvas"></div>
  </body>
</html>`;

export class BpmnValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BpmnValidationError';
  }
}

export async function launchBrowser() {
  try {
    return await puppeteer.launch({ headless: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/sandbox|namespace|zygote/i.test(message)) throw error;
    return puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
}

export async function renderBpmnToSvg(xml, browser) {
  const ownsBrowser = browser === undefined;
  const active = browser ?? (await launchBrowser());
  try {
    return await renderInBrowser(active, xml);
  } finally {
    if (ownsBrowser) await active.close();
  }
}

export function markdownImageReference(alt, href) {
  const safeAlt = alt.replace(/[[\]]/g, '').trim() || 'process';
  return `![${safeAlt}](${href.split(path.sep).join('/')})`;
}

export function markdownImageFrom(markdownFile, svgFile, alt) {
  const href = path.relative(path.dirname(markdownFile), svgFile);
  return markdownImageReference(alt, href);
}

export async function writeSvgForBpmn(bpmnPath, browser) {
  const xml = fs.readFileSync(bpmnPath, 'utf8');
  const svg = await renderBpmnToSvg(xml, browser);
  const svgPath = bpmnPath.replace(/\.bpmn$/i, '.svg');
  if (svgPath === bpmnPath) {
    throw new Error(`Expected a .bpmn file, got ${bpmnPath}`);
  }
  fs.writeFileSync(svgPath, svg);
  return {
    svgPath,
    markdown: markdownImageReference(processLabel(xml), path.basename(svgPath)),
  };
}

async function renderInBrowser(browser, xml) {
  const page = await browser.newPage();
  try {
    await page.setContent(PAGE_HTML);
    await page.addScriptTag({ path: viewerScript });
    const result = await page.evaluate(async (diagramXml) => {
      const viewer = new globalThis.BpmnJS({ container: '#canvas' });
      try {
        const imported = await viewer.importXML(diagramXml);
        const warnings = (imported.warnings ?? [])
          .map((warning) => warning.message)
          .filter(Boolean);
        if (warnings.length > 0) {
          return { ok: false, error: warnings.join('\n') };
        }
        const { svg } = await viewer.saveSVG();
        return { ok: true, svg };
      } catch (error) {
        const warnings = (error.warnings ?? []).map((warning) => warning.message).filter(Boolean);
        const message = error.message || 'bpmn-js could not import the diagram';
        return { ok: false, error: [message, ...warnings].join('\n') };
      } finally {
        viewer.destroy();
      }
    }, xml);

    if (!result.ok) {
      throw new BpmnValidationError(result.error);
    }
    return result.svg;
  } finally {
    await page.close();
  }
}

function processLabel(xml) {
  const match = xml.match(/<(?:[\w.-]+:)?process\b([^>]*)>/);
  const attrs = match?.[1] ?? '';
  return attr(attrs, 'name') || attr(attrs, 'id') || 'process';
}

function attr(raw, name) {
  const match = raw.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`));
  const value = match?.[1] ?? match?.[2];
  return value === undefined ? undefined : decodeXml(value);
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function parseCli(argv) {
  const bpmnFiles = [];
  const from = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--from') {
      const markdownFile = argv[index + 1];
      if (!markdownFile) throw new Error('--from requires a markdown file');
      from.push(markdownFile);
      index += 1;
      continue;
    }
    bpmnFiles.push(arg);
  }
  return { bpmnFiles, from };
}

async function main() {
  const { bpmnFiles, from } = parseCli(process.argv.slice(2));
  if (bpmnFiles.length === 0) {
    throw new Error('Usage: pnpm bpmn:svg -- <file.bpmn> [...] [--from <file.md> ...]');
  }
  const browser = await launchBrowser();
  try {
    for (const file of bpmnFiles) {
      const written = await writeSvgForBpmn(path.resolve(file), browser);
      console.log(written.svgPath);
      if (from.length === 0) {
        console.log(written.markdown);
        continue;
      }
      const alt = written.markdown.slice(2, written.markdown.indexOf(']'));
      for (const markdownFile of from) {
        console.log(markdownImageFrom(path.resolve(markdownFile), written.svgPath, alt));
      }
    }
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
