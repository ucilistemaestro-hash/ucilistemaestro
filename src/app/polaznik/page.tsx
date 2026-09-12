"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  GraduationCap,
  MapPin,
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

  function datumVrijemeKraja(
    predavanje: Predavanje
  ) {
    return new Date(
      `${predavanje.datum}T${predavanje.vrijeme_zavrsetka}`
    );
  }

  function formatDatum(
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
        year: "numeric",
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

  const sada = new Date();

  const buducaPredavanja =
    raspored.filter(
      (predavanje) =>
        datumVrijemeKraja(
          predavanje
        ) >= sada
    );

  const sljedece =
    buducaPredavanja[0];

  const najnovijaObavijest =
    obavijesti[0];

  if (ucitavanje) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#0b0b0d] px-6">
        <p className="text-[19px] font-semibold text-[#aaaab3]">
          Učitavanje...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#0b0b0d] pb-32 text-white">
      <header className="px-6 pb-4 pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-red-600 text-[23px] font-black text-white">
            M
          </div>

          <div>
            <div className="text-[25px] font-black leading-none tracking-tight">
              MAESTRO
            </div>

            <div className="mt-1 text-[13px] font-semibold text-[#73737d]">
              Učilište za obrazovanje odraslih
            </div>
          </div>
        </div>

        <p className="mt-10 text-[18px] font-semibold text-[#8d8d96]">
          Dobro došli
        </p>

        <h1 className="mt-1 text-[38px] font-black leading-[1.08] tracking-[-0.03em]">
          {ime}
        </h1>
      </header>

      <div className="px-5">
        <PushObavijesti />

        {greska && (
          <div className="mt-6 rounded-[28px] border border-red-950 bg-red-950/40 p-5 text-[17px] leading-7 text-red-200">
            {greska}
          </div>
        )}

        {sljedece ? (
          <section className="mt-8 rounded-[34px] border border-[#29292f] bg-[#151518] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[15px] font-black uppercase tracking-[0.1em] text-[#777781]">
                Sljedeće predavanje
              </p>

              <span className="rounded-full bg-red-950 px-4 py-2 text-[14px] font-black text-red-400">
                USKORO
              </span>
            </div>

            <div className="mt-8">
              <p className="text-[16px] font-bold uppercase text-[#696973]">
                TERMIN
              </p>

              <h2 className="mt-2 text-[30px] font-black leading-[1.1] tracking-[-0.03em] text-white">
                {sljedece.naziv}
              </h2>

              <p className="mt-3 text-[18px] font-bold text-red-500">
                {sljedece.skupina_naziv}
              </p>
            </div>

            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-4">
                <CalendarDays
                  size={26}
                  className="mt-0.5 shrink-0 text-red-500"
                />

                <p className="text-[19px] font-semibold leading-7 text-white">
                  {formatDatum(
                    sljedece.datum
                  )}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Clock3
                  size={26}
                  className="shrink-0 text-red-500"
                />

                <p className="text-[20px] font-semibold text-[#d7d7dc]">
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

              <div className="flex items-center gap-4">
                <GraduationCap
                  size={26}
                  className="shrink-0 text-red-500"
                />

                <p className="text-[18px] font-medium text-[#c2c2c9]">
                  {sljedece.profesor_ime ||
                    "Profesor nije naveden"}
                </p>
              </div>

              <div className="flex items-start gap-4">
                <MapPin
                  size={26}
                  className="mt-0.5 shrink-0 text-red-500"
                />

                <div>
                  <p className="text-[18px] font-medium text-[#c2c2c9]">
                    {sljedece.ucionica_naziv ??
                      "Online / bez učionice"}
                  </p>

                  {sljedece.lokacija && (
                    <p className="mt-1 text-[16px] leading-6 text-[#73737c]">
                      {sljedece.lokacija}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {sljedece.napomena && (
              <div className="mt-7 border-t border-[#29292f] pt-5">
                <p className="text-[15px] font-bold uppercase tracking-wide text-[#696973]">
                  Napomena
                </p>

                <p className="mt-2 text-[17px] leading-7 text-[#bdbdc5]">
                  {sljedece.napomena}
                </p>
              </div>
            )}
          </section>
        ) : (
          <section className="mt-8 rounded-[34px] border border-[#29292f] bg-[#151518] p-6">
            <p className="text-[15px] font-bold uppercase tracking-wide text-[#71717a]">
              Raspored
            </p>

            <h2 className="mt-5 text-[27px] font-black">
              Nema nadolazeće nastave
            </h2>

            <p className="mt-3 text-[17px] leading-7 text-[#92929c]">
              Novi termini bit će prikazani ovdje.
            </p>
          </section>
        )}

        <div className="mt-5 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/polaznik/raspored"
              )
            }
            className="min-h-[150px] rounded-[30px] border border-[#29292f] bg-[#151518] p-5 text-left"
          >
            <CalendarDays
              size={31}
              className="text-red-500"
            />

            <div className="mt-6 text-[36px] font-black leading-none">
              {buducaPredavanja.length}
            </div>

            <div className="mt-3 text-[15px] font-bold uppercase tracking-wide text-[#74747e]">
              Nadolazećih termina
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/polaznik/obavijesti"
              )
            }
            className="min-h-[150px] rounded-[30px] border border-[#29292f] bg-[#151518] p-5 text-left"
          >
            <Bell
              size={31}
              className="text-red-500"
            />

            <div className="mt-6 text-[36px] font-black leading-none">
              {obavijesti.length}
            </div>

            <div className="mt-3 text-[15px] font-bold uppercase tracking-wide text-[#74747e]">
              Obavijesti
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/polaznik/raspored"
            )
          }
          className="mt-5 flex min-h-[70px] w-full items-center justify-center gap-3 rounded-[24px] bg-red-600 px-6 text-[19px] font-black text-white shadow-[0_16px_35px_rgba(220,38,38,0.2)]"
        >
          <CalendarDays size={24} />
          PRIKAŽI MOJ RASPORED
        </button>

        <section className="mt-9">
          <div className="flex items-center justify-between">
            <h2 className="text-[25px] font-black">
              Najnovija obavijest
            </h2>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/polaznik/obavijesti"
                )
              }
              className="flex min-h-11 items-center gap-1 text-[16px] font-bold text-red-500"
            >
              Sve
              <ChevronRight size={20} />
            </button>
          </div>

          {najnovijaObavijest ? (
            <article className="mt-4 rounded-[30px] border border-[#29292f] bg-[#151518] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-950 text-red-400">
                  <Bell size={27} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-[21px] font-black leading-7">
                    {
                      najnovijaObavijest.naslov
                    }
                  </h3>

                  <p className="mt-3 text-[17px] leading-7 text-[#ababB4]">
                    {
                      najnovijaObavijest.poruka
                    }
                  </p>

                  <p className="mt-5 text-[14px] font-semibold text-[#65656f]">
                    {formatDatumObjave(
                      najnovijaObavijest.datum_objave
                    )}
                  </p>
                </div>
              </div>

              {najnovijaObavijest.link && (
                <a
                  href={
                    najnovijaObavijest.link
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 flex min-h-[54px] w-full items-center justify-center rounded-2xl border border-[#34343a] bg-[#202024] text-[16px] font-bold text-white"
                >
                  Otvori poveznicu
                </a>
              )}
            </article>
          ) : (
            <div className="mt-4 rounded-[30px] border border-[#29292f] bg-[#151518] p-6 text-[17px] text-[#8b8b95]">
              Trenutačno nema novih obavijesti.
            </div>
          )}
        </section>
      </div>

      <PolaznikNav />
    </main>
  );
}