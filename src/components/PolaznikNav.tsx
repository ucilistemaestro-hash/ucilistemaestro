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
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className="mx-auto grid w-full max-w-lg grid-cols-4">
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
              className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 px-1 ${
                aktivna
                  ? "text-red-600"
                  : "text-neutral-500"
              }`}
            >
              <Ikona
                size={25}
                strokeWidth={aktivna ? 2.5 : 2}
              />

              <span
                className={`text-[13px] leading-none ${
                  aktivna ? "font-bold" : "font-semibold"
                }`}
              >
                {stavka.naziv}
              </span>

              {aktivna && (
                <span className="mt-0.5 h-1 w-5 rounded-full bg-red-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}