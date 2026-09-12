"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock3,
  LoaderCircle,
  MapPin,
  Users,
} from "lucide-react";

import { useRouter } from "next/navigation";

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
    void ucitajRaspored();
  }, []);

  async function ucitajRaspored() {
    setUcitavanje(true);
    setGreska("");

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

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
        "uloga, aktivan"
      )
      .eq(
        "id",
        user.id
      )
      .single();

    if (
      profilError ||
      !profil ||
      profil.uloga !==
        "profesor" ||
      profil.aktivan !==
        true
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
      setRaspored(
        data ?? []
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
        year: "numeric",
      }
    );
  }

  const sada =
    new Date();

  const buducaPredavanja =
    raspored.filter(
      (predavanje) =>
        krajPredavanja(
          predavanje
        ) >= sada
    );

  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden bg-[#f4f6f8] pb-28">
      <header className="sticky top-0 z-20 w-full border-b border-[#e2e7ec] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[640px] items-center gap-3 px-4 py-4 md:px-5">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/profesor"
              )
            }
            aria-label="Povratak na početnu stranicu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e2e7ec] bg-[#f7f9fa] text-[#17324d] transition hover:bg-[#eef2f5]"
          >
            <ArrowLeft
              size={21}
            />
          </button>

          <div className="min-w-0">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#c9252d]">
              Učilište Maestro
            </p>

            <h1 className="mt-0.5 text-[22px] font-extrabold tracking-[-0.02em] text-[#17202a]">
              Moj raspored
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[640px] px-4 py-6 md:px-5">
        <section>
          <h2 className="text-[28px] font-extrabold tracking-[-0.025em] text-[#17202a]">
            Nadolazeća nastava
          </h2>

          <p className="mt-2 text-[15px] leading-6 text-[#66717d]">
            Pregled svih vaših budućih termina,
            obrazovnih skupina, lokacija i popisa
            polaznika.
          </p>
        </section>

        {ucitavanje ? (
          <div className="mt-6 flex min-h-[180px] items-center justify-center rounded-[22px] border border-[#dfe5ea] bg-white">
            <div className="flex flex-col items-center gap-3">
              <LoaderCircle
                size={30}
                className="animate-spin text-[#c9252d]"
              />

              <p className="text-[15px] font-semibold text-[#66717d]">
                Učitavanje rasporeda...
              </p>
            </div>
          </div>
        ) : greska ? (
          <div className="mt-6 rounded-[20px] border border-[#f2c7ca] bg-[#fff5f5] px-4 py-4 text-[15px] leading-6 text-[#a71d24]">
            {greska}
          </div>
        ) : buducaPredavanja.length ===
          0 ? (
          <section className="mt-6 rounded-[24px] border border-[#dfe5ea] bg-white p-5 shadow-[0_6px_20px_rgba(23,50,77,0.04)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
              <CalendarDays
                size={22}
              />
            </div>

            <h2 className="mt-4 text-[20px] font-bold text-[#17202a]">
              Nema nadolazećih termina
            </h2>

            <p className="mt-2 text-[15px] leading-6 text-[#66717d]">
              Novi termini bit će prikazani ovdje čim
              vam budu dodijeljeni.
            </p>
          </section>
        ) : (
          <>
            <section className="mt-6 flex items-center justify-between rounded-[20px] border border-[#dfe5ea] bg-white px-5 py-4 shadow-[0_4px_16px_rgba(23,50,77,0.03)]">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                  Ukupno
                </p>

                <p className="mt-1 text-[20px] font-bold text-[#17202a]">
                  {
                    buducaPredavanja.length
                  }{" "}
                  {buducaPredavanja.length ===
                  1
                    ? "nadolazeći termin"
                    : "nadolazećih termina"}
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                <CalendarDays
                  size={22}
                />
              </div>
            </section>

            <div className="mt-5 space-y-4">
              {buducaPredavanja.map(
                (
                  predavanje,
                  index
                ) => (
                  <article
                    key={
                      predavanje.predavanje_id
                    }
                    className="overflow-hidden rounded-[24px] border border-[#dfe5ea] bg-white shadow-[0_8px_24px_rgba(23,50,77,0.05)]"
                  >
                    <div
                      className={`flex items-center justify-between gap-4 px-5 py-4 ${
                        index ===
                        0
                          ? "bg-[#17324d]"
                          : "bg-[#f3f6f8]"
                      }`}
                    >
                      <div>
                        <p
                          className={`text-[12px] font-bold uppercase tracking-[0.1em] ${
                            index ===
                            0
                              ? "text-white/65"
                              : "text-[#7a8590]"
                          }`}
                        >
                          {index ===
                          0
                            ? "Sljedeći termin"
                            : "Termin"}
                        </p>

                        <p
                          className={`mt-1 text-[15px] font-semibold capitalize ${
                            index ===
                            0
                              ? "text-white"
                              : "text-[#17324d]"
                          }`}
                        >
                          {formatDatum(
                            predavanje.datum
                          )}
                        </p>
                      </div>

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          index ===
                          0
                            ? "bg-white/10 text-white"
                            : "bg-white text-[#17324d]"
                        }`}
                      >
                        <CalendarDays
                          size={20}
                        />
                      </div>
                    </div>

                    <div className="p-5">
                      <h2 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-[#17202a] sm:text-[24px]">
                        {
                          predavanje.naziv
                        }
                      </h2>

                      <p className="mt-2 text-[14px] font-bold text-[#c9252d]">
                        {
                          predavanje.skupina_naziv
                        }
                      </p>

                      <div className="mt-5 divide-y divide-[#edf0f2]">
                        <div className="flex items-center gap-4 py-4 first:pt-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                            <Clock3
                              size={20}
                            />
                          </div>

                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                              Vrijeme
                            </p>

                            <p className="mt-0.5 text-[16px] font-semibold text-[#28333e]">
                              {predavanje.vrijeme_pocetka.slice(
                                0,
                                5
                              )}
                              {
                                " – "
                              }
                              {predavanje.vrijeme_zavrsetka.slice(
                                0,
                                5
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 py-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                            <Users
                              size={20}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                              Obrazovna skupina
                            </p>

                            <p className="mt-0.5 text-[16px] font-semibold text-[#28333e]">
                              {
                                predavanje.skupina_naziv
                              }
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 py-4 pb-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                            <MapPin
                              size={20}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                              Lokacija
                            </p>

                            <p className="mt-0.5 text-[16px] font-semibold text-[#28333e]">
                              {predavanje.ucionica_naziv ??
                                "Online / bez učionice"}
                            </p>

                            {predavanje.lokacija && (
                              <p className="mt-1 text-[14px] leading-5 text-[#66717d]">
                                {
                                  predavanje.lokacija
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {predavanje.napomena && (
                        <div className="mt-5 rounded-xl border border-[#e7ebee] bg-[#f7f9fa] px-4 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                            Napomena
                          </p>

                          <p className="mt-1 text-[15px] leading-6 text-[#4f5b66]">
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
                        className="mt-5 flex min-h-[54px] w-full items-center justify-between rounded-[16px] bg-[#17324d] px-4 text-white shadow-sm transition hover:bg-[#102437]"
                      >
                        <div className="flex items-center gap-3">
                          <Users
                            size={20}
                          />

                          <span className="text-[15px] font-bold">
                            Prikaži polaznike
                          </span>
                        </div>

                        <ChevronRight
                          size={20}
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