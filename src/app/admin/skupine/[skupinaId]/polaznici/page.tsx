"use client";

import {
  useEffect,
  useState,
} from "react";

import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  LoaderCircle,
  Mail,
  Phone,
  School,
  UserRound,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Skupina = {
  id: string;
  naziv: string;
  sifra: string | null;
  program_id: string;
  status: string;
};

type Program = {
  id: string;
  naziv: string;
};

type Clanstvo = {
  korisnik_id: string;
  status: string;
};

type ProfilPolaznika = {
  id: string;
  ime_prezime: string | null;
  email: string | null;
  telefon: string | null;
  uloga: string;
  aktivan: boolean;
};

type PolaznikSkupine = {
  korisnik_id: string;
  ime_prezime: string | null;
  email: string | null;
  telefon: string | null;
  profil_aktivan: boolean;
  status_clanstva: string;
};

export default function PolazniciSkupinePage() {
  const router = useRouter();
  const params = useParams();

  const skupinaId =
    typeof params.skupinaId ===
    "string"
      ? params.skupinaId
      : "";

  const [
    skupina,
    setSkupina,
  ] = useState<Skupina | null>(
    null
  );

  const [
    program,
    setProgram,
  ] = useState<Program | null>(
    null
  );

  const [
    polaznici,
    setPolaznici,
  ] = useState<PolaznikSkupine[]>(
    []
  );

  const [
    ucitavanje,
    setUcitavanje,
  ] = useState(true);

  const [greska, setGreska] =
    useState("");

  useEffect(() => {
    if (!skupinaId) {
      setGreska(
        "Nije odabrana obrazovna skupina."
      );
      setUcitavanje(false);
      return;
    }

    void ucitajPodatke();
  }, [skupinaId]);

  async function ucitajPodatke() {
    setUcitavanje(true);
    setGreska("");

    try {
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
          "administrator" ||
        profil.aktivan !==
          true
      ) {
        router.replace("/login");
        return;
      }

      const {
        data: skupinaData,
        error: skupinaError,
      } = await supabase
        .from(
          "obrazovne_skupine"
        )
        .select(
          "id, naziv, sifra, program_id, status"
        )
        .eq(
          "id",
          skupinaId
        )
        .single();

      if (
        skupinaError ||
        !skupinaData
      ) {
        setGreska(
          "Obrazovna skupina nije pronađena."
        );
        return;
      }

      setSkupina(
        skupinaData
      );

      const [
        programRezultat,
        clanstvaRezultat,
      ] = await Promise.all([
        supabase
          .from(
            "obrazovni_programi"
          )
          .select(
            "id, naziv"
          )
          .eq(
            "id",
            skupinaData.program_id
          )
          .single(),

        supabase
          .from(
            "clanstva_skupina"
          )
          .select(
            "korisnik_id, status"
          )
          .eq(
            "skupina_id",
            skupinaId
          ),
      ]);

      if (
        programRezultat.error
      ) {
        console.error(
          "Greška učitavanja programa:",
          programRezultat.error
        );
      } else {
        setProgram(
          programRezultat.data
        );
      }

      if (
        clanstvaRezultat.error
      ) {
        setGreska(
          "Nije moguće učitati polaznike ove skupine."
        );
        return;
      }

      const clanstva =
        (
          clanstvaRezultat.data ??
          []
        ) as Clanstvo[];

      const korisnikIds = [
        ...new Set(
          clanstva.map(
            (clanstvo) =>
              clanstvo.korisnik_id
          )
        ),
      ];

      if (
        korisnikIds.length ===
        0
      ) {
        setPolaznici([]);
        return;
      }

      const {
        data:
          profiliData,
        error:
          profiliError,
      } = await supabase
        .from("profili")
        .select(
          "id, ime_prezime, email, telefon, uloga, aktivan"
        )
        .in(
          "id",
          korisnikIds
        );

      if (
        profiliError
      ) {
        setGreska(
          "Nije moguće učitati podatke polaznika."
        );
        return;
      }

      const profili =
        (
          profiliData ??
          []
        ) as ProfilPolaznika[];

      const profilPoId =
        new Map(
          profili.map(
            (profilPolaznika) => [
              profilPolaznika.id,
              profilPolaznika,
            ]
          )
        );

      const rezultat =
        clanstva
          .map(
            (clanstvo) => {
              const profilPolaznika =
                profilPoId.get(
                  clanstvo.korisnik_id
                );

              if (
                !profilPolaznika ||
                profilPolaznika.uloga !==
                  "polaznik"
              ) {
                return null;
              }

              return {
                korisnik_id:
                  clanstvo.korisnik_id,
                ime_prezime:
                  profilPolaznika.ime_prezime,
                email:
                  profilPolaznika.email,
                telefon:
                  profilPolaznika.telefon,
                profil_aktivan:
                  profilPolaznika.aktivan,
                status_clanstva:
                  clanstvo.status,
              } satisfies PolaznikSkupine;
            }
          )
          .filter(
            (
              polaznik
            ): polaznik is PolaznikSkupine =>
              polaznik !==
              null
          )
          .sort(
            (a, b) =>
              (
                a.ime_prezime ??
                a.email ??
                ""
              ).localeCompare(
                b.ime_prezime ??
                  b.email ??
                  "",
                "hr"
              )
          );

      setPolaznici(
        rezultat
      );
    } catch (error) {
      console.error(
        "Greška učitavanja polaznika skupine:",
        error
      );

      setGreska(
        "Došlo je do neočekivane greške pri učitavanju podataka."
      );
    } finally {
      setUcitavanje(false);
    }
  }

  function nazivStatusaClanstva(
    status: string
  ) {
    if (
      status === "active" ||
      status === "aktivan"
    ) {
      return "Aktivan";
    }

    if (
      status ===
        "completed" ||
      status ===
        "zavrsen" ||
      status ===
        "završen"
    ) {
      return "Završen";
    }

    if (
      status === "inactive" ||
      status === "neaktivan"
    ) {
      return "Neaktivan";
    }

    return status;
  }

  function statusKlasa(
    status: string
  ) {
    if (
      status === "active" ||
      status === "aktivan"
    ) {
      return "bg-[#edf7f0] text-[#277442]";
    }

    if (
      status ===
        "completed" ||
      status ===
        "zavrsen" ||
      status ===
        "završen"
    ) {
      return "bg-[#edf4fb] text-[#315f8c]";
    }

    return "bg-[#f0f2f4] text-[#69737c]";
  }

  return (
    <main className="min-h-[100dvh] bg-[#f4f6f8]">
      <header className="sticky top-0 z-20 border-b border-[#e2e7ec] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 md:px-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/skupine"
              )
            }
            aria-label="Povratak na obrazovne skupine"
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
              Polaznici skupine
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-7 md:px-8 md:py-9">
        {ucitavanje ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-[#dfe5ea] bg-white">
            <div className="flex flex-col items-center gap-3">
              <LoaderCircle
                size={30}
                className="animate-spin text-[#c9252d]"
              />

              <p className="text-[14px] font-semibold text-[#66717d]">
                Učitavanje polaznika...
              </p>
            </div>
          </div>
        ) : greska ? (
          <div className="rounded-[20px] border border-[#f2c7ca] bg-[#fff5f5] px-4 py-4 text-[14px] leading-6 text-[#a71d24]">
            {greska}
          </div>
        ) : skupina ? (
          <>
            <section className="overflow-hidden rounded-[24px] border border-[#dfe5ea] bg-white shadow-[0_6px_20px_rgba(23,50,77,0.04)]">
              <div className="bg-[#17324d] px-5 py-5 md:px-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <School
                      size={23}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/60">
                      Obrazovna skupina
                    </p>

                    <h2 className="mt-1 break-words text-[23px] font-extrabold leading-tight text-white">
                      {skupina.naziv}
                    </h2>

                    {program && (
                      <p className="mt-2 text-[14px] font-semibold leading-5 text-white/80">
                        {program.naziv}
                      </p>
                    )}

                    {skupina.sifra && (
                      <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.07em] text-white/55">
                        {skupina.sifra}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                    Evidentirani polaznici
                  </p>

                  <p className="mt-1 text-[22px] font-extrabold text-[#17202a]">
                    {polaznici.length}
                  </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <Users
                    size={21}
                  />
                </div>
              </div>
            </section>

            {polaznici.length ===
            0 ? (
              <section className="mt-5 rounded-[22px] border border-[#dfe5ea] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <Users
                    size={21}
                  />
                </div>

                <h3 className="mt-4 text-[19px] font-bold text-[#17202a]">
                  Nema evidentiranih polaznika
                </h3>

                <p className="mt-2 text-[14px] leading-6 text-[#66717d]">
                  U ovoj obrazovnoj skupini trenutačno nema polaznika.
                </p>
              </section>
            ) : (
              <section className="mt-5 space-y-3">
                {polaznici.map(
                  (
                    polaznik,
                    index
                  ) => (
                    <article
                      key={
                        polaznik.korisnik_id
                      }
                      className="rounded-[22px] border border-[#dfe5ea] bg-white p-5 shadow-[0_5px_18px_rgba(23,50,77,0.035)]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                          <UserRound
                            size={21}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="text-[17px] font-bold leading-6 text-[#17202a]">
                              {index + 1}.{" "}
                              {polaznik.ime_prezime ||
                                "Polaznik"}
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusKlasa(
                                polaznik.status_clanstva
                              )}`}
                            >
                              {nazivStatusaClanstva(
                                polaznik.status_clanstva
                              )}
                            </span>

                            {!polaznik.profil_aktivan && (
                              <span className="rounded-full bg-[#fff2f2] px-2.5 py-1 text-[11px] font-bold text-[#b52027]">
                                Profil neaktivan
                              </span>
                            )}
                          </div>

                          <div className="mt-3 space-y-2">
                            {polaznik.email ? (
                              <a
                                href={`mailto:${polaznik.email}`}
                                className="flex items-start gap-2 text-[14px] font-medium text-[#52606d] transition hover:text-[#c9252d]"
                              >
                                <Mail
                                  size={16}
                                  className="mt-0.5 shrink-0 text-[#8b949e]"
                                />

                                <span className="break-all">
                                  {polaznik.email}
                                </span>
                              </a>
                            ) : (
                              <div className="flex items-start gap-2 text-[14px] text-[#8b949e]">
                                <Mail
                                  size={16}
                                  className="mt-0.5 shrink-0"
                                />

                                E-mail nije upisan
                              </div>
                            )}

                            {polaznik.telefon ? (
                              <a
                                href={`tel:${polaznik.telefon}`}
                                className="flex items-start gap-2 text-[14px] font-medium text-[#52606d] transition hover:text-[#c9252d]"
                              >
                                <Phone
                                  size={16}
                                  className="mt-0.5 shrink-0 text-[#8b949e]"
                                />

                                <span>
                                  {polaznik.telefon}
                                </span>
                              </a>
                            ) : (
                              <div className="flex items-start gap-2 text-[14px] text-[#8b949e]">
                                <Phone
                                  size={16}
                                  className="mt-0.5 shrink-0"
                                />

                                Telefon nije upisan
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                )}
              </section>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
