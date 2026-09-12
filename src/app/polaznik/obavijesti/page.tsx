"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Bell,
  ExternalLink,
  Info,
  LoaderCircle,
} from "lucide-react";

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

const PRODUKCIJSKA_DOMENA =
  "app.uciliste-maestro.hr";

export default function ObavijestiPage() {
  const router = useRouter();

  const [obavijesti, setObavijesti] =
    useState<Obavijest[]>([]);

  const [ucitavanje, setUcitavanje] =
    useState(true);

  const [greska, setGreska] =
    useState("");

  useEffect(() => {
    void ucitajObavijesti();
  }, []);

  async function ucitajObavijesti() {
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
        "polaznik" ||
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
      "moje_obavijesti"
    );

    if (error) {
      setGreska(
        "Nije moguće učitati obavijesti."
      );
    } else {
      setObavijesti(
        data ?? []
      );
    }

    setUcitavanje(false);
  }

  function formatDatum(
    datum: string
  ) {
    return new Date(
      datum
    ).toLocaleDateString(
      "hr-HR",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  function formatVrijeme(
    datum: string
  ) {
    return new Date(
      datum
    ).toLocaleTimeString(
      "hr-HR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function dohvatiInternuPutanju(
    link: string
  ): string | null {
    if (
      link.startsWith("/")
    ) {
      return link;
    }

    try {
      const url =
        new URL(link);

      if (
        url.hostname ===
        PRODUKCIJSKA_DOMENA
      ) {
        return (
          url.pathname +
          url.search +
          url.hash
        );
      }

      return null;
    } catch {
      return null;
    }
  }

  function jeInternaPoveznica(
    link: string
  ) {
    return (
      dohvatiInternuPutanju(
        link
      ) !== null
    );
  }

  function otvoriPoveznicu(
    link: string
  ) {
    const internaPutanja =
      dohvatiInternuPutanju(
        link
      );

    if (
      internaPutanja
    ) {
      router.push(
        internaPutanja
      );
      return;
    }

    window.open(
      link,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden bg-[#f4f6f8] pb-28">
      <header className="sticky top-0 z-20 w-full border-b border-[#e2e7ec] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[640px] items-center gap-3 px-4 py-4 md:px-5">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/polaznik"
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
              Obavijesti
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[640px] px-4 py-6 md:px-5">
        <section>
          <h2 className="text-[28px] font-extrabold tracking-[-0.025em] text-[#17202a]">
            Važne informacije
          </h2>

          <p className="mt-2 text-[15px] leading-6 text-[#66717d]">
            Ovdje se nalaze obavijesti Učilišta,
            promjene rasporeda i druge važne
            informacije.
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
                Učitavanje obavijesti...
              </p>
            </div>
          </div>
        ) : greska ? (
          <div className="mt-6 rounded-[20px] border border-[#f2c7ca] bg-[#fff5f5] px-4 py-4 text-[15px] leading-6 text-[#a71d24]">
            {greska}
          </div>
        ) : obavijesti.length ===
          0 ? (
          <section className="mt-6 rounded-[24px] border border-[#dfe5ea] bg-white p-5 shadow-[0_6px_20px_rgba(23,50,77,0.04)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
              <Bell
                size={22}
              />
            </div>

            <h2 className="mt-4 text-[20px] font-bold text-[#17202a]">
              Nema novih obavijesti
            </h2>

            <p className="mt-2 text-[15px] leading-6 text-[#66717d]">
              Nove informacije Učilišta bit će
              prikazane ovdje.
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
                    obavijesti.length
                  }{" "}
                  {obavijesti.length ===
                  1
                    ? "obavijest"
                    : "obavijesti"}
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                <Bell
                  size={22}
                />
              </div>
            </section>

            <div className="mt-5 space-y-4">
              {obavijesti.map(
                (
                  obavijest,
                  index
                ) => (
                  <article
                    key={
                      obavijest.obavijest_id
                    }
                    className="overflow-hidden rounded-[22px] border border-[#dfe5ea] bg-white shadow-[0_6px_20px_rgba(23,50,77,0.04)]"
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            index ===
                            0
                              ? "bg-[#17324d] text-white"
                              : "bg-[#eef3f7] text-[#17324d]"
                          }`}
                        >
                          <Info
                            size={20}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1">
                            <h2 className="text-[18px] font-bold leading-6 text-[#17202a]">
                              {
                                obavijest.naslov
                              }
                            </h2>

                            <p className="text-[13px] font-medium text-[#929ba4]">
                              {formatDatum(
                                obavijest.datum_objave
                              )}
                              {
                                " · "
                              }
                              {formatVrijeme(
                                obavijest.datum_objave
                              )}
                            </p>
                          </div>

                          <p className="mt-3 whitespace-pre-line text-[15px] leading-6 text-[#4f5b66]">
                            {
                              obavijest.poruka
                            }
                          </p>

                          {obavijest.link && (
                            <button
                              type="button"
                              onClick={() =>
                                otvoriPoveznicu(
                                  obavijest.link as string
                                )
                              }
                              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#17324d] px-4 text-[14px] font-bold text-white transition hover:bg-[#102437]"
                            >
                              {jeInternaPoveznica(
                                obavijest.link
                              )
                                ? "Otvori u aplikaciji"
                                : "Otvori poveznicu"}

                              {jeInternaPoveznica(
                                obavijest.link
                              ) ? (
                                <ArrowRight
                                  size={17}
                                />
                              ) : (
                                <ExternalLink
                                  size={17}
                                />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          </>
        )}
      </div>

      <PolaznikNav />
    </main>
  );
}