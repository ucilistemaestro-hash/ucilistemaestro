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
    putanja: "/polaznik",
    Ikona: Home,
  },
  {
    naziv: "Raspored",
    putanja: "/polaznik/raspored",
    Ikona: CalendarDays,
  },
  {
    naziv: "Obavijesti",
    putanja: "/polaznik/obavijesti",
    Ikona: Bell,
  },
  {
    naziv: "Profil",
    putanja: "/polaznik/profil",
    Ikona: UserRound,
  },
];

export default function PolaznikNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t border-[#29292f] bg-[#111114]/98 shadow-[0_-12px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="grid w-full grid-cols-4">
        {stavke.map((stavka) => {
          const aktivna =
            stavka.putanja === "/polaznik"
              ? pathname === "/polaznik"
              : pathname.startsWith(stavka.putanja);

          const Ikona = stavka.Ikona;

          return (
            <button
              key={stavka.putanja}
              type="button"
              onClick={() => router.push(stavka.putanja)}
              className={`relative flex min-h-[82px] flex-col items-center justify-center gap-2 ${
                aktivna
                  ? "text-red-500"
                  : "text-[#777780]"
              }`}
            >
              <Ikona
                size={27}
                strokeWidth={aktivna ? 2.6 : 2}
              />

              <span
                className={`text-[13px] leading-none ${
                  aktivna
                    ? "font-bold"
                    : "font-semibold"
                }`}
              >
                {stavka.naziv}
              </span>

              {aktivna && (
                <span className="absolute bottom-1.5 h-1 w-7 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}