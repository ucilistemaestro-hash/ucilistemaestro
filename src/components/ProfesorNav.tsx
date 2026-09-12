"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Home,
  UserRound,
} from "lucide-react";

const stavke = [
  {
    naziv: "Početna",
    putanja: "/profesor",
    Ikona: Home,
  },
  {
    naziv: "Raspored",
    putanja: "/profesor/raspored",
    Ikona: CalendarDays,
  },
  {
    naziv: "Obavijesti",
    putanja: "/profesor/obavijesti",
    Ikona: Bell,
  },
  {
    naziv: "Profil",
    putanja: "/profesor/profil",
    Ikona: UserRound,
  },
];

export default function ProfesorNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 w-full border-t border-[#e2e7ec] bg-white shadow-[0_-6px_24px_rgba(18,36,55,0.06)]">
      <div className="grid w-full grid-cols-4 md:mx-auto md:max-w-[640px]">
        {stavke.map((stavka) => {
          const aktivna =
            stavka.putanja === "/profesor"
              ? pathname === "/profesor"
              : pathname.startsWith(stavka.putanja);

          const Ikona = stavka.Ikona;

          return (
            <button
              key={stavka.putanja}
              type="button"
              onClick={() => router.push(stavka.putanja)}
              className={`relative flex min-h-[78px] flex-col items-center justify-center gap-1.5 ${
                aktivna
                  ? "text-[#17324d]"
                  : "text-[#8a949e]"
              }`}
            >
              <Ikona
                size={26}
                strokeWidth={aktivna ? 2.5 : 2}
              />

              <span
                className={`text-[14px] ${
                  aktivna
                    ? "font-bold"
                    : "font-semibold"
                }`}
              >
                {stavka.naziv}
              </span>

              {aktivna && (
                <span className="absolute top-0 h-[3px] w-9 rounded-b-full bg-[#c9252d]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}