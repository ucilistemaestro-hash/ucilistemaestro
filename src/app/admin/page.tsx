"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();

  const [ime, setIme] = useState("Administrator");
  const [ucitavanje, setUcitavanje] = useState(true);

  const [programi, setProgrami] = useState(0);
  const [skupine, setSkupine] = useState(0);
  const [ucionice, setUcionice] = useState(0);

  useEffect(() => {
    provjeriPristup();
  }, []);

  async function provjeriPristup() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: profil } = await supabase
      .from("profili")
      .select("ime_prezime, uloga, aktivan")
      .eq("id", user.id)
      .single();

    if (
      !profil ||
      profil.uloga !== "administrator" ||
      profil.aktivan !== true
    ) {
      router.replace("/");
      return;
    }

    setIme(profil.ime_prezime || "Administrator");

    const [programiRez, skupineRez, ucioniceRez] = await Promise.all([
      supabase
        .from("obrazovni_programi")
        .select("*", { count: "exact", head: true }),

      supabase
        .from("obrazovne_skupine")
        .select("*", { count: "exact", head: true }),

      supabase
        .from("ucionice")
        .select("*", { count: "exact", head: true }),
    ]);

    setProgrami(programiRez.count ?? 0);
    setSkupine(skupineRez.count ?? 0);
    setUcionice(ucioniceRez.count ?? 0);

    setUcitavanje(false);
  }

  async function odjava() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (ucitavanje) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100">
        <p className="text-neutral-500">Učitavanje...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-2xl font-black text-red-600">MAESTRO</div>
            <div className="text-xs text-neutral-500">
              Administracija učilišta
            </div>
          </div>

          <button
            onClick={odjava}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold"
          >
            Odjava
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <p className="text-sm text-neutral-500">Dobro došli,</p>

        <h1 className="text-3xl font-bold text-neutral-900">
          {ime}
        </h1>

        <p className="mt-2 text-neutral-500">
          Upravljanje Učilištem Maestro
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">Obrazovni programi</p>
            <p className="mt-2 text-4xl font-black">{programi}</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">Obrazovne skupine</p>
            <p className="mt-2 text-4xl font-black">{skupine}</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">Učionice</p>
            <p className="mt-2 text-4xl font-black">{ucionice}</p>
          </div>
        </div>

        <h2 className="mt-10 text-xl font-bold">
          Upravljanje
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            ["🎓", "Obrazovni programi", "Programi učilišta"],
            ["👥", "Obrazovne skupine", "Skupine i polaznici"],
            ["👨‍🏫", "Profesori", "Predavači i nastavnici"],
            ["🏫", "Učionice", "Prostorije i zauzeće"],
            ["📅", "Raspored", "Predavanja i termini"],
            ["🔔", "Obavijesti", "Poruke i push obavijesti"],
          ].map(([ikona, naslov, opis]) => (
            <button
              key={naslov}
              className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:shadow-md"
            >
              <div className="text-3xl">{ikona}</div>

              <div className="mt-4 text-lg font-bold">
                {naslov}
              </div>

              <div className="mt-1 text-sm text-neutral-500">
                {opis}
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}