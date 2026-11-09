#!/usr/bin/env node
/**
 * Generator Indeks Konten Otomatis — Repo `hkbpperawang/assets`
 *
 * Memindai seluruh file `.md` di dalam folder `warta_jemaat/` dan `artikel/`,
 * mem-parsing YAML Frontmatter, `pdf_url="..."`, `taxonomy.category`, dan `custom_fields`,
 * lalu menghasilkan file `dist/content-index.json` yang siap dikonsumsi oleh
 * website `www.hkbpperawang.org` dan Fake WP REST API (`/wp-json/wp/v2/*`).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/hkbpperawang/assets/main";

/** Pemetaan slug kategori pada frontmatter `taxonomy.category` ke ID kategori WordPress. */
const CATEGORY_SLUG_TO_ID = {
  renungan: 14,
  "warta-acara": 15,
  "warta-jemaat": 15,
  "ibadah-minggu": 17,
  "b-indonesia": 18,
  "b-batak": 19,
  dokumen: 22,
  "tahun-baru": 23,
  passion: 24,
  paskah: 25,
  "hari-kenaikan": 26,
  "buhabuha-ijuk": 27,
  "jumat-agung": 28,
  koor: 29,
  youtube: 30,
  berita: 31,
  natal: 32,
  "tata-acara": 33,
  "karya-tulis": 68,
  "b-indonesia-tata-acara": 69,
  "b-batak-tata-acara": 70,
  "b-batak-natal": 71,
  "b-indonesia-natal": 72,
  "partangiangan-weyk": 73,
  hkbp: 74,
  kegiatan: 75,
  pelayanan: 76,
  "cerita-pendek": 77,
  puisi: 78,
  internet: 79,
  kesehatan: 80,
  tips: 81,
  tutorial: 82,
  "ayat-harian": 83,
  "ayat-mingguan": 84,
  "ayat-bulanan": 85,
  bacaan: 86,
};

const CATEGORY_ID_TO_NAME = {
  14: "Renungan",
  15: "Warta Acara",
  17: "Ibadah Minggu",
  18: "B. Indonesia",
  19: "B. Batak",
  22: "Dokumen",
  23: "Tahun Baru",
  24: "Passion",
  25: "Paskah",
  26: "Hari Kenaikan",
  27: "Buhabuha Ijuk",
  28: "Jumat Agung",
  29: "Koor",
  30: "YouTube",
  31: "Berita",
  32: "Natal",
  33: "Tata Acara",
  68: "Karya Tulis",
  69: "B. Indonesia Tata Acara",
  70: "B. Batak Tata Acara",
  71: "B. Batak Natal",
  72: "B. Indonesia Natal",
  73: "Partangiangan Weyk",
  74: "HKBP",
  75: "Kegiatan",
  76: "Pelayanan",
  77: "Cerita Pendek",
  78: "Puisi",
  79: "Internet",
  80: "Kesehatan",
  81: "Tips",
  82: "Tutorial",
  83: "Ayat Harian",
  84: "Ayat Mingguan",
  85: "Ayat Bulanan",
  86: "Bacaan",
};

const CATEGORY_ID_TO_URL_SLUG = {
  14: "renungan",
  15: "warta-acara",
  17: "warta-acara",
  18: "warta-acara",
  19: "warta-acara",
  22: "dokumen",
  23: "tahun-baru",
  24: "passion",
  25: "paskah",
  26: "hari-kenaikan",
  27: "buhabuha-ijuk",
  28: "jumat-agung",
  29: "koor",
  30: "youtube",
  31: "berita",
  32: "natal",
  33: "tata-acara",
  68: "karya-tulis",
  69: "tata-acara",
  70: "tata-acara",
  71: "natal",
  72: "natal",
  73: "partangiangan-weyk",
  74: "hkbp",
  75: "kegiatan",
  76: "pelayanan",
  77: "cerita-pendek",
  78: "puisi",
  79: "internet",
  80: "kesehatan",
  81: "tips",
  82: "tutorial",
  83: "ayat-harian",
  84: "ayat-mingguan",
  85: "ayat-bulanan",
  86: "bacaan",
};

function slugify(input) {
  return String(input ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deterministicNumericId(slug) {
  let hash = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return 100000 + ((hash >>> 0) % 900000000);
}

function unquote(val) {
  const trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatterBlock(rawMd) {
  const normalized = rawMd.replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalized);
  if (!match) {
    return { frontmatter: {}, body: normalized.trim() };
  }

  const yamlLines = match[1].split("\n");
  const body = match[2].trim();

  const fm = {
    custom_fields: {},
    taxonomy: { category: [], post_tag: [] },
  };

  let section = null;
  let subSection = null;

  for (const rawLine of yamlLines) {
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) continue;
    const indent = rawLine.match(/^\s*/)?.[0].length ?? 0;
    const line = rawLine.trim();

    if (indent === 0) {
      section = null;
      subSection = null;
      const kv = /^([a-zA-Z0-9_-]+):\s*(.*)$/.exec(line);
      if (!kv) continue;
      const [, key, rest] = kv;
      if (key === "custom_fields") {
        section = "custom_fields";
      } else if (key === "taxonomy") {
        section = "taxonomy";
      } else if (rest) {
        fm[key] = unquote(rest);
      } else {
        fm[key] = "";
      }
      continue;
    }

    if (section === "custom_fields") {
      const kv = /^([a-zA-Z0-9_-]+):\s*(.*)$/.exec(line);
      if (kv) {
        fm.custom_fields[kv[1]] = unquote(kv[2]);
      }
      continue;
    }

    if (section === "taxonomy") {
      if (line.startsWith("- ")) {
        const item = unquote(line.slice(2));
        if (subSection === "category" && item) {
          fm.taxonomy.category.push(item);
        } else if (subSection === "post_tag" && item) {
          fm.taxonomy.post_tag.push(item);
        }
        continue;
      }
      const kv = /^([a-zA-Z0-9_-]+):\s*(.*)$/.exec(line);
      if (kv) {
        const [, tKey, tRest] = kv;
        if (tKey === "category" || tKey === "categories") {
          subSection = "category";
          if (tRest.startsWith("[") && tRest.endsWith("]")) {
            const items = tRest
              .slice(1, -1)
              .split(",")
              .map((s) => unquote(s))
              .filter(Boolean);
            fm.taxonomy.category.push(...items);
          }
        } else if (tKey === "post_tag" || tKey === "tags" || tKey === "tag") {
          subSection = "post_tag";
          if (tRest.startsWith("[") && tRest.endsWith("]")) {
            const items = tRest
              .slice(1, -1)
              .split(",")
              .map((s) => unquote(s))
              .filter(Boolean);
            fm.taxonomy.post_tag.push(...items);
          }
        }
      }
    }
  }

  return { frontmatter: fm, body };
}

function extractDriveId(url) {
  if (!url) return null;
  const m =
    url.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/) ??
    url.match(/[?&]id=([A-Za-z0-9_-]+)/);
  return m?.[1] ?? null;
}

function normalizeIsoWib(rawDate) {
  const clean = String(rawDate ?? "").trim();
  if (!clean) return "2026-01-01T00:00:00+07:00";
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return `${clean}T00:00:00+07:00`;
  const normalized = clean.replace(" ", "T");
  if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)) {
    return `${normalized}+07:00`;
  }
  return normalized;
}

function resolveAssetImageUrl(rawUrl) {
  const clean = String(rawUrl ?? "").trim();
  if (!clean) return null;
  if (/^https?:\/\//i.test(clean)) return clean;
  const rel = clean.replace(/^\/+/, "");
  return `${GITHUB_RAW_BASE}/${rel}`;
}

function walkMarkdownFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMarkdownFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function buildPlainTextExcerpt(body, fallbackDesc) {
  if (fallbackDesc && fallbackDesc.trim()) return fallbackDesc.trim();
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(
      (p) =>
        p &&
        !p.startsWith("#") &&
        !p.startsWith("pdf_url=") &&
        !/^`[^`]+`$/.test(p),
    );
  const first = paragraphs[0] ?? "";
  return first
    .replace(/==([^=]+)==/g, "$1")
    .replace(/[*_~`>#]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function buildContentIndex() {
  const contentDirs = ["warta_jemaat", "artikel"];
  const files = [];
  for (const sub of contentDirs) {
    walkMarkdownFiles(path.join(ROOT_DIR, sub), files);
  }

  const posts = [];

  for (const absPath of files) {
    const relPath = path.relative(ROOT_DIR, absPath).replace(/\\/g, "/");
    const rawMd = fs.readFileSync(absPath, "utf8");
    const { frontmatter, body } = parseFrontmatterBlock(rawMd);

    const status = String(frontmatter.post_status || frontmatter.status || "publish").toLowerCase();
    if (status !== "publish") continue;

    const title = String(frontmatter.title || path.basename(absPath, ".md")).trim();
    const slug = String(frontmatter.slug || slugify(title)).trim();
    const id = frontmatter.id ? Number(frontmatter.id) : deterministicNumericId(slug);
    const dateIso = normalizeIsoWib(frontmatter.post_date || frontmatter.date);
    const modifiedIso = normalizeIsoWib(
      frontmatter.modified || frontmatter.post_date || frontmatter.date,
    );

    // Map category slugs to WP category IDs
    const rawCatSlugs = [...(frontmatter.taxonomy?.category ?? [])];
    if (rawCatSlugs.length === 0) {
      if (relPath.startsWith("warta_jemaat/")) {
        rawCatSlugs.push("warta-acara");
      } else if (relPath.startsWith("artikel/")) {
        const parts = relPath.split("/");
        if (parts[1]) rawCatSlugs.push(slugify(parts[1]));
      }
    }

    const categories = [];
    const categoryNames = [];
    for (const cSlug of rawCatSlugs) {
      const normalizedSlug = slugify(cSlug);
      const catId = CATEGORY_SLUG_TO_ID[normalizedSlug];
      if (catId && !categories.includes(catId)) {
        categories.push(catId);
        const name = CATEGORY_ID_TO_NAME[catId];
        if (name) categoryNames.push(name);
      }
    }
    if (categories.length === 0) {
      categories.push(15);
      categoryNames.push("Warta Acara");
    }

    // Determine primary URL category slug (prioritizing main categories like warta-acara, renungan, bacaan)
    const primaryCatSlug =
      categories.includes(15) || categories.includes(17) || categories.includes(18) || categories.includes(19)
        ? "warta-acara"
        : (CATEGORY_ID_TO_URL_SLUG[categories[0]] ?? "warta-acara");

    // Extract pdf_url="..." from body or custom_fields
    const pdfMatch = /pdf_url\s*=\s*["']([^"']+)["']/i.exec(body);
    const rawPdfUrl =
      pdfMatch?.[1] ||
      frontmatter.custom_fields?.pdf_url ||
      frontmatter.custom_fields?.drive_pdf ||
      "";
    const driveId = extractDriveId(rawPdfUrl);
    const embeds = driveId ? [`https://drive.google.com/file/d/${driveId}/preview`] : [];

    // Extract author (frontmatter or trailing `Author Name` signature in body)
    let author = String(
      frontmatter.author || frontmatter.custom_fields?.author || "",
    ).trim();
    const bodyLines = body.split("\n").map((l) => l.trim()).filter(Boolean);
    const lastLine = bodyLines[bodyLines.length - 1] ?? "";
    const trailingSignature = /^`([^`]{2,60})`$|^"([^"]{2,60})"$/.exec(lastLine);
    if (!author && trailingSignature) {
      author = (trailingSignature[1] || trailingSignature[2] || "").trim();
    }
    if (!author) {
      author = "Tim Redaksi HKBP Perawang";
    }

    const image = resolveAssetImageUrl(
      frontmatter.custom_fields?.featured_image_url || frontmatter.image || "",
    );
    const seoTitle = String(frontmatter.custom_fields?.site_seo_title || "").trim() || undefined;
    const seoDesc = String(frontmatter.custom_fields?.site_seo_desc || "").trim() || undefined;
    const seoTarget = String(frontmatter.custom_fields?.seo_target || "").trim() || undefined;
    const excerpt =
      String(frontmatter.post_excerpt || frontmatter.excerpt || "").trim() ||
      buildPlainTextExcerpt(body, seoDesc);

    posts.push({
      id,
      slug,
      title,
      date: dateIso,
      modified: modifiedIso,
      link: `https://www.hkbpperawang.org/${primaryCatSlug}/${slug}`,
      categorySlug: primaryCatSlug,
      categories,
      categorySlugs: rawCatSlugs,
      categoryNames,
      tags: frontmatter.taxonomy?.post_tag ?? [],
      author,
      image,
      excerpt,
      seoTitle,
      seoDesc,
      seoTarget,
      pdfUrl: rawPdfUrl || null,
      driveId: driveId || null,
      embeds,
      sourcePath: relPath,
      rawMarkdown: body,
    });
  }

  // Sort newest first by date
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const outDir = path.join(ROOT_DIR, "dist");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "content-index.json");
  const payload = {
    generatedAt: new Date().toISOString(),
    repo: "hkbpperawang/assets",
    totalPosts: posts.length,
    posts,
  };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`[build-index] Wrote ${posts.length} posts to ${outPath}`);

  const srcPeople = path.join(ROOT_DIR, "pages", "people-pages.json");
  const distPeople = path.join(outDir, "people-pages.json");
  if (fs.existsSync(srcPeople)) {
    fs.copyFileSync(srcPeople, distPeople);
    console.log(`[build-index] Synced ${distPeople}`);
  }
}

buildContentIndex();
