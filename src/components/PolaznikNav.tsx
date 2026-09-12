"use client";

import { usePathname, useRouter } from "next/navigation";

export default function PolaznikNav() {
  const router = useRouter();
  const pathname = usePathname();

  const stavke = [
    {
      naziv: "Početna",
      ikona: "🏠",
      putanja: "/polaznik",
    },
    {
      naziv: "Raspored",
      ikona: "📅",
      putanja: "/polaznik/raspored",
    },
    {
      naziv: "Obavijesti",
      ikona: "🔔",
      putanja: "/polaznik/obavijesti",
    },
    {
      naziv: "Profil",
      ikona: "👤",
      putanja: "/polaznik/profil",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white">
      <div className="mx-auto grid max-w-xl grid-cols-4">
        {stavke.map((stavka) => {
          const aktivna =
            pathname === stavka.putanja;

          return (
            <button
              key={stavka.putanja}
              onClick={() =>
                router.push(stavka.putanja)
              }
              className={`min-h-20 py-3 ${
                aktivna
                  ? "text-red-600"
                  : "text-neutral-500"
              }`}
            >
              <div className="text-xl">
                {stavka.ikona}
              </div>

              <div
                className={`mt-1 text-sm ${
                  aktivna
                    ? "font-bold"
                    : "font-semibold"
                }`}
              >
                {stavka.naziv}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}