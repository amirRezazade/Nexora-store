"use client";

import { useEffect } from "react";
import type { EmblaCarouselType } from "embla-carousel";

/**
 * کاهش momentum حالت dragFree در Embla.
 *
 * Embla در حالت dragFree ضریب forceBoost معادل 500 برای موس اعمال میکند
 * و با یک کشش کوچک چنده اسلاید رد میشود. در ایونت `pointerUp`، AFTER اینکه
 * Embla target نهایی را محاسبه کرد و BEFORE شروع انیمیشن، فاصلهٔ momentum
 * را به درصد مشخصی کاهش میدهیم تا موقع رها کردن تقریباً همانجا بماند.
 */
export function useDampedDrag(
  emblaApi: EmblaCarouselType | undefined,
  factor = 0.27
): void {
  useEffect(() => {
    if (!emblaApi) return;

    const dampen = () => {
      const engine = emblaApi.internalEngine();
      const current = engine.location.get();
      const target = engine.target.get();
      engine.target.set(current + (target - current) * factor);
    };

    emblaApi.on("pointerUp", dampen);
    return () => {
      emblaApi.off("pointerUp", dampen);
    };
  }, [emblaApi, factor]);
}
