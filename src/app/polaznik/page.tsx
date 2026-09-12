"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

type Obavijest = {
  obavijest_id: string;
  naslov: string;
  poruka: string;
  link: string | null;
  datum_objave: string;
  cilj: string;
};

export default function PolaznikPage() {
  const router = useRouter();

  const [ime, setIme] = useState("");
  const [raspored, setRaspored] = useState<Predavanje[]>([]);
  const [obavijesti, setObavijesti] = useState<Obavijest[]>([]);

  const [ucitavanje, setUcitavanje] = useState(true);
  const [greska, setGreska] = useState("");

  useEffect(() => {
    ucitajPolaznika();
  }, []);

  async function ucitajPolaznika() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: profil, error: profilError } = await supabase
      .from("profili")
      .select("ime_prezime, uloga, aktivan")
      .eq("id", user.id)
      .single();

    if (
      profilError ||
      !profil ||
      profil.uloga !== "polaznik" ||
      profil.aktivan !== true
    ) {
      router.replace("/login");
      return;
    }

    setIme(profil.ime_prezime || "Polaznik");

    const [rasporedRezultat, obavijestiRezultat] =
      await Promise.all([
        supabase.rpc("moj_raspored"),
        supabase.rpc("moje_obavijesti"),
      ]);

    if (rasporedRezultat.error) {
      setGreska(
        "Greška kod učitavanja rasporeda: " +
          rasporedRezultat.error.message
      );
    } else {
      setRaspored(rasporedRezultat.data ?? []);
    }

    if (obavijestiRezultat.error) {
      setGreska(
        "Greška kod učitavanja obavijesti: " +
          obavijestiRezultat.error.message
      );
    } else {
      setObavijesti(obavijestiRezultat.data ?? []);
    }

    setUcitavanje(false);
  }

  async function odjava() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function formatDatuma(datum: string) {
    return new Date(datum + "T12:00:00").toLocaleDateString(
      "hr-HR",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  function formatDatumVrijeme(datum: string) {
    return new Date(datum).toLocaleString("hr-HR", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const sada = new Date();

  const danas =
    sada.getFullYear() +
    "-" +
    String(sada.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(sada.getDate()).padStart(2, "0");

  const buducaPredavanja = raspored.filter(
    (predavanje) => predavanje.datum >= danas
  );

  const sljedece = buducaPredavanja[0];

  const najnovijeObavijesti = obavijesti.slice(0, 3);

  if (ucitavanje) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100">
        <p>Učitavanje...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100 pb-24">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-xl items-center justify-between px-5 py-4">
          <div>
            <div className="text-2xl font-black text-red-600">
              MAESTRO
            </div>

            <div className="text-xs text-neutral-500">
              Učilište za obrazovanje odraslih
            </div>
          </div>

          <button
            onClick={odjava}
            className="text-sm font-semibold text-neutral-500"
          >
            Odjava
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-5 py-6">
        <p className="text-sm text-neutral-500">
          Dobro došli,
        </p>

        <h1 className="mt-1 text-2xl font-bold">
          {ime} 👋
        </h1>

        {greska && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {greska}
          </div>
        )}

        {sljedece ? (
          <section className="mt-6 rounded-3xl border-l-4 border-red-600 bg-white p-6 text-neutral-900 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-red-600">
              Sljedeće predavanje
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              {sljedece.naziv}
            </h2>

            <div className="mt-5 space-y-2 text-sm text-neutral-600">
              <p>
                📅 {formatDatuma(sljedece.datum)}
              </p>

              <p>
                🕒{" "}
                {sljedece.vrijeme_pocetka.slice(0, 5)}
                {" – "}
                {sljedece.vrijeme_zavrsetka.slice(0, 5)}
              </p>

              <p>
                👨‍🏫 {sljedece.profesor_ime}
              </p>

              <p>
                📍{" "}
                {sljedece.ucionica_naziv ??
                  "Online / bez učionice"}
              </p>

              {sljedece.lokacija && (
                <p className="text-neutral-500">
                  {sljedece.lokacija}
                </p>
              )}
            </div>
          </section>
        ) : (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="font-bold">
              Nema nadolazećih predavanja
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              Trenutačno nema planirane nastave.
            </p>
          </section>
        )}

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Obavijesti
            </h2>

            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">
              {obavijesti.length}
            </span>
          </div>

          {najnovijeObavijesti.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white p-5 text-sm text-neutral-500 shadow-sm">
              Trenutačno nema novih obavijesti.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {najnovijeObavijesti.map((obavijest) => (
                <div
                  key={obavijest.obavijest_id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
                      🔔
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-neutral-900">
                        {obavijest.naslov}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        {obavijest.poruka}
                      </p>

                      {obavijest.link && (
                        <a
                          href={obavijest.link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-block rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
                        >
                          Otvori poveznicu
                        </a>
                      )}

                      <p className="mt-3 text-xs text-neutral-400">
                        {formatDatumVrijeme(
                          obavijest.datum_objave
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Moj raspored
            </h2>

            <span className="text-sm text-neutral-500">
              {buducaPredavanja.length} termina
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {buducaPredavanja.map((predavanje) => (
              <div
                key={predavanje.predavanje_id}
                className="rounded-2xl bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase text-red-600">
                  {formatDatuma(predavanje.datum)}
                </p>

                <h3 className="mt-2 text-lg font-bold">
                  {predavanje.naziv}
                </h3>

                <p className="mt-3 text-sm text-neutral-600">
                  🕒{" "}
                  {predavanje.vrijeme_pocetka.slice(0, 5)}
                  {" – "}
                  {predavanje.vrijeme_zavrsetka.slice(0, 5)}
                </p>

                <p className="mt-1 text-sm text-neutral-600">
                  👨‍🏫 {predavanje.profesor_ime}
                </p>

                <p className="mt-1 text-sm text-neutral-600">
                  📍{" "}
                  {predavanje.ucionica_naziv ??
                    "Online / bez učionice"}
                </p>

                {predavanje.napomena && (
                  <div className="mt-3 rounded-xl bg-neutral-100 p-3 text-sm text-neutral-600">
                    {predavanje.napomena}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-xl grid-cols-4">
          <button className="py-3 text-red-600">
            <div>🏠</div>
            <div className="mt-1 text-xs font-semibold">
              Početna
            </div>
          </button>

          <button className="py-3 text-neutral-500">
            <div>📅</div>
            <div className="mt-1 text-xs">
              Raspored
            </div>
          </button>

          <button className="py-3 text-neutral-500">
            <div>🔔</div>
            <div className="mt-1 text-xs">
              Obavijesti
            </div>
          </button>

          <button className="py-3 text-neutral-500">
            <div>👤</div>
            <div className="mt-1 text-xs">
              Profil
            </div>
          </button>
        </div>
      </nav>
    </main>
  );
}