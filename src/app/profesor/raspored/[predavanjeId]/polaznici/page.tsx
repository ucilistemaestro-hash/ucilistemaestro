"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  LoaderCircle,
  Mail,
  Phone,
  UserRound,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProfesorNav from "@/components/ProfesorNav";

type Polaznik = {
  polaznik_id: string;
  ime_prezime: string | null;
  email: string | null;
  telefon: string | null;
};

type Predavanje = {
  predavanje_id: string;
  naziv: string;
  datum: string;
  vrijeme_pocetka: string;
  vrijeme_zavrsetka: string;
  skupina_naziv: string;
};

export default function PolazniciPredavanjaPage() {
  const router = useRouter();

  const params =
    useParams<{
      predavanjeId: string;
    }>();

  const predavanjeId =
    params.predavanjeId;

  const [polaznici, setPolaznici] =
    useState<Polaznik[]>([]);

  const [predavanje, setPredavanje] =
    useState<Predavanje | null>(
      null
    );

  const [ucitavanje, setUcitavanje] =
    useState(true);

  const [greska, setGreska] =
    useState("");

  useEffect(() => {
    void ucitajPodatke();
  }, [predavanjeId]);

  async function ucitajPodatke() {
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

    const [
      rasporedRezultat,
      polazniciRezultat,
    ] = await Promise.all([
      supabase.rpc(
        "moj_profesorski_raspored"
      ),

      supabase.rpc(
        "profesor_polaznici_predavanja",
        {
          p_predavanje_id:
            predavanjeId,
        }
      ),
    ]);

    if (
      rasporedRezultat.error
    ) {
      setGreska(
        "Nije moguće učitati podatke o predavanju."
      );

      setUcitavanje(false);
      return;
    }

    if (
      polazniciRezultat.error
    ) {
      setGreska(
        "Nije moguće učitati popis polaznika."
      );

      setUcitavanje(false);
      return;
    }

    const trazenoPredavanje =
      (
        rasporedRezultat.data ??
        []
      ).find(
        (
          red: Predavanje
        ) =>
          red.predavanje_id ===
          predavanjeId
      );

    if (
      !trazenoPredavanje
    ) {
      setGreska(
        "Predavanje nije pronađeno ili nemate pravo pristupa."
      );

      setUcitavanje(false);
      return;
    }

    setPredavanje(
      trazenoPredavanje
    );

    setPolaznici(
      polazniciRezultat.data ??
        []
    );

    setUcitavanje(false);
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

  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden bg-[#f4f6f8] pb-28">
      <header className="sticky top-0 z-20 w-full border-b border-[#e2e7ec] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[640px] items-center gap-3 px-4 py-4 md:px-5">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/profesor/raspored"
              )
            }
            aria-label="Povratak na raspored"
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
              Polaznici
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[640px] px-4 py-6 md:px-5">
        <section>
          <h2 className="text-[28px] font-extrabold tracking-[-0.025em] text-[#17202a]">
            Popis polaznika
          </h2>

          <p className="mt-2 text-[15px] leading-6 text-[#66717d]">
            Pregled aktivnih polaznika obrazovne
            skupine za odabrani termin.
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
                Učitavanje polaznika...
              </p>
            </div>
          </div>
        ) : greska ? (
          <section className="mt-6 rounded-[20px] border border-[#f2c7ca] bg-[#fff5f5] px-4 py-4">
            <p className="text-[15px] leading-6 text-[#a71d24]">
              {greska}
            </p>
          </section>
        ) : (
          <>
            {predavanje && (
              <section className="mt-6 overflow-hidden rounded-[24px] border border-[#dfe5ea] bg-white shadow-[0_8px_24px_rgba(23,50,77,0.05)]">
                <div className="bg-[#17324d] px-5 py-5">
                  <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/60">
                    Predavanje
                  </p>

                  <h2 className="mt-1 text-[23px] font-extrabold leading-tight text-white">
                    {
                      predavanje.naziv
                    }
                  </h2>

                  <p className="mt-2 text-[14px] font-semibold text-white/70">
                    {
                      predavanje.skupina_naziv
                    }
                  </p>
                </div>

                <div className="divide-y divide-[#edf0f2] px-5">
                  <div className="flex items-center gap-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                      <CalendarDays
                        size={20}
                      />
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                        Datum
                      </p>

                      <p className="mt-0.5 text-[16px] font-semibold capitalize text-[#28333e]">
                        {formatDatum(
                          predavanje.datum
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 py-4">
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
                        {" – "}
                        {predavanje.vrijeme_zavrsetka.slice(
                          0,
                          5
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="mt-5 flex items-center justify-between rounded-[20px] border border-[#dfe5ea] bg-white px-5 py-4 shadow-[0_4px_16px_rgba(23,50,77,0.03)]">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                  Obrazovna skupina
                </p>

                <p className="mt-1 text-[20px] font-bold text-[#17202a]">
                  {
                    polaznici.length
                  }{" "}
                  {polaznici.length ===
                  1
                    ? "polaznik"
                    : "polaznika"}
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                <Users
                  size={22}
                />
              </div>
            </section>

            {polaznici.length ===
            0 ? (
              <section className="mt-4 rounded-[24px] border border-[#dfe5ea] bg-white p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <Users
                    size={22}
                  />
                </div>

                <h2 className="mt-4 text-[20px] font-bold text-[#17202a]">
                  Nema aktivnih polaznika
                </h2>

                <p className="mt-2 text-[15px] leading-6 text-[#66717d]">
                  U ovoj obrazovnoj skupini trenutačno
                  nema aktivnih polaznika.
                </p>
              </section>
            ) : (
              <div className="mt-4 space-y-3">
                {polaznici.map(
                  (
                    polaznik,
                    index
                  ) => (
                    <article
                      key={
                        polaznik.polaznik_id
                      }
                      className="rounded-[20px] border border-[#dfe5ea] bg-white p-5 shadow-[0_4px_16px_rgba(23,50,77,0.035)]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef3f7] text-[#17324d]">
                          <UserRound
                            size={21}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                                Polaznik{" "}
                                {index +
                                  1}
                              </p>

                              <h2 className="mt-1 text-[17px] font-bold leading-6 text-[#17202a]">
                                {polaznik.ime_prezime ||
                                  "Polaznik"}
                              </h2>
                            </div>
                          </div>

                          <div className="mt-4 space-y-2.5">
                            {polaznik.email ? (
                              <a
                                href={`mailto:${polaznik.email}`}
                                className="flex items-start gap-2.5 text-[14px] leading-5 text-[#52606d] transition hover:text-[#c9252d]"
                              >
                                <Mail
                                  size={17}
                                  className="mt-0.5 shrink-0 text-[#17324d]"
                                />

                                <span className="break-all">
                                  {
                                    polaznik.email
                                  }
                                </span>
                              </a>
                            ) : (
                              <div className="flex items-center gap-2.5 text-[14px] text-[#929ba4]">
                                <Mail
                                  size={17}
                                  className="shrink-0"
                                />

                                <span>
                                  E-mail nije upisan
                                </span>
                              </div>
                            )}

                            {polaznik.telefon ? (
                              <a
                                href={`tel:${polaznik.telefon}`}
                                className="flex items-center gap-2.5 text-[14px] text-[#52606d] transition hover:text-[#c9252d]"
                              >
                                <Phone
                                  size={17}
                                  className="shrink-0 text-[#17324d]"
                                />

                                <span>
                                  {
                                    polaznik.telefon
                                  }
                                </span>
                              </a>
                            ) : (
                              <div className="flex items-center gap-2.5 text-[14px] text-[#929ba4]">
                                <Phone
                                  size={17}
                                  className="shrink-0"
                                />

                                <span>
                                  Telefon nije upisan
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>

      <ProfesorNav />
    </main>
  );
}