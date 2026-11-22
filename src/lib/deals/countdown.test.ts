import { describe, expect, it } from "vitest";
import {
  countdownUntil,
  getNextWeeklyDeadline,
  splitCountdown,
} from "./countdown";

describe("getNextWeeklyDeadline", () => {
  it("از وسط هفته، پایان یکشنبه را برمی‌گرداند", () => {
    // ۲۰۲۶-۱۱-۱۸ چهارشنبه است
    const deadline = getNextWeeklyDeadline(new Date("2026-11-18T10:30:00.000Z"));
    expect(deadline.toISOString()).toBe("2026-11-22T23:59:59.999Z");
  });

  it("وقتی امروز یکشنبه است، همان روز پایان پنجره است", () => {
    const deadline = getNextWeeklyDeadline(new Date("2026-11-22T08:00:00.000Z"));
    expect(deadline.toISOString()).toBe("2026-11-22T23:59:59.999Z");
  });
});

describe("splitCountdown", () => {
  it("میلی‌ثانیه را به روز/ساعت/دقیقه/ثانیه می‌شکند", () => {
    const remaining =
      2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 4 * 60 * 1000 + 5 * 1000;
    expect(splitCountdown(remaining)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
    });
  });

  it("مقدار منفی یا کمتر از یک ثانیه را صفر می‌کند", () => {
    expect(splitCountdown(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    expect(splitCountdown(999)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });
});

describe("countdownUntil", () => {
  it("فاصله تا مهلت را حساب می‌کند", () => {
    const now = new Date("2026-11-22T23:00:00.000Z");
    const deadline = new Date("2026-11-22T23:59:59.999Z");
    expect(countdownUntil(now, deadline)).toEqual({
      days: 0,
      hours: 0,
      minutes: 59,
      seconds: 59,
    });
  });
});
