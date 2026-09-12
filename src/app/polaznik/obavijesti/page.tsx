"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PolaznikNav from "@/components/PolaznikNav";

type Obavijest = {
  obavijest_id: string;
  naslov: string;
  poruka: string;
  link: string | null;
  datum_objave: string;
  cilj: string;
};

export default function ObavijestiPage() {
  const router = useRouter();

  const [obavijesti, setObavijesti] =
    useState<Obavijest[]>([]);

  const [ucitavanje, setUcitavanje] =
    useState(true);

  const [greska, setGreska] =
    useState("");

  useEffect(() => {
    ucitajObavijesti();
  }, []);

  async function ucitajObavijesti() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: profil } = await supabase
      .from("profili")
      .select("uloga, aktivan")
      .eq("id", user.id)
      .single();

    if (
      !profil ||
      profil.uloga !== "polaznik" ||
      profil.aktivan !== true
    ) {
      router.replace("/login");
      return;
    }

    const { data, error } =
      await supabase.rpc(
        "moje_obavijesti"
      );

    if (error) {
      setGreska(
        "Nije moguće učitati obavijesti."
      );
    } else {
      setObavijesti(data ?? []);
    }

    setUcitavanje(false);
  }

  function formatDatumVrijeme(
    datum: string
  ) {
    return new Date(
      datum
    ).toLocaleString("hr-HR", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="min-h-screen bg-neutral-100 pb-28">
      <header className="bg-white px-5 py-5 shadow-sm">
        <div className="mx-auto max-w-xl">
          <p className="text-sm font-bold uppercase tracking-wide text-red-600">
            Učilište Maestro
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Obavijesti
          </h1>

          <p className="mt-2 text-base text-neutral-500">
            Važne informacije Učilišta
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-5 py-6">
        {ucitavanje ? (
          <p className="text-lg text-neutral-500">
            Učitavanje...
          </p>
        ) : greska ? (
          <div className="rounded-2xl bg-red-50 p-5 text-base text-red-700">
            {greska}
          </div>
        ) : obavijesti.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              Nema obavijesti
            </h2>

            <p className="mt-2 text-base text-neutral-500">
              Trenutačno nema novih
              obavijesti.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {obavijesti.map(
              (obavijest) => (
                <article
                  key={
                    obavijest.obavijest_id
                  }
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xl">
                      🔔
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-bold leading-tight">
                        {obavijest.naslov}
                      </h2>

                      <p className="mt-3 text-base leading-7 text-neutral-700">
                        {obavijest.poruka}
                      </p>

                      {obavijest.link && (
                        <a
                          href={
                            obavijest.link
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-red-600 px-5 text-base font-bold text-white"
                        >
                          Otvori poveznicu
                        </a>
                      )}

                      <p className="mt-4 text-sm text-neutral-400">
                        {formatDatumVrijeme(
                          obavijest.datum_objave
                        )}
                      </p>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </div>

      <PolaznikNav />
    </main>
  );
}