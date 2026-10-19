import { useEffect, useState } from "react";
import { NotificationsBell } from "@/components/notifications";
import startImg from "@/assets/screens/start.webp";
import homeImg from "@/assets/screens/home.webp";
import systemsImg from "@/assets/screens/systems.webp";
import sectionsImg from "@/assets/screens/sections.webp";
import allImg from "@/assets/screens/all.webp";
import mStartImg from "@/assets/screens/m-start.webp";
import mHomeImg from "@/assets/screens/m-home.webp";
import mSystemsImg from "@/assets/screens/m-systems.webp";
import mSectionsImg from "@/assets/screens/m-sections.webp";
import mAllImg from "@/assets/screens/m-all.webp";

/** الشاشات المعتمدة: صور المستخدم الأصلية تُعرض كما هي مع مناطق نقر شفافة. */
export type ImageScreenKind = "start" | "home" | "systems" | "sections" | "all";

const DW = 1672;
const DH = 941;
type Spot = [number, number, number, number, string, string];

const SRC: Record<ImageScreenKind, string> = { start: startImg, home: homeImg, systems: systemsImg, sections: sectionsImg, all: allImg };

const side = (x2: number, ys: [number, string, string][]): Spot[] => ys.map(([y, a, l]) => [12, y, x2, y + 50, a, l]);

const SPOTS: Record<ImageScreenKind, Spot[]> = {
  start: [
    [604, 618, 1070, 704, "start", "ابدأ"],
    [418, 528, 1258, 594, "start", "ابدأ"],
  ],
  home: [
    ...side(235, [[157, "home", "الرئيسية"], [215, "energy", "الدراسات الهندسية"], [270, "energy", "الدراسة الاقتصادية"], [325, "quote", "عروض الأسعار"], [378, "products", "المنتجات والمنظومات"], [432, "products", "الأجهزة والمنتجات"], [488, "quote", "العملاء والطلبات"], [543, "quote", "المشاريع"], [598, "settings", "الإعدادات"], [866, "exit", "تسجيل الخروج"]]),
    [268, 478, 936, 646, "energy", "الدراسات الهندسية"],
    [950, 478, 1652, 646, "quote", "صمم منظومتك"],
    [268, 660, 936, 826, "products", "الأجهزة والمنتجات"],
    [950, 660, 1652, 826, "support", "خدماتنا واستشاراتنا"],
  ],
  systems: [
    ...side(255, [[133, "home", "الرئيسية"], [190, "energy", "الدراسات الهندسية"], [240, "energy", "الدراسة الاقتصادية"], [290, "quote", "عروض الأسعار"], [343, "products", "المنتجات والمخطوطات"], [395, "products", "الأجهزة والمنتجات"], [447, "quote", "العملاء والطلبات"], [500, "quote", "المشاريع"], [552, "settings", "الإعدادات"], [843, "exit", "تسجيل الخروج"]]),
    [296, 185, 352, 235, "exit", "خروج"],
    [636, 185, 694, 235, "settings", "الإعدادات"],
    [290, 267, 957, 520, "sys:com", "حلول المتاجر والشركات"],
    [975, 267, 1650, 520, "sys:res", "منظومات المنازل والفلل"],
    [290, 535, 957, 765, "sys:agr", "طاقة الآبار والمزارع"],
    [975, 535, 1650, 765, "sys:ind", "محطات المصانع والمنشآت"],
    [295, 780, 1650, 906, "sys:item", "طلب معدات فردية"],
  ],
  sections: [
    ...side(287, [[137, "home", "الرئيسية"], [193, "quote", "صمم منظومتك"], [250, "energy", "الدراسات الهندسية"], [305, "quote", "عروض الأسعار"], [360, "products", "المنتجات والمنظومات"], [416, "products", "الأجهزة والملحقات"], [472, "quote", "العملاء والطلبات"], [528, "quote", "المشاريع"], [583, "settings", "الإعدادات"], [836, "exit", "تسجيل الخروج"]]),
    [332, 254, 692, 304, "all", "كل المنتجات"],
    [718, 254, 1652, 304, "all", "بحث"],
    [332, 324, 790, 372, "all", "الشركات"],
    [332, 392, 978, 622, "cat:inverters", "الإنفرترات"],
    [998, 392, 1652, 622, "cat:panels", "الألواح الشمسية"],
    [332, 642, 978, 866, "cat:batteries", "البطاريات"],
    [998, 642, 1652, 866, "cat:storage", "أنظمة التخزين"],
  ],
  all: [
    ...side(250, [[125, "home", "الرئيسية"], [180, "energy", "الدراسات الهندسية"], [235, "energy", "الدراسة الاقتصادية"], [290, "quote", "عروض الأسعار"], [345, "products", "المنتجات والمنظومات"], [398, "products", "الأجهزة والمنتجات"], [452, "quote", "العملاء والطلبات"], [507, "quote", "المشاريع"], [560, "settings", "الإعدادات"], [838, "exit", "تسجيل الخروج"]]),
    [302, 138, 352, 188, "exit", "خروج"],
    [624, 138, 676, 188, "settings", "الإعدادات"],
    [296, 222, 1646, 272, "real-all", "بحث"],
    [296, 284, 750, 330, "real-all", "الشركات"],
    [296, 345, 964, 626, "real-all", "منتج"],
    [982, 345, 1650, 626, "real-all", "منتج"],
    [296, 640, 964, 888, "real-all", "منتج"],
    [982, 640, 1650, 888, "real-all", "منتج"],
  ],
};

const MW = 941;
const MH = 1672;
const MSRC: Record<ImageScreenKind, string> = { start: mStartImg, home: mHomeImg, systems: mSystemsImg, sections: mSectionsImg, all: mAllImg };
const navA: Spot[] = [[20, 1550, 180, 1660, "home", "الرئيسية"], [190, 1550, 370, 1660, "quote", "صمم منظومتك"], [380, 1550, 560, 1660, "energy", "الدراسات الهندسية"], [570, 1550, 750, 1660, "support", "خدماتنا"], [760, 1550, 930, 1660, "settings", "حسابي"]];
const navB: Spot[] = [[760, 1540, 935, 1660, "home", "الرئيسية"], [580, 1540, 750, 1660, "quote", "صمم منظومتك"], [380, 1540, 570, 1660, "energy", "الدراسات الهندسية"], [190, 1540, 370, 1660, "support", "خدماتنا"], [20, 1540, 180, 1660, "settings", "الإعدادات"]];
const MSPOTS: Record<ImageScreenKind, Spot[]> = {
  start: [[172, 1125, 770, 1248, "start", "ابدأ"], [105, 988, 850, 1062, "start", "ابدأ"]],
  home: [
    [25, 150, 85, 215, "exit", "خروج"], [185, 150, 235, 215, "quote", "الطلبات"], [360, 150, 415, 215, "settings", "الإعدادات"],
    [482, 718, 920, 1095, "quote", "صمم منظومتك"], [25, 718, 463, 1095, "energy", "الدراسات الهندسية"],
    [482, 1110, 920, 1455, "support", "خدماتنا"], [25, 1110, 463, 1455, "products", "الأجهزة والمنتجات"],
    [20, 1560, 190, 1660, "home", "الرئيسية"], [200, 1560, 390, 1660, "support", "الدعم"], [400, 1560, 560, 1660, "quote", "الرسائل"], [570, 1560, 725, 1660, "quote", "منظومتي"], [740, 1560, 930, 1660, "settings", "حسابي"],
  ],
  systems: [
    [40, 235, 100, 295, "exit", "خروج"], [360, 235, 420, 295, "settings", "الإعدادات"],
    [30, 345, 460, 820, "sys:com", "حلول المتاجر والشركات"], [483, 345, 912, 820, "sys:res", "منظومات المنازل والفلل"],
    [30, 845, 460, 1285, "sys:agr", "طاقة الآبار"], [483, 845, 912, 1285, "sys:ind", "محطات المصانع"],
    [30, 1310, 912, 1515, "sys:item", "طلب معدات فردية"], ...navA,
  ],
  sections: [
    [698, 368, 908, 432, "home", "الرئيسية"], [35, 468, 908, 640, "all", "كل المنتجات"],
    [482, 680, 908, 1077, "cat:panels", "الألواح الشمسية"], [35, 680, 460, 1077, "cat:inverters", "الإنفرترات"],
    [482, 1100, 908, 1497, "cat:batteries", "البطاريات"], [35, 1100, 460, 1497, "cat:storage", "أنظمة التخزين"], ...navB,
  ],
  all: [
    [25, 160, 85, 230, "exit", "خروج"], [385, 160, 445, 230, "settings", "الإعدادات"],
    [725, 278, 912, 334, "products", "الفئات"], [20, 345, 920, 1525, "real-all", "المنتجات"], ...navB,
  ],
};
const MBELL: Partial<Record<ImageScreenKind, Box>> = { home: [105, 150, 160, 215], systems: [125, 235, 180, 295], all: [125, 160, 185, 230] };
const MNAME: Partial<Record<ImageScreenKind, Box>> = { home: [600, 194, 828, 224], all: [640, 210, 815, 242] };

function useMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const f = () => setM(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return m;
}

/** الشاشات المصوّرة مفعّلة على الكمبيوتر والجوال (صور مختلفة لكل منهما). */
export function useDesktopScreens() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 0px)");
    const f = () => setOn(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return on;
}

type Box = [number, number, number, number];
const BELL: Partial<Record<ImageScreenKind, Box>> = { home: [1396, 38, 1456, 98], all: [380, 130, 440, 192] };
const NAME: Partial<Record<ImageScreenKind, Box>> = { home: [1512, 44, 1634, 96] };

export function ImageScreen({ kind, onAction, userName, isAdmin = false }: { kind: ImageScreenKind; onAction: (action: string) => void; userName?: string; isAdmin?: boolean }) {
  const mobile = useMobile();
  const W = mobile ? MW : DW;
  const H = mobile ? MH : DH;
  const pos = ([x1, y1, x2, y2]: Box) => ({ left: `${(x1 / W) * 100}%`, top: `${(y1 / H) * 100}%`, width: `${((x2 - x1) / W) * 100}%`, height: `${((y2 - y1) / H) * 100}%` });
  const spots = (mobile ? MSPOTS : SPOTS)[kind];
  const bell = (mobile ? MBELL : BELL)[kind];
  const name = (mobile ? MNAME : NAME)[kind];
  return (
    <div dir="ltr" className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-navy" data-image-screen={kind}>
      <div className="relative" style={{ width: "100vw", height: "100dvh" }}>
        <img src={(mobile ? MSRC : SRC)[kind]} alt="" draggable={false} className="absolute inset-0 size-full select-none object-fill" />
        {spots.map(([x1, y1, x2, y2, action, label], i) => (
          <button
            key={i}
            type="button"
            aria-label={label}
            title={label}
            onClick={() => onAction(action)}
            className="absolute cursor-pointer rounded-lg !bg-transparent transition hover:!bg-card/10 focus-visible:outline-2 focus-visible:outline-gold"
            style={pos([x1, y1, x2, y2])}
          />
        ))}
        {bell && (
          <div className="absolute z-10" style={pos(bell)}>
            <NotificationsBell isAdmin={isAdmin} bare />
          </div>
        )}
        {name && (
          <div dir="rtl" className="absolute z-10 flex flex-col justify-center text-right font-bold leading-tight text-navy" style={{ ...pos(name), background: "rgb(254 254 254)", fontSize: mobile ? "min(2.6vw, 1.5dvh)" : "min(0.9vw, 1.6dvh)" }}>
            <span>أهلاً وسهلاً</span>
            <span className="truncate">{userName || "مستخدم تجريبي"}</span>
          </div>
        )}
      </div>
      {kind !== "start" && kind !== "home" && (
        <div dir="rtl" className="fixed bottom-3 left-3 z-[71] flex gap-2">
          <button type="button" onClick={() => onAction("back")} className="rounded-full border border-gold bg-navy px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg">→ رجوع</button>
          <button type="button" onClick={() => onAction("home")} className="rounded-full border border-gold bg-brand px-4 py-2 text-sm font-bold text-brand-foreground shadow-lg">الرئيسية</button>
        </div>
      )}
    </div>
  );
}
