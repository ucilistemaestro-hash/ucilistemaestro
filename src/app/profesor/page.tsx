"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  Bell,
  CalendarDays,
  Clock3,
  LoaderCircle,
  MapPin,
  UserRound,
  Users,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import PushObavijesti from "@/components/PushObavijesti";
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

type Obavijest = {
  obavijest_id: string;
  naslov: string;
  poruka: string;
  link: string | null;
  datum_objave: string;
  cilj: string;
};

export default function ProfesorPage() {
  const router = useRouter();

  const [ime, setIme] =
    useState("");

  const [raspored, setRaspored] =
    useState<Predavanje[]>([]);

  const [obavijesti, setObavijesti] =
    useState<Obavijest[]>([]);

  const [ucitavanje, setUcitavanje] =
    useState(true);

  const [greska, setGreska] =
    useState("");

  useEffect(() => {
    void ucitajProfesora();
  }, []);

  async function ucitajProfesora() {
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
        "ime_prezime, uloga, aktivan"
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

    setIme(
      profil.ime_prezime ||
        "Profesor"
    );

    const [
      rasporedRezultat,
      obavijestiRezultat,
    ] = await Promise.all([
      supabase.rpc(
        "moj_profesorski_raspored"
      ),
      supabase.rpc(
        "moje_obavijesti"
      ),
    ]);

    if (
      rasporedRezultat.error
    ) {
      setGreska(
        "Nije moguće učitati raspored."
      );
    } else {
      setRaspored(
        rasporedRezultat.data ??
          []
      );
    }

    if (
      obavijestiRezultat.error
    ) {
      setGreska(
        "Nije moguće učitati obavijesti."
      );
    } else {
      setObavijesti(
        obavijestiRezultat.data ??
          []
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

  const sada =
    new Date();

  const buducaPredavanja =
    raspored.filter(
      (predavanje) =>
        krajPredavanja(
          predavanje
        ) >= sada
    );

  const sljedece =
    buducaPredavanja[0];

  const najnovijeObavijesti =
    obavijesti.slice(
      0,
      2
    );

  if (
    ucitavanje
  ) {
    return (
      <main className="flex min-h-[100dvh] w-full items-center justify-center bg-[#f4f6f8] px-4">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle
            size={30}
            className="animate-spin text-[#c9252d]"
          />

          <p className="text-[15px] font-semibold text-[#66717d]">
            Učitavanje...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden bg-[#f4f6f8] pb-28">
      <header className="sticky top-0 z-20 w-full border-b border-[#e2e7ec] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[640px] items-center justify-between px-4 py-4 md:px-5">
          <div>
            <p className="text-[19px] font-extrabold tracking-[-0.02em] text-[#17324d]">
              UČILIŠTE MAESTRO
            </p>

            <p className="mt-0.5 text-[13px] font-medium text-[#7a8590]">
              Portal za profesore
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/profesor/profil"
              )
            }
            aria-label="Otvori profil"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e2e7ec] bg-[#f7f9fa] text-[#17324d] transition hover:bg-[#eef2f5]"
          >
            <UserRound
              size={21}
            />
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[640px] px-4 py-6 md:px-5">
        <section>
          <p className="text-[15px] font-medium text-[#66717d]">
            Dobro došli
          </p>

          <h1 className="mt-1 text-[30px] font-extrabold leading-[1.15] tracking-[-0.025em] text-[#17202a] sm:text-[34px]">
            {ime}
          </h1>

          <p className="mt-2 max-w-[520px] text-[16px] leading-6 text-[#66717d]">
            Ovdje možete pratiti svoj raspored,
            obrazovne skupine i važne obavijesti
            vezane uz nastavu.
          </p>
        </section>

        <div className="mt-6">
          <PushObavijesti />
        </div>

        {greska && (
          <div className="mt-5 rounded-2xl border border-[#f2c7ca] bg-[#fff5f5] px-4 py-3 text-[15px] leading-6 text-[#a71d24]">
            {greska}
          </div>
        )}

        {sljedece ? (
          <section className="mt-6 overflow-hidden rounded-[24px] border border-[#dde4ea] bg-white shadow-[0_10px_30px_rgba(16,36,55,0.06)]">
            <div className="flex items-center justify-between gap-4 bg-[#17324d] px-5 py-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/65">
                  Sljedeće predavanje
                </p>

                <p className="mt-1 text-[15px] font-semibold capitalize text-white">
                  {formatDatum(
                    sljedece.datum
                  )}
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <CalendarDays
                  size={23}
                  className="text-white"
                />
              </div>
            </div>

            <div className="p-5">
              <h2 className="text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-[#17202a] sm:text-[27px]">
                {sljedece.naziv}
              </h2>

              <p className="mt-2 text-[15px] font-bold text-[#c9252d]">
                {
                  sljedece.skupina_naziv
                }
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                    <Clock3
                      size={20}
                    />
                  </div>

                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8b949e]">
                      Vrijeme
                    </p>

                    <p className="mt-0.5 text-[17px] font-semibold text-[#28333e]">
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
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                    <Users
                      size={20}
                    />
                  </div>

                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8b949e]">
                      Obrazovna skupina
                    </p>

                    <p className="mt-0.5 text-[17px] font-semibold text-[#28333e]">
                      {
                        sljedece.skupina_naziv
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                    <MapPin
                      size={20}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8b949e]">
                      Lokacija
                    </p>

                    <p className="mt-0.5 text-[17px] font-semibold text-[#28333e]">
                      {sljedece.ucionica_naziv ??
                        "Online / bez učionice"}
                    </p>

                    {sljedece.lokacija && (
                      <p className="mt-1 text-[15px] leading-6 text-[#66717d]">
                        {
                          sljedece.lokacija
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {sljedece.napomena && (
                <div className="mt-5 rounded-xl border border-[#e8ecef] bg-[#f8f9fa] px-4 py-3">
                  <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8b949e]">
                    Napomena
                  </p>

                  <p className="mt-1 text-[15px] leading-6 text-[#4f5b66]">
                    {
                      sljedece.napomena
                    }
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="mt-6 rounded-[22px] border border-[#dfe5ea] bg-white p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
              <CalendarDays
                size={22}
              />
            </div>

            <h2 className="mt-4 text-[20px] font-bold text-[#17202a]">
              Nema nadolazećih predavanja
            </h2>

            <p className="mt-2 text-[15px] leading-6 text-[#66717d]">
              Novi termini pojavit će se ovdje kada vam
              budu dodijeljeni.
            </p>
          </section>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/profesor/raspored"
              )
            }
            className="rounded-[20px] border border-[#dfe5ea] bg-white p-4 text-left shadow-[0_5px_18px_rgba(23,50,77,0.035)] transition hover:border-[#cbd4dc]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
              <CalendarDays
                size={21}
              />
            </div>

            <div className="mt-4 text-[29px] font-extrabold leading-none text-[#17202a]">
              {
                buducaPredavanja.length
              }
            </div>

            <p className="mt-2 text-[14px] font-semibold leading-5 text-[#66717d]">
              Nadolazećih termina
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/profesor/obavijesti"
              )
            }
            className="rounded-[20px] border border-[#dfe5ea] bg-white p-4 text-left shadow-[0_5px_18px_rgba(23,50,77,0.035)] transition hover:border-[#cbd4dc]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
              <Bell
                size={21}
              />
            </div>

            <div className="mt-4 text-[29px] font-extrabold leading-none text-[#17202a]">
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
            router.push(
              "/profesor/raspored"
            )
          }
          className="mt-4 flex min-h-[62px] w-full items-center justify-between rounded-[18px] bg-[#17324d] px-5 text-left text-white shadow-sm transition hover:bg-[#102437]"
        >
          <div>
            <p className="text-[16px] font-bold">
              Pogledaj cijeli raspored
            </p>

            <p className="mt-0.5 text-[13px] text-white/65">
              Svi vaši termini nastave
            </p>
          </div>

          <ArrowRight
            size={22}
          />
        </button>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#c9252d]">
                Aktualno
              </p>

              <h2 className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#17202a]">
                Obavijesti
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/profesor/obavijesti"
                )
              }
              className="flex min-h-10 shrink-0 items-center gap-1 text-[14px] font-bold text-[#17324d]"
            >
              Prikaži sve

              <ArrowRight
                size={18}
              />
            </button>
          </div>

          {najnovijeObavijesti.length ===
          0 ? (
            <div className="mt-4 rounded-[20px] border border-[#dfe5ea] bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                <Bell
                  size={20}
                />
              </div>

              <p className="mt-3 text-[15px] leading-6 text-[#66717d]">
                Trenutačno nema novih obavijesti.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-[22px] border border-[#dfe5ea] bg-white">
              {najnovijeObavijesti.map(
                (
                  obavijest,
                  index
                ) => (
                  <article
                    key={
                      obavijest.obavijest_id
                    }
                    className={`flex gap-4 p-5 ${
                      index !==
                      najnovijeObavijesti.length -
                        1
                        ? "border-b border-[#e8ecef]"
                        : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                      <Bell
                        size={20}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-[17px] font-bold leading-6 text-[#17202a]">
                        {
                          obavijest.naslov
                        }
                      </h3>

                      <p className="mt-1.5 text-[15px] leading-6 text-[#5e6974]">
                        {
                          obavijest.poruka
                        }
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

      <ProfesorNav />
    </main>
  );
}