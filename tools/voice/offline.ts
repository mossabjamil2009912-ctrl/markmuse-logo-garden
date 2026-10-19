// Build-time only: never include credentials or the SDK in the desktop bundle.
import type {} from "../../src/generated/ai-gateway/models";
import { generateSpeech, GatewayError } from "@lovable.dev/ai-gateway";
import { mkdirSync, existsSync, readdirSync, writeFileSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { PHRASES, STEP_INTROS, voiceTextFor, composeScreenSpeech } from "../../src/lib/voice-guide";
import { SCRIPTS, WELCOME } from "../../src/lib/voice-scripts";
import { translateText, type Lang } from "../../src/lib/i18n";
import { PRODUCTS, CATEGORIES, productsByCategory } from "../../src/lib/products-data";
import { productBenefitNarration } from "../../src/lib/product-narration";

const instructions: Record<Lang, string> = {
  ar: "اقرأ بالفصحى بصوت نسائي دافئ وواثق، بوضوح وسرعة طبيعية. لا تضف أي كلام:",
  en: "Read in English only, in a warm confident corporate female narrator voice. Natural pacing. Add nothing:",
  zh: "请用标准普通话以温暖、自信、清晰的企业女声朗读，不要添加其他内容：",
};
const jobs = new Map<string, { text: string; key: string; lang: Lang }>();
for (const lang of ["ar", "en", "zh"] as const) {
  const sources = [WELCOME[lang]];
  for (const script of Object.values(SCRIPTS)) {
    const source = script[lang];
    if (!source) continue;
    // One reusable screen introduction covers added options via prefix matching.
    sources.push(composeScreenSpeech([source.replace(/\{kw\}/g, "")], lang));
  }
  if (lang === "ar") sources.push(...Object.values(PHRASES), ...Object.values(STEP_INTROS));
  for (const product of PRODUCTS) {
    const after = productBenefitNarration(product);
    const texts = [`${product.name}. ${after.split(".")[0]}.`];
    sources.push(...texts.map((text) => translateText(text, lang)));
  }
  const catalogTexts = [
    "قسم منتجات تمكين للحلول التقنية والهندسية. اختر الفئة التي تريد استعراضها: الألواح الشمسية، أو الإنفرترات، أو بطاريات الليثيوم، أو أنظمة التخزين.",
    "كل المنتجات. ابحث باسم المنتج أو الموديل، أو اختر الشركة المصنّعة.",
  ];
  for (const cat of CATEGORIES) {
    const items = productsByCategory(cat.id);
    catalogTexts.push(`${cat.title}. اختر الشركة المصنّعة لعرض موديلاتها.`);
    for (const b of new Set(items.map((p) => (/hithium/i.test(p.brand) ? "HiTHIUM" : p.brand)))) {
      catalogTexts.push(`${cat.title} من ${b}. يتوفر ${items.filter((p) => (/hithium/i.test(p.brand) ? "HiTHIUM" : p.brand) === b).length} موديل.`);
    }
  }
  sources.push(...catalogTexts.map((text) => translateText(text, lang)));
  for (const source of sources) {
    const { text, key } = voiceTextFor(source, lang);
    if (text) jobs.set(key, { text, key, lang });
  }
}
mkdirSync("public/audio", { recursive: true });
mkdirSync("/tmp/offline-voice", { recursive: true });
function saveIndex() {
  const have = new Set(readdirSync("public/audio").filter((f) => f.endsWith(".mp3")).map((f) => f.slice(0, -4)));
  writeFileSync("public/audio/index.json", JSON.stringify([...have]));
  writeFileSync("public/audio/phrases.json", JSON.stringify([...jobs.values()].filter((j) => have.has(j.key))));
}
const pending = [...jobs.values()].filter((j) => !existsSync(`public/audio/${j.key}.mp3`))
  .filter((j) => !process.env.VOICE_SKIP?.split(",").includes(j.key))
  .filter((j) => !process.env.VOICE_LANG || j.lang === process.env.VOICE_LANG)
  .sort((a, b) => (a.lang === "ar" ? 1 : 0) - (b.lang === "ar" ? 1 : 0));
console.log("Offline voice phrases", jobs.size, "to generate", pending.length);
// Shared sequential pipeline: a permanent failure pauses all scheduled work.
let stopped = false;
let cursor = 0;
async function lane() {
while (!stopped && cursor < pending.length) {
  const job = pending[cursor++];
  if (!job) return;
  try {
    const result = await generateSpeech({
      model: "google/gemini-3.1-flash-tts-preview",
      contents: [{ role: "user", parts: [{ text: `${instructions[job.lang]} ${job.text}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
      },
    });
    const raw = `/tmp/offline-voice/${job.key}.bin`;
    writeFileSync(raw, Buffer.from(await (await result.blob()).arrayBuffer()));
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", raw, "-ac", "1", "-b:a", "64k", `public/audio/${job.key}.mp3`]);
    saveIndex();
    console.log("Saved", job.key);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  } catch (error) {
    saveIndex();
    if (error instanceof GatewayError) {
      console.error("Voice generation paused", job.key, error.code, error.httpStatus, error.message);
      if (error.code === "request_rejected") {
        // A rejected phrase is not retried; unrelated phrases can still be prepared.
        continue;
      }
    }
    else console.error("Voice generation paused due to audio conversion failure");
    process.exitCode = 1;
    stopped = true;
    break;
  }
}
}
await lane();
saveIndex();