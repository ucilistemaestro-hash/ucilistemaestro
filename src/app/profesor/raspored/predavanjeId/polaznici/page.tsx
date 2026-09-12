"use client";

import { useEffect, useState } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
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
    useState<Predavanje | null>(null);

  const [ucitavanje, setUcitavanje] =
    useState(true);

  const [greska, setGreska] =
    useState("");

  useEffect(() => {
    ucitajPodatke();
  }, [predavanjeId]);

  async function ucitajPodatke() {
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
        (red: Predavanje) =>
          red.predavanje_id ===
          predavanjeId
      );

    if (!trazenoPredavanje) {
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
      <header className="w-full border-b border-[#e2e7ec] bg-white">
        <div className="w-full px-4 py-5 md:mx-auto md:max-w-[640px] md:px-5">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/profesor/raspored"
              )
            }
            className="flex min-h-[44px] items-center gap-2 text-[16px] font-bold text-[#17324d]"
          >
            <ArrowLeft size={21} />
            Raspored
          </button>

          <p className="mt-4 text-[13px] font-bold uppercase tracking-[0.09em] text-[#c9252d]">
            Učilište Maestro
          </p>

          <h1 className="mt-1 text-[31px] font-extrabold tracking-[-0.025em] text-[#17202a]">
            Polaznici
          </h1>

          <p className="mt-2 text-[17px] leading-6 text-[#66717d]">
            Popis polaznika obrazovne skupine.
          </p>
        </div>
      </header>

      <div className="w-full px-4 py-6 md:mx-auto md:max-w-[640px] md:px-5">
        {ucitavanje ? (
          <section className="rounded-[22px] border border-[#dfe5ea] bg-white p-6">
            <p className="text-[17px] font-medium text-[#66717d]">
              Učitavanje polaznika...
            </p>
          </section>
        ) : greska ? (
          <section className="rounded-[22px] border border-red-200 bg-red-50 p-5">
            <p className="text-[17px] leading-7 text-red-700">
              {greska}
            </p>
          </section>
        ) : (
          <>
            {predavanje && (
              <section className="overflow-hidden rounded-[24px] border border-[#dfe5ea] bg-white shadow-[0_6px_20px_rgba(23,50,77,0.05)]">
                <div className="bg-[#17324d] px-5 py-5">
                  <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-white/65">
                    Predavanje
                  </p>

                  <h2 className="mt-1 text-[24px] font-extrabold leading-tight text-white">
                    {predavanje.naziv}
                  </h2>

                  <p className="mt-2 text-[16px] font-semibold text-white/75">
                    {
                      predavanje.skupina_naziv
                    }
                  </p>
                </div>

                <div className="px-5 py-4">
                  <p className="text-[16px] font-semibold capitalize text-[#28333e]">
                    {formatDatum(
                      predavanje.datum
                    )}
                  </p>

                  <p className="mt-1 text-[16px] text-[#66717d]">
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
              </section>
            )}

            <section className="mt-6 flex items-center justify-between rounded-[20px] border border-[#dfe5ea] bg-white px-5 py-4">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-wide text-[#8b949e]">
                  Obrazovna skupina
                </p>

                <p className="mt-1 text-[21px] font-bold text-[#17202a]">
                  {polaznici.length}{" "}
                  {polaznici.length === 1
                    ? "polaznik"
                    : "polaznika"}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3f7] text-[#17324d]">
                <Users size={24} />
              </div>
            </section>

            {polaznici.length ===
            0 ? (
              <section className="mt-4 rounded-[24px] border border-[#dfe5ea] bg-white p-6">
                <h2 className="text-[21px] font-bold text-[#17202a]">
                  Nema aktivnih polaznika
                </h2>

                <p className="mt-2 text-[16px] leading-7 text-[#66717d]">
                  U ovoj obrazovnoj skupini trenutačno nema aktivnih polaznika.
                </p>
              </section>
            ) : (
              <div className="mt-4 overflow-hidden rounded-[24px] border border-[#dfe5ea] bg-white shadow-[0_6px_20px_rgba(23,50,77,0.05)]">
                {polaznici.map(
                  (
                    polaznik,
                    index
                  ) => (
                    <article
                      key={
                        polaznik.polaznik_id
                      }
                      className={`p-5 ${
                        index !==
                        polaznici.length -
                          1
                          ? "border-b border-[#e8ecef]"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef3f7] text-[#17324d]">
                          <UserRound
                            size={22}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="text-[19px] font-bold leading-6 text-[#17202a]">
                            {polaznik.ime_prezime ||
                              "Polaznik"}
                          </h2>

                          {polaznik.email && (
                            <a
                              href={`mailto:${polaznik.email}`}
                              className="mt-3 flex items-start gap-2 text-[16px] leading-6 text-[#52606d]"
                            >
                              <Mail
                                size={18}
                                className="mt-1 shrink-0 text-[#17324d]"
                              />

                              <span className="break-all">
                                {
                                  polaznik.email
                                }
                              </span>
                            </a>
                          )}

                          {polaznik.telefon && (
                            <a
                              href={`tel:${polaznik.telefon}`}
                              className="mt-2 flex items-center gap-2 text-[16px] text-[#52606d]"
                            >
                              <Phone
                                size={18}
                                className="shrink-0 text-[#17324d]"
                              />

                              <span>
                                {
                                  polaznik.telefon
                                }
                              </span>
                            </a>
                          )}
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