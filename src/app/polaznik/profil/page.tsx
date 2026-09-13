"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Bell,
  CalendarDays,
  GraduationCap,
  LoaderCircle,
  LogOut,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import PolaznikNav from "@/components/PolaznikNav";
import PushObavijesti from "@/components/PushObavijesti";

type Profil = {
  ime_prezime: string | null;
  email: string | null;
  telefon: string | null;
};

type Obrazovanje = {
  skupina_id: string;
  skupina_naziv: string;
  program_naziv: string;
  datum_pocetka: string | null;
};

export default function ProfilPage() {
  const router = useRouter();

  const [profil, setProfil] =
    useState<Profil | null>(
      null
    );

  const [
    obrazovanja,
    setObrazovanja,
  ] = useState<Obrazovanje[]>(
    []
  );

  const [
    ucitavanje,
    setUcitavanje,
  ] = useState(true);

  const [
    odjavaUTijeku,
    setOdjavaUTijeku,
  ] = useState(false);

  const [greska, setGreska] =
    useState("");

  useEffect(() => {
    void ucitajProfil();
  }, []);

  async function ucitajProfil() {
    setUcitavanje(true);
    setGreska("");

    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.replace(
          "/login"
        );
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("profili")
        .select(
          "ime_prezime, email, telefon, uloga, aktivan"
        )
        .eq(
          "id",
          user.id
        )
        .single();

      if (
        error ||
        !data ||
        data.uloga !==
          "polaznik" ||
        data.aktivan !==
          true
      ) {
        router.replace(
          "/login"
        );
        return;
      }

      setProfil({
        ime_prezime:
          data.ime_prezime,

        email:
          data.email ||
          user.email ||
          null,

        telefon:
          data.telefon,
      });

      const {
        data:
          obrazovanjaData,
        error:
          obrazovanjaError,
      } = await supabase.rpc(
        "moje_obrazovanje"
      );

      if (
        obrazovanjaError
      ) {
        console.error(
          "Greška učitavanja obrazovanja:",
          obrazovanjaError
        );

        setGreska(
          "Profil je učitan, ali podatke o obrazovanju trenutačno nije moguće prikazati."
        );

        setObrazovanja([]);
        return;
      }

      setObrazovanja(
        (
          obrazovanjaData ??
          []
        ) as Obrazovanje[]
      );
    } catch (
      error
    ) {
      console.error(
        "Greška učitavanja profila:",
        error
      );

      setGreska(
        "Nije moguće učitati profil."
      );
    } finally {
      setUcitavanje(
        false
      );
    }
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

  async function odjava() {
    if (
      odjavaUTijeku
    ) {
      return;
    }

    setOdjavaUTijeku(true);

    try {
      await supabase.auth.signOut();

      router.replace(
        "/login"
      );
    } catch (
      error
    ) {
      console.error(
        "Greška odjave:",
        error
      );

      setGreska(
        "Odjava trenutačno nije moguća. Pokušajte ponovno."
      );

      setOdjavaUTijeku(
        false
      );
    }
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
              Moj profil
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[640px] px-4 py-6 md:px-5">
        <section>
          <h2 className="text-[28px] font-extrabold tracking-[-0.025em] text-[#17202a]">
            Korisnički podaci
          </h2>

          <p className="mt-2 text-[15px] leading-6 text-[#66717d]">
            Pregled vaših osobnih podataka i
            postavki obavijesti.
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
                Učitavanje profila...
              </p>
            </div>
          </div>
        ) : greska &&
          !profil ? (
          <div className="mt-6 rounded-[20px] border border-[#f2c7ca] bg-[#fff5f5] px-4 py-4 text-[15px] leading-6 text-[#a71d24]">
            {greska}
          </div>
        ) : profil ? (
          <>
            <section className="mt-6 overflow-hidden rounded-[24px] border border-[#dfe5ea] bg-white shadow-[0_8px_24px_rgba(23,50,77,0.05)]">
              <div className="bg-[#17324d] px-5 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <UserRound
                      size={27}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/60">
                      Polaznik
                    </p>

                    <h2 className="mt-1 break-words text-[23px] font-extrabold leading-tight text-white">
                      {profil.ime_prezime ||
                        "Polaznik"}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[#e8ecef]">
                <div className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                    <Mail
                      size={20}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                      E-mail adresa
                    </p>

                    {profil.email ? (
                      <a
                        href={`mailto:${profil.email}`}
                        className="mt-1 block break-all text-[16px] font-semibold leading-6 text-[#28333e] transition hover:text-[#c9252d]"
                      >
                        {
                          profil.email
                        }
                      </a>
                    ) : (
                      <p className="mt-1 text-[16px] font-semibold text-[#66717d]">
                        Nije upisan
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                    <Phone
                      size={20}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                      Telefon
                    </p>

                    {profil.telefon ? (
                      <a
                        href={`tel:${profil.telefon}`}
                        className="mt-1 block text-[16px] font-semibold leading-6 text-[#28333e] transition hover:text-[#c9252d]"
                      >
                        {
                          profil.telefon
                        }
                      </a>
                    ) : (
                      <p className="mt-1 text-[16px] font-semibold text-[#66717d]">
                        Nije upisan
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-7">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <GraduationCap
                    size={19}
                  />
                </div>

                <div>
                  <h2 className="text-[18px] font-bold text-[#17202a]">
                    Moje obrazovanje
                  </h2>

                  <p className="mt-0.5 text-[13px] text-[#7a8590]">
                    Program koji trenutačno pohađate
                  </p>
                </div>
              </div>

              {obrazovanja.length >
              0 ? (
                <div className="space-y-3">
                  {obrazovanja.map(
                    (
                      obrazovanje
                    ) => (
                      <div
                        key={
                          obrazovanje.skupina_id
                        }
                        className="overflow-hidden rounded-[20px] border border-[#dfe5ea] bg-white shadow-[0_5px_18px_rgba(23,50,77,0.035)]"
                      >
                        <div className="p-5">
                          <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                            Obrazovni program
                          </p>

                          <p className="mt-1 text-[17px] font-extrabold leading-6 text-[#17202a]">
                            {
                              obrazovanje.program_naziv
                            }
                          </p>

                          <p className="mt-1 text-[13px] leading-5 text-[#7a8590]">
                            Skupina:{" "}
                            {
                              obrazovanje.skupina_naziv
                            }
                          </p>
                        </div>

                        <div className="flex items-start gap-3 border-t border-[#e8ecef] bg-[#f8fafb] px-5 py-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#17324d] shadow-sm">
                            <CalendarDays
                              size={18}
                            />
                          </div>

                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                              Datum početka obrazovanja
                            </p>

                            <p className="mt-1 text-[15px] font-semibold text-[#28333e]">
                              {obrazovanje.datum_pocetka
                                ? formatDatum(
                                    obrazovanje.datum_pocetka
                                  )
                                : "Nije upisan"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="rounded-[20px] border border-[#dfe5ea] bg-white px-5 py-5 text-[14px] leading-6 text-[#66717d]">
                  Trenutačno nema evidentiranog aktivnog obrazovnog programa.
                </div>
              )}
            </section>

            {greska && (
              <div className="mt-5 rounded-[20px] border border-[#f2c7ca] bg-[#fff5f5] px-4 py-4 text-[15px] leading-6 text-[#a71d24]">
                {greska}
              </div>
            )}

            <section className="mt-7">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <Bell
                    size={18}
                  />
                </div>

                <div>
                  <h2 className="text-[18px] font-bold text-[#17202a]">
                    Push obavijesti
                  </h2>

                  <p className="mt-0.5 text-[13px] text-[#7a8590]">
                    Obavijesti na ovom uređaju
                  </p>
                </div>
              </div>

              <PushObavijesti />

              <p className="mt-3 px-1 text-[13px] leading-5 text-[#7b858f]">
                Push obavijesti koristimo za promjene
                rasporeda i važne informacije vezane uz
                vaše obrazovanje.
              </p>
            </section>

            <section className="mt-8 border-t border-[#e2e7ec] pt-6">
              <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                Korisnički račun
              </p>

              <button
                type="button"
                onClick={() =>
                  void odjava()
                }
                disabled={
                  odjavaUTijeku
                }
                className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[16px] border border-[#e5b9bc] bg-white px-5 text-[15px] font-bold text-[#b52027] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {odjavaUTijeku ? (
                  <LoaderCircle
                    size={20}
                    className="animate-spin"
                  />
                ) : (
                  <LogOut
                    size={20}
                  />
                )}

                {odjavaUTijeku
                  ? "Odjava..."
                  : "Odjavi se"}
              </button>
            </section>

            <p className="mt-7 text-center text-[12px] leading-5 text-[#929ba4]">
              Učilište Maestro
              <br />
              Aplikacija za polaznike
            </p>
          </>
        ) : null}
      </div>

      <PolaznikNav />
    </main>
  );
}