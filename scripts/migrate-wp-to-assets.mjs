#!/usr/bin/env node
/**
 * Skrip Migrasi Otomatis WordPress (`wp.hkbpperawang.org`) -> Repo `hkbpperawang/assets`
 *
 * Menarik seluruh artikel, warta jemaat, dan halaman organisasi (Tentang Kami, Fungsionaris,
 * Tim Multimedia) dari WordPress dan menyimpannya ke dalam `E:\Projects\hkbpperawang\assets`
 * dengan format YAML Frontmatter & `pdf_url="..."` yang identik dengan contoh file `.md` Anda.
 *
 * Cara pakai:
 *   node scripts/migrate-wp-to-assets.mjs
 *   node scripts/migrate-wp-to-assets.mjs --overwrite
 */

import fs from "node:fs";
import path from "node:path";

const WP_BASE = (process.env.WP_ORIGIN || "https://wp.hkbpperawang.org").replace(/\/$/, "");
const WP_API = `${WP_BASE}/wp-json/wp/v2`;
const ASSETS_DIR = process.env.ASSETS_DIR || "E:\\Projects\\hkbpperawang\\assets";
const OVERWRITE = process.argv.includes("--overwrite");

const WP_HEADERS = {
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 HKBPPerawangHeadless/1.0",
};

const MONTH_FOLDER_NAMES = [
  "01_Januari",
  "02_Februari",
  "03_Maret",
  "04_April",
  "05_Mei",
  "06_Juni",
  "07_Juli",
  "08_Agustus",
  "09_September",
  "10_Oktober",
  "11_November",
  "12_Desember",
];

const CATEGORY_ID_TO_TAXONOMY_SLUG = {
  14: "renungan",
  15: "warta-acara",
  17: "ibadah-minggu",
  18: "b-indonesia",
  19: "b-batak",
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
  69: "b-indonesia-tata-acara",
  70: "b-batak-tata-acara",
  71: "b-batak-natal",
  72: "b-indonesia-natal",
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

const WARTA_CATEGORY_IDS = new Set([15, 17, 18, 19, 23, 24, 25, 26, 27, 28, 32, 33, 69, 70, 71, 72, 73]);

const DEFAULT_AVATAR =
  "https://cdn.hkbpperawang.org/assets/uploads/blank-profile-picture-160x160.webp";

function decodeEntities(s) {
  return String(s ?? "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&mdash;/g, "\u2014");
}

function stripTags(html) {
  return decodeEntities(String(html ?? "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeFileName(title) {
  return String(title ?? "Artikel")
    .replace(/[:]/g, ",")
    .replace(/[<>"/\\|?*\x00-\x1F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

function escapeYamlDoubleQuoted(str) {
  return String(str ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, " ")
    .trim();
}

function extractDriveIdFromHtml(html) {
  const m =
    /drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{10,100})/i.exec(html) ??
    /drive\.google\.com\/open\?id=([A-Za-z0-9_-]{10,100})/i.exec(html) ??
    /docs\.google\.com\/file\/d\/([A-Za-z0-9_-]{10,100})/i.exec(html);
  return m?.[1] ?? null;
}

function htmlToCleanMarkdown(rawHtml) {
  let out = String(rawHtml ?? "")
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<(script|style|iframe|noscript|form)[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Drop Elementor breadcrumb widgets
  out = out.replace(/<div[^>]*breadcrumbs[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, "");

  // Promote Elementor heading widgets
  out = out.replace(
    /<div[^>]*elementor-widget-heading[^>]*>([\s\S]*?)<\/div>/gi,
    (_, inner) => `\n\n## ${stripTags(inner)}\n\n`,
  );

  // Headings
  out = out.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, inner) => {
    const text = stripTags(inner);
    if (!text) return "";
    return `\n\n${"#".repeat(Number(level))} ${text}\n\n`;
  });

  // Formatting tags
  out = out.replace(/<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, (_, inner) => {
    const t = stripTags(inner);
    return t ? `**${t}**` : "";
  });
  out = out.replace(/<(?:em|i)\b[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, (_, inner) => {
    const t = stripTags(inner);
    return t ? `*${t}*` : "";
  });
  out = out.replace(/<mark\b[^>]*>([\s\S]*?)<\/mark>/gi, (_, inner) => {
    const t = stripTags(inner);
    return t ? `==${t}==` : "";
  });
  out = out.replace(/<(?:del|s)\b[^>]*>([\s\S]*?)<\/(?:del|s)>/gi, (_, inner) => {
    const t = stripTags(inner);
    return t ? `~~${t}~~` : "";
  });
  out = out.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, inner) => {
    const t = stripTags(inner);
    return t ? `\`${t}\`` : "";
  });

  // Links & images
  out = out.replace(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_, href, inner) => {
      const label = stripTags(inner);
      if (!label) return "";
      return `[${label}](${href.trim()})`;
    },
  );
  out = out.replace(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi, (full, src) => {
    const alt = /alt=["']([^"']*)["']/i.exec(full)?.[1] ?? "";
    return `\n\n![${decodeEntities(alt)}](${src.trim()})\n\n`;
  });

  // Lists
  out = out.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, inner) => {
    const t = stripTags(inner);
    return t ? `\n- ${t}` : "";
  });
  out = out.replace(/<\/?(?:ul|ol)\b[^>]*>/gi, "\n\n");

  // Blockquotes
  out = out.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) => {
    const t = stripTags(inner);
    return t ? `\n\n> ${t}\n\n` : "";
  });

  // Paragraphs & line breaks
  out = out.replace(/<br\s*\/?>/gi, "\n");
  out = out.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_, inner) => {
    const cleaned = decodeEntities(inner.replace(/<[^>]+>/g, " "))
      .replace(/[ \t]+/g, " ")
      .trim();
    return cleaned ? `\n\n${cleaned}\n\n` : "";
  });

  // Strip remaining HTML tags
  out = decodeEntities(out.replace(/<[^>]+>/g, " "));
  return out
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseAboutHtml(html) {
  const blocks = [];
  const token =
    /<h([1-6])[^>]*elementor-heading-title[^>]*>([\s\S]*?)<\/h\1>|elementor-widget-heading"[^>]*>(?!\s*<h)([\s\S]*?)<\/div>|elementor-widget-text-editor"[^>]*>([\s\S]*?)<\/div>|<div class="tshowcase-box [^"]*"[^>]*>([\s\S]*?)(?=<div class="tshowcase-box |<\/div><\/div><\/div><\/div>(?!<div class="tshowcase-box))/g;
  let pending = null;
  const flush = () => {
    if (!pending) return;
    blocks.push({
      type: "banner",
      level: pending.level <= 3 ? "main" : "sub",
      title: pending.title,
    });
    pending = null;
  };
  for (const m of html.matchAll(token)) {
    if (m[2] !== undefined || m[3] !== undefined) {
      flush();
      const title = stripTags(m[2] ?? m[3] ?? "");
      if (!title || /^tentang kami$/i.test(title)) continue;
      const level = m[1] ? Number(m[1]) : /^weyk\b/i.test(title) ? 4 : 3;
      if (level === 1) continue;
      pending = { level, title };
    } else if (m[4] !== undefined) {
      const text = stripTags(m[4]);
      if (!text) continue;
      if (pending) {
        blocks.push({ type: "text", title: pending.title, text });
        pending = null;
      }
    } else if (m[5] !== undefined) {
      flush();
      const box = m[5];
      const name = stripTags(/tshowcase-box-title[^>]*>([\s\S]*?)<\/div>/.exec(box)?.[1] ?? "");
      if (!name) continue;
      const role =
        stripTags(/tshowcase-single-position[^>]*>([\s\S]*?)<\/div>/.exec(box)?.[1] ?? "") || null;
      const photo = /<img[^>]+(?:data-src|src)="(https:[^"]+)"/.exec(box)?.[1] ?? DEFAULT_AVATAR;
      const social = /tshowcase-box-social[^>]*>([\s\S]*?)<\/div>/.exec(box)?.[1] ?? "";
      const links = [...social.matchAll(/href="(https?:[^"]+)"/g)].map((x) => x[1]);
      const person = { name, role, photo, links };
      const last = blocks[blocks.length - 1];
      if (last?.type === "people") last.people.push(person);
      else blocks.push({ type: "people", people: [person] });
    }
  }
  flush();
  return blocks;
}

async function fetchAllWpPosts() {
  const all = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 30) {
    const url = `${WP_API}/posts?per_page=50&page=${page}&_embed=author,wp:featuredmedia,wp:term`;
    console.log(`[migrate] Fetching posts page ${page}: ${url}`);
    const res = await fetch(url, { headers: WP_HEADERS });
    if (!res.ok) {
      console.warn(`[migrate] Page ${page} returned HTTP ${res.status}`);
      break;
    }
    if (page === 1) {
      totalPages = Number(res.headers.get("x-wp-totalpages") ?? 1) || 1;
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    page++;
  }

  return all;
}

function formatPostDateString(isoStr) {
  const clean = String(isoStr ?? "").trim();
  if (!clean) return "2026-01-01 00:00:00";
  return clean.replace("T", " ").replace(/(?:Z|[+-]\d{2}:?\d{2})$/i, "").slice(0, 19);
}

function buildMarkdownFileContent(wpPost) {
  const id = Number(wpPost.id);
  const slug = String(wpPost.slug ?? "").trim();
  const title = decodeEntities(wpPost.title?.rendered ?? slug);
  const postDate = formatPostDateString(wpPost.date);
  const rawExcerpt = stripTags(wpPost.excerpt?.rendered ?? "").replace(/\[…\]|\[&hellip;\]/g, "…");
  const featuredImageUrl =
    wpPost._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? "";
  const authorName =
    decodeEntities(wpPost._embedded?.author?.[0]?.name ?? "") || "";

  const termsFlat = (wpPost._embedded?.["wp:term"] ?? []).flat();
  const catSlugs = termsFlat
    .filter((t) => t?.taxonomy === "category" && t.slug)
    .map((t) => String(t.slug));

  if (catSlugs.length === 0 && Array.isArray(wpPost.categories)) {
    for (const cid of wpPost.categories) {
      const s = CATEGORY_ID_TO_TAXONOMY_SLUG[cid];
      if (s && !catSlugs.includes(s)) catSlugs.push(s);
    }
  }
  if (catSlugs.length === 0) {
    catSlugs.push("warta-acara");
  }

  const rawHtml = String(wpPost.content?.rendered ?? "");
  const driveId = extractDriveIdFromHtml(rawHtml);
  const bodyMarkdown = htmlToCleanMarkdown(rawHtml);

  const lines = [
    "---",
    `id: ${id}`,
    `slug: "${escapeYamlDoubleQuoted(slug)}"`,
    `title: "${escapeYamlDoubleQuoted(title)}"`,
    `post_date: "${postDate}"`,
    `post_excerpt: "${escapeYamlDoubleQuoted(rawExcerpt)}"`,
    `post_status: "publish"`,
    `type: "post"`,
  ];
  if (authorName) {
    lines.push(`author: "${escapeYamlDoubleQuoted(authorName)}"`);
  }
  lines.push("custom_fields:");
  if (featuredImageUrl) {
    lines.push(`    featured_image_url: "${escapeYamlDoubleQuoted(featuredImageUrl)}"`);
  }
  lines.push(`    seo_target: "${escapeYamlDoubleQuoted(title)}"`);
  lines.push(`    site_seo_title: "${escapeYamlDoubleQuoted(title)}"`);
  lines.push(
    `    site_seo_desc: "${escapeYamlDoubleQuoted(rawExcerpt || title)}"`,
  );
  lines.push("taxonomy:");
  lines.push("    category:");
  for (const cSlug of catSlugs) {
    lines.push(`        - ${cSlug}`);
  }
  lines.push("---");
  lines.push("");

  if (driveId) {
    lines.push(`pdf_url="https://drive.google.com/open?id=${driveId}&usp=drive_fs"`);
    if (bodyMarkdown) {
      lines.push("");
      lines.push(bodyMarkdown);
    }
  } else {
    lines.push(bodyMarkdown || title);
  }

  return lines.join("\n") + "\n";
}

function resolveTargetFilePath(wpPost) {
  const title = decodeEntities(wpPost.title?.rendered ?? wpPost.slug ?? "Artikel");
  const safeName = sanitizeFileName(title);
  const catIds = Array.isArray(wpPost.categories) ? wpPost.categories : [];
  const isWarta = catIds.some((c) => WARTA_CATEGORY_IDS.has(c));

  if (isWarta) {
    const dateStr = formatPostDateString(wpPost.date);
    const [ymd] = dateStr.split(" ");
    const [year = "2026", monthStr = "01", day = "01"] = (ymd ?? "2026-01-01").split("-");
    const monthIdx = Math.max(0, Math.min(11, Number(monthStr) - 1));
    const monthFolder = MONTH_FOLDER_NAMES[monthIdx] ?? "01_Januari";
    const dayFolder = day.padStart(2, "0");
    return path.join(ASSETS_DIR, "warta_jemaat", year, monthFolder, dayFolder, `${safeName}.md`);
  }

  const firstCatId = catIds[0] ?? 86;
  const folderSlug = CATEGORY_ID_TO_TAXONOMY_SLUG[firstCatId] ?? "bacaan";
  return path.join(ASSETS_DIR, "artikel", folderSlug, `${safeName}.md`);
}

async function exportPeoplePages() {
  const pagesConfig = [
    { key: "about", path: "/tentang-kami/", slug: "tentang-kami", title: "Tentang Kami" },
    {
      key: "fungsionaris",
      path: "/tentang-kami/fungsionaris/",
      slug: "fungsionaris",
      title: "Fungsionaris",
    },
    {
      key: "multimedia",
      path: "/tentang-kami/tim-multimedia/",
      slug: "tim-multimedia",
      title: "Tim Multimedia",
    },
  ];

  const peopleData = {};

  for (const cfg of pagesConfig) {
    let blocks = [];
    const skip = (list) =>
      list.filter(
        (b, i) =>
          !(i === 0 && b.type === "banner" && b.title.toLowerCase() === cfg.title.toLowerCase()),
      );

    try {
      const res = await fetch(`${WP_BASE}${cfg.path}?LSCWP_CTRL=before_optm`, {
        headers: { ...WP_HEADERS, Accept: "text/html" },
        redirect: "manual",
      });
      if (res.ok) {
        blocks = skip(parseAboutHtml(await res.text()));
      }
    } catch (e) {
      console.warn(`[migrate] HTML fetch failed for ${cfg.path}:`, e.message);
    }

    if (blocks.length === 0) {
      try {
        const res = await fetch(`${WP_API}/pages?slug=${cfg.slug}&_fields=content`, {
          headers: WP_HEADERS,
        });
        if (res.ok) {
          const arr = await res.json();
          if (arr[0]?.content?.rendered) {
            blocks = skip(parseAboutHtml(arr[0].content.rendered));
          }
        }
      } catch (e) {
        console.warn(`[migrate] REST page fetch failed for ${cfg.slug}:`, e.message);
      }
    }

    peopleData[cfg.key] = blocks;
    console.log(`[migrate] People page '${cfg.key}': ${blocks.length} blocks extracted`);
  }

  const pagesDir = path.join(ASSETS_DIR, "pages");
  fs.mkdirSync(pagesDir, { recursive: true });
  const peopleFile = path.join(pagesDir, "people-pages.json");
  fs.writeFileSync(peopleFile, JSON.stringify(peopleData, null, 2) + "\n", "utf8");

  const distDir = path.join(ASSETS_DIR, "dist");
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(
    path.join(distDir, "people-pages.json"),
    JSON.stringify(peopleData, null, 2) + "\n",
    "utf8",
  );
  console.log(`[migrate] Saved people pages to ${peopleFile}`);
}

async function main() {
  console.log(`[migrate] Target assets repo: ${ASSETS_DIR}`);
  const wpPosts = await fetchAllWpPosts();
  console.log(`[migrate] Fetched ${wpPosts.length} posts from WordPress`);

  let created = 0;
  let skipped = 0;

  for (const wpPost of wpPosts) {
    const targetPath = resolveTargetFilePath(wpPost);
    if (fs.existsSync(targetPath) && !OVERWRITE) {
      skipped++;
      continue;
    }
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    const mdContent = buildMarkdownFileContent(wpPost);
    fs.writeFileSync(targetPath, mdContent, "utf8");
    created++;
  }

  console.log(`[migrate] Posts migration complete: ${created} created, ${skipped} existing skipped`);
  await exportPeoplePages();
}

main().catch((err) => {
  console.error("[migrate] Fatal error:", err);
  process.exit(1);
});
