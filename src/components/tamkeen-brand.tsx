import mark from "@/assets/arsh-logo-mark.webp";
import { cn } from "@/lib/utils";

/** Original emblem, with readable live lettering instead of text baked into a bitmap. */
export function TamkeenBrand({ inverse = false, compact = false, className }: { inverse?: boolean; compact?: boolean; className?: string }) {
  return (
    <div className={cn("tamkeen-brand", inverse && "tamkeen-brand-inverse", compact && "tamkeen-brand-compact", className)} aria-label="TAMKEEN — تمكين للحلول التقنية والهندسية" translate="no" data-no-translate dir="ltr">
      <img src={mark} alt="شعار تمكين" width={439} height={546} />
      <div className="tamkeen-brand-type" dir="rtl">
        <strong>تمكين</strong>
        <b dir="ltr">TAMKEEN</b>
        <span>للحلول التقنية والهندسية</span>
      </div>
    </div>
  );
}