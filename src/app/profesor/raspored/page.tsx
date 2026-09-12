"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  ChevronRight,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProfesorNav from "@/components/ProfesorNav";

type Predavanje = {
  predavanje_id: string;
  naziv: string;
  datum: string;
  vrijeme_pocetka: string;
  vrijeme_zavrsetka: string;
  napomena: string | null;
  status: string;
  skupina_naziv: string;
  ucionica_naziv: string | null;
  lokacija: string | null;
};

export default function ProfesorRasporedPage() {
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
      .select("uloga, aktivan")
      .eq("id", user.id)
      .single();

    if (
      profilError ||
      !profil ||
      profil.uloga !== "profesor" ||
      profil.aktivan !== true
    ) {
      router.replace("/login");
      return;
    }

    const {
      data,
      error,
    } = await supabase.rpc(
      "moj_profesorski_raspored"
    );

    if (error) {
      setGreska(
        "Nije moguće učitati raspored."
      );
    } else {
      setRaspored(data ?? []);
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

  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden bg-[#f4f6f8] pb-28">
      <header className="w-full border-b border-[#e2e7ec] bg-white">
        <div className="w-full px-4 py-6 md:mx-auto md:max-w-[640px] md:px-5">
          <p className="text-[13px] font-bold uppercase tracking-[0.09em] text-[#c9252d]">
            Učilište Maestro
          </p>

          <h1 className="mt-1 text-[32px] font-extrabold tracking-[-0.025em] text-[#17202a]">
            Moj raspored
          </h1>

          <p className="mt-2 text-[17px] leading-6 text-[#66717d]">
            Pregled svih vaših nadolazećih termina nastave.
          </p>
        </div>
      </header>

      <div className="w-full px-4 py-6 md:mx-auto md:max-w-[640px] md:px-5">
        {ucitavanje ? (
          <div className="rounded-[22px] border border-[#dfe5ea] bg-white p-6">
            <p className="text-[17px] font-medium text-[#66717d]">
              Učitavanje rasporeda...
            </p>
          </div>
        ) : greska ? (
          <div className="rounded-[22px] border border-red-200 bg-red-50 p-5 text-[17px] leading-7 text-red-700">
            {greska}
          </div>
        ) : buducaPredavanja.length === 0 ? (
          <section className="rounded-[24px] border border-[#dfe5ea] bg-white p-6 shadow-[0_6px_20px_rgba(23,50,77,0.05)]">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#eef3f7] text-[#17324d]">
              <CalendarDays size={25} />
            </div>

            <h2 className="mt-5 text-[22px] font-bold text-[#17202a]">
              Nema nadolazećih termina
            </h2>

            <p className="mt-2 text-[17px] leading-7 text-[#66717d]">
              Novi termini bit će prikazani ovdje čim budu dodijeljeni.
            </p>
          </section>
        ) : (
          <>
            <section className="mb-6 flex items-center justify-between rounded-[20px] border border-[#dfe5ea] bg-white px-5 py-4">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-wide text-[#8b949e]">
                  Nadolazeća nastava
                </p>

                <p className="mt-1 text-[20px] font-bold text-[#17202a]">
                  {buducaPredavanja.length}{" "}
                  {buducaPredavanja.length === 1
                    ? "termin"
                    : "termina"}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3f7] text-[#17324d]">
                <CalendarDays size={24} />
              </div>
            </section>

            <div className="space-y-5">
              {buducaPredavanja.map(
                (predavanje, index) => (
                  <article
                    key={
                      predavanje.predavanje_id
                    }
                    className="w-full overflow-hidden rounded-[24px] border border-[#dfe5ea] bg-white shadow-[0_6px_20px_rgba(23,50,77,0.05)]"
                  >
                    <div
                      className={`px-5 py-4 ${
                        index === 0
                          ? "bg-[#17324d]"
                          : "bg-[#eef3f7]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p
                            className={`text-[13px] font-bold uppercase tracking-[0.08em] ${
                              index === 0
                                ? "text-white/70"
                                : "text-[#66717d]"
                            }`}
                          >
                            {index === 0
                              ? "Sljedeći termin"
                              : "Termin"}
                          </p>

                          <p
                            className={`mt-1 text-[17px] font-bold capitalize ${
                              index === 0
                                ? "text-white"
                                : "text-[#17324d]"
                            }`}
                          >
                            {formatDatum(
                              predavanje.datum
                            )}
                          </p>
                        </div>

                        <CalendarDays
                          size={24}
                          className={
                            index === 0
                              ? "text-white/80"
                              : "text-[#17324d]"
                          }
                        />
                      </div>
                    </div>

                    <div className="p-5">
                      <h2 className="text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-[#17202a]">
                        {predavanje.naziv}
                      </h2>

                      <p className="mt-2 text-[16px] font-bold text-[#c9252d]">
                        {predavanje.skupina_naziv}
                      </p>

                      <div className="mt-6 space-y-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                            <Clock3
                              size={21}
                            />
                          </div>

                          <div>
                            <p className="text-[13px] font-semibold uppercase tracking-wide text-[#8b949e]">
                              Vrijeme
                            </p>

                            <p className="mt-0.5 text-[18px] font-semibold text-[#28333e]">
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
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                            <Users
                              size={21}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold uppercase tracking-wide text-[#8b949e]">
                              Obrazovna skupina
                            </p>

                            <p className="mt-0.5 text-[18px] font-semibold text-[#28333e]">
                              {
                                predavanje.skupina_naziv
                              }
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                            <MapPin
                              size={21}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold uppercase tracking-wide text-[#8b949e]">
                              Lokacija
                            </p>

                            <p className="mt-0.5 text-[18px] font-semibold text-[#28333e]">
                              {predavanje.ucionica_naziv ??
                                "Online / bez učionice"}
                            </p>

                            {predavanje.lokacija && (
                              <p className="mt-1 text-[16px] leading-6 text-[#66717d]">
                                {
                                  predavanje.lokacija
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {predavanje.napomena && (
                        <div className="mt-5 rounded-xl border border-[#e7ebee] bg-[#f6f7f9] p-4">
                          <p className="text-[13px] font-bold uppercase tracking-wide text-[#8b949e]">
                            Napomena
                          </p>

                          <p className="mt-1 text-[17px] leading-7 text-[#4f5b66]">
                            {
                              predavanje.napomena
                            }
                          </p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/profesor/raspored/${predavanje.predavanje_id}/polaznici`
                          )
                        }
                        className="mt-6 flex min-h-[58px] w-full items-center justify-between rounded-[16px] bg-[#17324d] px-5 text-white"
                      >
                        <div className="flex items-center gap-3">
                          <Users size={22} />

                          <span className="text-[17px] font-bold">
                            Prikaži polaznike
                          </span>
                        </div>

                        <ChevronRight
                          size={21}
                        />
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          </>
        )}
      </div>

      <ProfesorNav />
    </main>
  );
}