import { describe, expect, it } from "vitest";
import { matchOfflineVoice } from "../lib/offline-voice";

describe("offline desktop narration", () => {
  const phrases = [
    { lang: "en", text: "Choose your system", key: "en-system" },
    { lang: "zh", text: "请选择系统", key: "zh-system" },
  ];
  it("uses a bundled phrase for a screen with additional options", () => {
    expect(matchOfflineVoice("Choose your system. Solar, hybrid", "en", phrases)).toBe("en-system");
  });
  it("never plays a voice in the wrong language", () => {
    expect(matchOfflineVoice("Choose your system", "zh", phrases)).toBeNull();
  });
});