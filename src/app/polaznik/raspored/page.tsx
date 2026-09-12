"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PolaznikNav from "@/components/PolaznikNav";

type Predavanje = {
  predavanje_id: string;
  naziv: string;
  datum: string;
  vrijeme_pocetka: string;
  vrijeme_zavrsetka: string;
  napomena: string | null;
  status: string;
  skupina_naziv: string;
  profesor_ime: string | null;
  ucionica_naziv: string | null;
  lokacija: string | null;
};

export default function RasporedPage() {
  const router = useRouter();

  const [raspored, setRaspored] =
    useState<Predavanje[]>([]);

  const [ucitavanje, setUcitavanje] =
    useState(true);

  const [greska, setGreska] =
    useState("");

  useEffect(() => {
    ucitajRaspored();
  }, []);

  async function ucitajRaspored() {
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
      await supabase.rpc("moj_raspored");

    if (error) {
      setGreska(
        "Nije moguće učitati raspored."
      );
    } else {
      setRaspored(data ?? []);
    }

    setUcitavanje(false);
  }

  function formatDatuma(datum: string) {
    return new Date(
      datum + "T12:00:00"
    ).toLocaleDateString("hr-HR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function datumVrijeme(
    predavanje: Predavanje
  ) {
    return new Date(
      `${predavanje.datum}T${predavanje.vrijeme_pocetka}`
    );
  }

  const sada = new Date();

  const buducaPredavanja =
    raspored.filter(
      (predavanje) =>
        datumVrijeme(predavanje) >= sada
    );

  return (
    <main className="min-h-screen bg-neutral-100 pb-28">
      <header className="bg-white px-5 py-5 shadow-sm">
        <div className="mx-auto max-w-xl">
          <p className="text-sm font-bold uppercase tracking-wide text-red-600">
            Učilište Maestro
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Moj raspored
          </h1>

          <p className="mt-2 text-base text-neutral-500">
            Nadolazeća predavanja i termini
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
        ) : buducaPredavanja.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              Nema nadolazećih termina
            </h2>

            <p className="mt-2 text-base leading-7 text-neutral-500">
              Trenutačno nema planirane nastave.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {buducaPredavanja.map(
              (predavanje) => (
                <article
                  key={
                    predavanje.predavanje_id
                  }
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-bold uppercase text-red-600">
                    {formatDatuma(
                      predavanje.datum
                    )}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    {predavanje.naziv}
                  </h2>

                  <div className="mt-4 space-y-3 text-lg leading-7 text-neutral-700">
                    <p>
                      🕒{" "}
                      {predavanje.vrijeme_pocetka.slice(
                        0,
                        5
                      )}
                      {" – "}
                      {predavanje.vrijeme_zavrsetka.slice(
                        0,
                        5
                      )}
                    </p>

                    <p>
                      👨‍🏫{" "}
                      {predavanje.profesor_ime ||
                        "Profesor nije naveden"}
                    </p>

                    <p>
                      📍{" "}
                      {predavanje.ucionica_naziv ??
                        "Online / bez učionice"}
                    </p>

                    {predavanje.lokacija && (
                      <p className="pl-7 text-base text-neutral-500">
                        {predavanje.lokacija}
                      </p>
                    )}
                  </div>

                  {predavanje.napomena && (
                    <div className="mt-4 rounded-xl bg-yellow-50 p-4 text-base leading-7 text-yellow-900">
                      <strong>
                        Napomena:
                      </strong>{" "}
                      {predavanje.napomena}
                    </div>
                  )}
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