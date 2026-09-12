"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PushObavijesti from "@/components/PushObavijesti";

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
    setUcitavanje(true);
    setGreska("");

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
        "Nije moguće učitati raspored: " +
          rasporedRezultat.error.message
      );
    } else {
      setRaspored(rasporedRezultat.data ?? []);
    }

    if (obavijestiRezultat.error) {
      setGreska(
        "Nije moguće učitati obavijesti: " +
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
    return new Date(
      datum + "T12:00:00"
    ).toLocaleDateString("hr-HR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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

  function datumVrijemePredavanja(predavanje: Predavanje) {
    return new Date(
      `${predavanje.datum}T${predavanje.vrijeme_pocetka}`
    );
  }

  const sada = new Date();

  const buducaPredavanja = raspored.filter(
    (predavanje) =>
      datumVrijemePredavanja(predavanje) >= sada
  );

  const sljedece = buducaPredavanja[0];

  const najnovijeObavijesti = obavijesti.slice(0, 3);

  if (ucitavanje) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-6">
        <p className="text-lg font-medium text-neutral-600">
          Učitavanje...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100 pb-28">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-xl items-center justify-between px-5 py-5">
          <div>
            <div className="text-3xl font-black text-red-600">
              MAESTRO
            </div>

            <div className="mt-1 text-sm text-neutral-500">
              Učilište za obrazovanje odraslih
            </div>
          </div>

          <button
            onClick={odjava}
            className="min-h-12 rounded-xl border border-neutral-300 px-4 text-base font-semibold text-neutral-600"
          >
            Odjava
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-5 py-7">
        <p className="text-base text-neutral-500">
          Dobro došli,
        </p>

        <h1 className="mt-1 text-3xl font-bold leading-tight text-neutral-900">
          {ime} 👋
        </h1>

        <p className="mt-2 text-lg text-neutral-600">
          Vaš pregled nastave
        </p>

        <PushObavijesti />

        {greska && (
          <div className="mt-6 rounded-2xl bg-red-50 p-5 text-base leading-7 text-red-700">
            {greska}
          </div>
        )}

        {sljedece ? (
          <section className="mt-7 rounded-3xl border-l-4 border-red-600 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wider text-red-600">
              Sljedeće predavanje
            </p>

            <h2 className="mt-3 text-2xl font-bold leading-tight text-neutral-900">
              {sljedece.naziv}
            </h2>

            <div className="mt-3 rounded-xl bg-red-50 px-4 py-3">
              <p className="text-lg font-bold text-red-700">
                {sljedece.skupina_naziv}
              </p>
            </div>

            <div className="mt-5 space-y-3 text-lg leading-7 text-neutral-700">
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
                👨‍🏫{" "}
                {sljedece.profesor_ime ||
                  "Profesor nije naveden"}
              </p>

              <p>
                📍{" "}
                {sljedece.ucionica_naziv ??
                  "Online / bez učionice"}
              </p>

              {sljedece.lokacija && (
                <p className="pl-7 text-base text-neutral-500">
                  {sljedece.lokacija}
                </p>
              )}
            </div>

            {sljedece.napomena && (
              <div className="mt-5 rounded-xl bg-yellow-50 p-4 text-base leading-7 text-yellow-900">
                <span className="font-bold">
                  Napomena:
                </span>{" "}
                {sljedece.napomena}
              </div>
            )}
          </section>
        ) : (
          <section className="mt-7 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-neutral-900">
              Nema nadolazećih predavanja
            </h2>

            <p className="mt-2 text-base leading-7 text-neutral-500">
              Trenutačno nema planirane nastave.
            </p>
          </section>
        )}

        <section className="mt-9">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-neutral-900">
              Obavijesti
            </h2>

            <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700">
              {obavijesti.length}
            </span>
          </div>

          {najnovijeObavijesti.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white p-5 text-base leading-7 text-neutral-500 shadow-sm">
              Trenutačno nema novih obavijesti.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {najnovijeObavijesti.map((obavijest) => (
                <article
                  key={obavijest.obavijest_id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xl">
                      🔔
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-bold leading-tight text-neutral-900">
                        {obavijest.naslov}
                      </h3>

                      <p className="mt-3 text-base leading-7 text-neutral-700">
                        {obavijest.poruka}
                      </p>

                      {obavijest.link && (
                        <a
                          href={obavijest.link}
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
              ))}
            </div>
          )}
        </section>

        <section className="mt-9">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-neutral-900">
              Moj raspored
            </h2>

            <span className="text-base font-medium text-neutral-500">
              {buducaPredavanja.length} termina
            </span>
          </div>

          {buducaPredavanja.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white p-5 text-base text-neutral-500 shadow-sm">
              Nema nadolazećih termina.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {buducaPredavanja.map((predavanje) => (
                <article
                  key={predavanje.predavanje_id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-bold uppercase tracking-wide text-red-600">
                    {formatDatuma(predavanje.datum)}
                  </p>

                  <h3 className="mt-2 text-xl font-bold leading-tight text-neutral-900">
                    {predavanje.naziv}
                  </h3>

                  <div className="mt-4 space-y-2 text-base leading-7 text-neutral-700">
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
                      <p className="pl-7 text-neutral-500">
                        {predavanje.lokacija}
                      </p>
                    )}
                  </div>

                  {predavanje.napomena && (
                    <div className="mt-4 rounded-xl bg-yellow-50 p-4 text-base leading-7 text-yellow-900">
                      <span className="font-bold">
                        Napomena:
                      </span>{" "}
                      {predavanje.napomena}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-xl grid-cols-4">
          <button className="min-h-20 py-3 text-red-600">
            <div className="text-xl">🏠</div>
            <div className="mt-1 text-sm font-bold">
              Početna
            </div>
          </button>

          <button className="min-h-20 py-3 text-neutral-600">
            <div className="text-xl">📅</div>
            <div className="mt-1 text-sm font-semibold">
              Raspored
            </div>
          </button>

          <button className="min-h-20 py-3 text-neutral-600">
            <div className="text-xl">🔔</div>
            <div className="mt-1 text-sm font-semibold">
              Obavijesti
            </div>
          </button>

          <button className="min-h-20 py-3 text-neutral-600">
            <div className="text-xl">👤</div>
            <div className="mt-1 text-sm font-semibold">
              Profil
            </div>
          </button>
        </div>
      </nav>
    </main>
  );
}