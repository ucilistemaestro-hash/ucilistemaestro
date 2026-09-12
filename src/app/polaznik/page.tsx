"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Clock3,
  GraduationCap,
  MapPin,
  UserRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import PushObavijesti from "@/components/PushObavijesti";
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
  const [raspored, setRaspored] =
    useState<Predavanje[]>([]);
  const [obavijesti, setObavijesti] =
    useState<Obavijest[]>([]);

  const [ucitavanje, setUcitavanje] =
    useState(true);
  const [greska, setGreska] =
    useState("");

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

    const {
      data: profil,
      error: profilError,
    } = await supabase
      .from("profili")
      .select(
        "ime_prezime, uloga, aktivan"
      )
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

    setIme(
      profil.ime_prezime ||
        "Polaznik"
    );

    const [
      rasporedRezultat,
      obavijestiRezultat,
    ] = await Promise.all([
      supabase.rpc("moj_raspored"),
      supabase.rpc("moje_obavijesti"),
    ]);

    if (rasporedRezultat.error) {
      setGreska(
        "Nije moguće učitati raspored."
      );
    } else {
      setRaspored(
        rasporedRezultat.data ?? []
      );
    }

    if (obavijestiRezultat.error) {
      setGreska(
        "Nije moguće učitati obavijesti."
      );
    } else {
      setObavijesti(
        obavijestiRezultat.data ?? []
      );
    }

    setUcitavanje(false);
  }

  function formatDatuma(
    datum: string
  ) {
    return new Date(
      datum + "T12:00:00"
    ).toLocaleDateString(
      "hr-HR",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
      }
    );
  }

  function formatDatumObjave(
    datum: string
  ) {
    return new Date(
      datum
    ).toLocaleDateString(
      "hr-HR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  function krajPredavanja(
    predavanje: Predavanje
  ) {
    return new Date(
      `${predavanje.datum}T${predavanje.vrijeme_zavrsetka}`
    );
  }

  const sada = new Date();

  const buducaPredavanja =
    raspored.filter(
      (predavanje) =>
        krajPredavanja(predavanje) >=
        sada
    );

  const sljedece =
    buducaPredavanja[0];

  const najnovijeObavijesti =
    obavijesti.slice(0, 2);

  if (ucitavanje) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-neutral-100 px-5">
        <p className="text-[18px] font-semibold text-neutral-600">
          Učitavanje...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-neutral-100 pb-28">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-5">
          <div>
            <div className="text-[28px] font-black leading-none tracking-tight text-red-600">
              MAESTRO
            </div>

            <p className="mt-1.5 text-[14px] font-medium text-neutral-500">
              Učilište za obrazovanje odraslih
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
            <UserRound
              size={24}
              strokeWidth={2}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg px-4 py-6">
        <div>
          <p className="text-[16px] font-medium text-neutral-500">
            Dobro došli
          </p>

          <h1 className="mt-1 text-[32px] font-black leading-[1.12] tracking-tight text-neutral-900">
            {ime}
          </h1>

          <p className="mt-2 text-[17px] leading-6 text-neutral-600">
            Ovdje su vaš raspored i najvažnije
            informacije.
          </p>
        </div>

        <PushObavijesti />

        {greska && (
          <div className="mt-6 rounded-2xl bg-red-50 p-5 text-[17px] leading-7 text-red-700">
            {greska}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/polaznik/raspored"
              )
            }
            className="flex min-h-[86px] items-center gap-3 rounded-3xl bg-white p-4 text-left shadow-sm"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <CalendarDays size={24} />
            </div>

            <div>
              <div className="text-[17px] font-bold text-neutral-900">
                Raspored
              </div>

              <div className="mt-0.5 text-[14px] text-neutral-500">
                Svi termini
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/polaznik/obavijesti"
              )
            }
            className="flex min-h-[86px] items-center gap-3 rounded-3xl bg-white p-4 text-left shadow-sm"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Bell size={24} />
            </div>

            <div>
              <div className="text-[17px] font-bold text-neutral-900">
                Obavijesti
              </div>

              <div className="mt-0.5 text-[14px] text-neutral-500">
                {obavijesti.length} ukupno
              </div>
            </div>
          </button>
        </div>

        {sljedece ? (
          <section className="mt-7 overflow-hidden rounded-[28px] bg-white shadow-sm">
            <div className="bg-red-600 px-5 py-3">
              <p className="text-[14px] font-bold uppercase tracking-[0.08em] text-white">
                Sljedeće predavanje
              </p>
            </div>

            <div className="p-5">
              <h2 className="text-[25px] font-black leading-tight tracking-tight text-neutral-900">
                {sljedece.naziv}
              </h2>

              <div className="mt-3 inline-flex rounded-xl bg-red-50 px-3 py-2 text-[16px] font-bold text-red-700">
                {sljedece.skupina_naziv}
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarDays
                    size={23}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <p className="text-[18px] font-semibold leading-6 text-neutral-800">
                    {formatDatuma(
                      sljedece.datum
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Clock3
                    size={23}
                    className="shrink-0 text-red-600"
                  />

                  <p className="text-[18px] text-neutral-700">
                    {sljedece.vrijeme_pocetka.slice(
                      0,
                      5
                    )}
                    {" – "}
                    {sljedece.vrijeme_zavrsetka.slice(
                      0,
                      5
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <GraduationCap
                    size={23}
                    className="shrink-0 text-red-600"
                  />

                  <p className="text-[18px] text-neutral-700">
                    {sljedece.profesor_ime ||
                      "Profesor nije naveden"}
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin
                    size={23}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <div>
                    <p className="text-[18px] text-neutral-700">
                      {sljedece.ucionica_naziv ??
                        "Online / bez učionice"}
                    </p>

                    {sljedece.lokacija && (
                      <p className="mt-1 text-[16px] leading-6 text-neutral-500">
                        {sljedece.lokacija}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {sljedece.napomena && (
                <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-[16px] leading-6 text-amber-900">
                  <strong>Napomena:</strong>{" "}
                  {sljedece.napomena}
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="mt-7 rounded-[28px] bg-white p-6 shadow-sm">
            <h2 className="text-[22px] font-bold text-neutral-900">
              Nema nadolazećih predavanja
            </h2>

            <p className="mt-2 text-[17px] leading-7 text-neutral-600">
              Trenutačno nema planirane nastave.
            </p>
          </section>
        )}

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-[24px] font-black tracking-tight text-neutral-900">
              Obavijesti
            </h2>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/polaznik/obavijesti"
                )
              }
              className="flex min-h-11 items-center gap-1 text-[16px] font-bold text-red-600"
            >
              Sve
              <ArrowRight size={19} />
            </button>
          </div>

          {najnovijeObavijesti.length ===
          0 ? (
            <div className="mt-4 rounded-3xl bg-white p-5 text-[17px] text-neutral-600 shadow-sm">
              Trenutačno nema novih
              obavijesti.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {najnovijeObavijesti.map(
                (obavijest) => (
                  <article
                    key={
                      obavijest.obavijest_id
                    }
                    className="rounded-3xl bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <Bell size={23} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-[19px] font-bold leading-6 text-neutral-900">
                          {obavijest.naslov}
                        </h3>

                        <p className="mt-2 text-[17px] leading-7 text-neutral-700">
                          {obavijest.poruka}
                        </p>

                        <p className="mt-3 text-[14px] font-medium text-neutral-400">
                          {formatDatumObjave(
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
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-[24px] font-black tracking-tight text-neutral-900">
              Sljedeći termini
            </h2>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/polaznik/raspored"
                )
              }
              className="flex min-h-11 items-center gap-1 text-[16px] font-bold text-red-600"
            >
              Sve
              <ArrowRight size={19} />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {buducaPredavanja
              .slice(0, 2)
              .map((predavanje) => (
                <article
                  key={
                    predavanje.predavanje_id
                  }
                  className="rounded-3xl bg-white p-5 shadow-sm"
                >
                  <p className="text-[14px] font-bold uppercase tracking-wide text-red-600">
                    {formatDatuma(
                      predavanje.datum
                    )}
                  </p>

                  <h3 className="mt-2 text-[20px] font-bold leading-6 text-neutral-900">
                    {predavanje.naziv}
                  </h3>

                  <div className="mt-4 flex items-center gap-3 text-[17px] text-neutral-700">
                    <Clock3
                      size={21}
                      className="shrink-0 text-neutral-400"
                    />

                    <span>
                      {predavanje.vrijeme_pocetka.slice(
                        0,
                        5
                      )}
                      {" – "}
                      {predavanje.vrijeme_zavrsetka.slice(
                        0,
                        5
                      )}
                    </span>
                  </div>
                </article>
              ))}
          </div>
        </section>
      </div>

      <PolaznikNav />
    </main>
  );
}