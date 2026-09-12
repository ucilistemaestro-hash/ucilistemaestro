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

  function krajPredavanja(
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
        krajPredavanja(predavanje) >= sada
    );

  const sljedece =
    buducaPredavanja[0];

  const najnovijeObavijesti =
    obavijesti.slice(0, 2);

  if (ucitavanje) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f4f6f8] px-6">
        <p className="text-[18px] font-semibold text-[#66717d]">
          Učitavanje...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f4f6f8] pb-28">
      <header className="border-b border-[#e2e7ec] bg-white">
        <div className="mx-auto flex w-full max-w-[560px] items-center justify-between px-5 py-5">
          <div>
            <div className="text-[26px] font-black tracking-[-0.02em] text-[#c9252d]">
              MAESTRO
            </div>

            <p className="mt-0.5 text-[13px] font-medium text-[#66717d]">
              Učilište za obrazovanje odraslih
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/polaznik/profil")
            }
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef2f5] text-[#17324d]"
          >
            <UserRound size={23} />
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[560px] px-5 py-7">
        <section>
          <p className="text-[16px] font-medium text-[#66717d]">
            Dobro došli,
          </p>

          <h1 className="mt-1 text-[32px] font-extrabold leading-[1.15] tracking-[-0.025em] text-[#17202a]">
            {ime}
          </h1>

          <p className="mt-2 text-[17px] leading-6 text-[#66717d]">
            Pregled vaših predavanja i važnih informacija.
          </p>
        </section>

        <PushObavijesti />

        {greska && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-[16px] leading-6 text-red-700">
            {greska}
          </div>
        )}

        {sljedece ? (
          <section className="mt-7 overflow-hidden rounded-[24px] border border-[#dfe5ea] bg-white shadow-[0_8px_24px_rgba(23,50,77,0.06)]">
            <div className="flex items-center justify-between bg-[#17324d] px-5 py-4">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-[0.09em] text-white/70">
                  Sljedeće predavanje
                </p>

                <p className="mt-1 text-[15px] font-semibold text-white">
                  {formatDatum(sljedece.datum)}
                </p>
              </div>

              <CalendarDays
                size={25}
                className="text-white/80"
              />
            </div>

            <div className="p-5">
              <h2 className="text-[25px] font-extrabold leading-tight tracking-[-0.02em] text-[#17202a]">
                {sljedece.naziv}
              </h2>

              <p className="mt-2 text-[16px] font-bold text-[#c9252d]">
                {sljedece.skupina_naziv}
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                    <Clock3 size={20} />
                  </div>

                  <div>
                    <p className="text-[13px] font-semibold uppercase tracking-wide text-[#8b949e]">
                      Vrijeme
                    </p>

                    <p className="mt-0.5 text-[17px] font-semibold text-[#28333e]">
                      {sljedece.vrijeme_pocetka.slice(0, 5)}
                      {" – "}
                      {sljedece.vrijeme_zavrsetka.slice(0, 5)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                    <GraduationCap size={21} />
                  </div>

                  <div>
                    <p className="text-[13px] font-semibold uppercase tracking-wide text-[#8b949e]">
                      Profesor
                    </p>

                    <p className="mt-0.5 text-[17px] font-semibold text-[#28333e]">
                      {sljedece.profesor_ime ||
                        "Profesor nije naveden"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                    <MapPin size={20} />
                  </div>

                  <div>
                    <p className="text-[13px] font-semibold uppercase tracking-wide text-[#8b949e]">
                      Lokacija
                    </p>

                    <p className="mt-0.5 text-[17px] font-semibold text-[#28333e]">
                      {sljedece.ucionica_naziv ??
                        "Online / bez učionice"}
                    </p>

                    {sljedece.lokacija && (
                      <p className="mt-1 text-[15px] leading-6 text-[#66717d]">
                        {sljedece.lokacija}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {sljedece.napomena && (
                <div className="mt-5 rounded-xl bg-[#f6f7f9] p-4">
                  <p className="text-[13px] font-bold uppercase tracking-wide text-[#8b949e]">
                    Napomena
                  </p>

                  <p className="mt-1 text-[16px] leading-6 text-[#4f5b66]">
                    {sljedece.napomena}
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="mt-7 rounded-[24px] border border-[#dfe5ea] bg-white p-6">
            <h2 className="text-[21px] font-bold text-[#17202a]">
              Nema nadolazećih predavanja
            </h2>

            <p className="mt-2 text-[16px] leading-6 text-[#66717d]">
              Novi termini pojavit će se ovdje čim budu
              objavljeni.
            </p>
          </section>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              router.push("/polaznik/raspored")
            }
            className="rounded-[20px] border border-[#dfe5ea] bg-white p-5 text-left shadow-[0_5px_18px_rgba(23,50,77,0.04)]"
          >
            <CalendarDays
              size={26}
              className="text-[#17324d]"
            />

            <div className="mt-5 text-[30px] font-extrabold leading-none text-[#17202a]">
              {buducaPredavanja.length}
            </div>

            <p className="mt-2 text-[14px] font-semibold leading-5 text-[#66717d]">
              Nadolazećih termina
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/polaznik/obavijesti")
            }
            className="rounded-[20px] border border-[#dfe5ea] bg-white p-5 text-left shadow-[0_5px_18px_rgba(23,50,77,0.04)]"
          >
            <Bell
              size={26}
              className="text-[#17324d]"
            />

            <div className="mt-5 text-[30px] font-extrabold leading-none text-[#17202a]">
              {obavijesti.length}
            </div>

            <p className="mt-2 text-[14px] font-semibold leading-5 text-[#66717d]">
              Obavijesti
            </p>
          </button>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("/polaznik/raspored")
          }
          className="mt-4 flex min-h-[58px] w-full items-center justify-between rounded-[18px] bg-[#17324d] px-5 text-left text-white"
        >
          <div>
            <p className="text-[16px] font-bold">
              Pogledaj cijeli raspored
            </p>

            <p className="mt-0.5 text-[13px] text-white/70">
              Svi nadolazeći termini
            </p>
          </div>

          <ArrowRight size={22} />
        </button>

        <section className="mt-9">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#c9252d]">
                Aktualno
              </p>

              <h2 className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#17202a]">
                Obavijesti
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/polaznik/obavijesti")
              }
              className="flex min-h-11 items-center gap-1 text-[15px] font-bold text-[#17324d]"
            >
              Prikaži sve
              <ArrowRight size={18} />
            </button>
          </div>

          {najnovijeObavijesti.length === 0 ? (
            <div className="mt-4 rounded-[20px] border border-[#dfe5ea] bg-white p-5 text-[16px] text-[#66717d]">
              Trenutačno nema novih obavijesti.
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-[22px] border border-[#dfe5ea] bg-white">
              {najnovijeObavijesti.map(
                (obavijest, index) => (
                  <article
                    key={obavijest.obavijest_id}
                    className={`flex gap-4 p-5 ${
                      index !==
                      najnovijeObavijesti.length - 1
                        ? "border-b border-[#e8ecef]"
                        : ""
                    }`}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                      <Bell size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-[18px] font-bold leading-6 text-[#17202a]">
                        {obavijest.naslov}
                      </h3>

                      <p className="mt-1.5 text-[16px] leading-6 text-[#5e6974]">
                        {obavijest.poruka}
                      </p>

                      <p className="mt-3 text-[13px] font-medium text-[#929ba4]">
                        {formatDatumObjave(
                          obavijest.datum_objave
                        )}
                      </p>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>

      <PolaznikNav />
    </main>
  );
}