"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PolaznikNav from "@/components/PolaznikNav";
import PushObavijesti from "@/components/PushObavijesti";

type Profil = {
  ime_prezime: string | null;
  email: string | null;
  telefon: string | null;
};

export default function ProfilPage() {
  const router = useRouter();

  const [profil, setProfil] =
    useState<Profil | null>(null);

  const [ucitavanje, setUcitavanje] =
    useState(true);

  useEffect(() => {
    ucitajProfil();
  }, []);

  async function ucitajProfil() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("profili")
      .select(
        "ime_prezime, email, telefon, uloga, aktivan"
      )
      .eq("id", user.id)
      .single();

    if (
      error ||
      !data ||
      data.uloga !== "polaznik" ||
      data.aktivan !== true
    ) {
      router.replace("/login");
      return;
    }

    setProfil({
      ime_prezime:
        data.ime_prezime,
      email:
        data.email ||
        user.email ||
        null,
      telefon:
        data.telefon,
    });

    setUcitavanje(false);
  }

  async function odjava() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-neutral-100 pb-28">
      <header className="bg-white px-5 py-5 shadow-sm">
        <div className="mx-auto max-w-xl">
          <p className="text-sm font-bold uppercase tracking-wide text-red-600">
            Učilište Maestro
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Moj profil
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-5 py-6">
        {ucitavanje ? (
          <p className="text-lg text-neutral-500">
            Učitavanje...
          </p>
        ) : profil ? (
          <>
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-3xl">
                👤
              </div>

              <h2 className="mt-5 text-2xl font-bold">
                {profil.ime_prezime ||
                  "Polaznik"}
              </h2>

              <p className="mt-1 text-base font-semibold text-red-600">
                Polaznik
              </p>

              <div className="mt-7 space-y-5">
                <div>
                  <p className="text-sm font-bold uppercase text-neutral-400">
                    E-mail
                  </p>

                  <p className="mt-1 break-all text-lg text-neutral-800">
                    {profil.email ||
                      "Nije upisan"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-bold uppercase text-neutral-400">
                    Telefon
                  </p>

                  <p className="mt-1 text-lg text-neutral-800">
                    {profil.telefon ||
                      "Nije upisan"}
                  </p>
                </div>
              </div>
            </section>

            <PushObavijesti />

            <button
              onClick={odjava}
              className="mt-6 min-h-14 w-full rounded-2xl border-2 border-red-600 bg-white px-5 text-lg font-bold text-red-600"
            >
              Odjavi se
            </button>
          </>
        ) : null}
      </div>

      <PolaznikNav />
    </main>
  );
}