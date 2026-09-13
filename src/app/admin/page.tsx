"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  DoorOpen,
  GraduationCap,
  LoaderCircle,
  LogOut,
  Mail,
  School,
  ShieldCheck,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type AdminProfil = {
  ime_prezime: string | null;
  email: string | null;
};

type PredavanjeDana = {
  id: string;
  skupina_id: string;
  profesor_id: string | null;
  ucionica_id: string | null;
  naziv: string;
  datum: string;
  vrijeme_pocetka: string;
  vrijeme_zavrsetka: string;
  status: string;
};

type Skupina = {
  id: string;
  naziv: string;
  status: string;
};

type Profesor = {
  id: string;
  ime_prezime: string | null;
  aktivan: boolean;
};

type Ucionica = {
  id: string;
  naziv: string;
  aktivna: boolean;
};


const moduli = [
  {
    naziv: "Obrazovni programi",
    opis:
      "Upravljanje programima obrazovanja.",
    putanja: "/admin/programi",
    Ikona: BookOpen,
  },
  {
    naziv: "Obrazovne skupine",
    opis:
      "Skupine, početak i završetak programa.",
    putanja: "/admin/skupine",
    Ikona: School,
  },
  {
    naziv: "Polaznici",
    opis:
      "Dodavanje i upravljanje polaznicima.",
    putanja: "/admin/polaznici",
    Ikona: Users,
  },
  {
    naziv: "Profesori",
    opis:
      "Profesori i korisnički pristup.",
    putanja: "/admin/profesori",
    Ikona: GraduationCap,
  },
  {
    naziv: "Administratori",
    opis:
      "Administratorski računi i pristup.",
    putanja: "/admin/administratori",
    Ikona: ShieldCheck,
  },
  {
    naziv: "Učionice",
    opis:
      "Učionice, lokacije i kapaciteti.",
    putanja: "/admin/ucionice",
    Ikona: DoorOpen,
  },
  {
    naziv: "Raspored",
    opis:
      "Termini nastave, profesori i skupine.",
    putanja: "/admin/raspored",
    Ikona: CalendarDays,
  },
  {
    naziv: "Obavijesti",
    opis:
      "Objava obavijesti i push poruka.",
    putanja: "/admin/obavijesti",
    Ikona: Bell,
  },
];

export default function AdminPage() {
  const router = useRouter();

  const [profil, setProfil] =
    useState<AdminProfil | null>(
      null
    );

  const [
    predavanjaDana,
    setPredavanjaDana,
  ] =
    useState<PredavanjeDana[]>(
      []
    );

  const [skupine, setSkupine] =
    useState<Skupina[]>([]);

  const [profesori, setProfesori] =
    useState<Profesor[]>([]);

  const [ucionice, setUcionice] =
    useState<Ucionica[]>([]);

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

  const [
    greskaPregleda,
    setGreskaPregleda,
  ] = useState("");

  const [sada, setSada] =
    useState(
      new Date()
    );

  useEffect(() => {
    void provjeriAdministratora();
  }, []);

  useEffect(() => {
    const interval =
      window.setInterval(
        () => {
          setSada(
            new Date()
          );
        },
        60_000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, []);

  function datumZaBazu(
    datumVrijednost: Date
  ) {
    const godina =
      datumVrijednost.getFullYear();

    const mjesec = String(
      datumVrijednost.getMonth() +
        1
    ).padStart(2, "0");

    const dan = String(
      datumVrijednost.getDate()
    ).padStart(2, "0");

    return `${godina}-${mjesec}-${dan}`;
  }

  function minuteVremena(
    vrijednost: string
  ) {
    const [
      sati,
      minute,
    ] = vrijednost
      .slice(0, 5)
      .split(":")
      .map(Number);

    return (
      sati * 60 +
      minute
    );
  }

  function formatVrijeme(
    vrijednost: string
  ) {
    return vrijednost.slice(
      0,
      5
    );
  }

  function formatDanas(
    datumVrijednost: Date
  ) {
    return datumVrijednost.toLocaleDateString(
      "hr-HR",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  function nazivSkupine(
    id: string
  ) {
    return (
      skupine.find(
        (skupina) =>
          skupina.id === id
      )?.naziv ??
      "Nepoznata skupina"
    );
  }

  function nazivProfesora(
    id: string | null
  ) {
    if (!id) {
      return "Profesor nije dodijeljen";
    }

    return (
      profesori.find(
        (profesor) =>
          profesor.id === id
      )?.ime_prezime ??
      "Nepoznat profesor"
    );
  }

  function nazivUcionice(
    id: string | null
  ) {
    if (!id) {
      return "Bez učionice";
    }

    return (
      ucionice.find(
        (ucionica) =>
          ucionica.id === id
      )?.naziv ??
      "Nepoznata učionica"
    );
  }

  async function provjeriAdministratora() {
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
        data,
        error,
      } = await supabase
        .from("profili")
        .select(
          "ime_prezime, email, uloga, aktivan"
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
          "administrator" ||
        data.aktivan !==
          true
      ) {
        router.replace("/login");
        return;
      }

      setProfil({
        ime_prezime:
          data.ime_prezime,

        email:
          data.email ||
          user.email ||
          null,
      });

      await ucitajPregledDana();
    } catch (error) {
      console.error(
        "Greška učitavanja administratora:",
        error
      );

      setGreska(
        "Nije moguće učitati administratorski panel."
      );
    } finally {
      setUcitavanje(false);
    }
  }

  async function ucitajPregledDana() {
    setGreskaPregleda("");

    const danas =
      datumZaBazu(
        new Date()
      );

    try {
      const [
        predavanjaRez,
        skupineRez,
        profesoriRez,
        ucioniceRez,
      ] = await Promise.all([
        supabase
          .from("predavanja")
          .select(
            "id, skupina_id, profesor_id, ucionica_id, naziv, datum, vrijeme_pocetka, vrijeme_zavrsetka, status"
          )
          .eq(
            "datum",
            danas
          )
          .order(
            "vrijeme_pocetka",
            {
              ascending: true,
            }
          ),

        supabase
          .from(
            "obrazovne_skupine"
          )
          .select(
            "id, naziv, status"
          )
          .order("naziv"),

        supabase
          .from("profili")
          .select(
            "id, ime_prezime, aktivan"
          )
          .eq(
            "uloga",
            "profesor"
          )
          .order(
            "ime_prezime"
          ),

        supabase
          .from("ucionice")
          .select(
            "id, naziv, aktivna"
          )
          .order("naziv"),
      ]);

      const prvaGreska =
        predavanjaRez.error ||
        skupineRez.error ||
        profesoriRez.error ||
        ucioniceRez.error;

      if (prvaGreska) {
        setGreskaPregleda(
          "Dnevni pregled nije moguće učitati: " +
            prvaGreska.message
        );
        return;
      }

      setPredavanjaDana(
        predavanjaRez.data ??
          []
      );

      setSkupine(
        skupineRez.data ??
          []
      );

      setProfesori(
        profesoriRez.data ??
          []
      );

      setUcionice(
        ucioniceRez.data ??
          []
      );
    } catch (error) {
      console.error(
        "Greška dnevnog pregleda:",
        error
      );

      setGreskaPregleda(
        "Dnevni pregled trenutačno nije moguće učitati."
      );
    }
  }

  async function odjava() {
    if (
      odjavaUTijeku
    ) {
      return;
    }

    setOdjavaUTijeku(true);
    setGreska("");

    try {
      await supabase.auth.signOut();

      router.replace("/login");
    } catch (error) {
      console.error(
        "Greška odjave:",
        error
      );

      setGreska(
        "Odjava trenutačno nije moguća. Pokušajte ponovno."
      );

      setOdjavaUTijeku(false);
    }
  }

  const sadaMinute =
    sada.getHours() * 60 +
    sada.getMinutes();

  const aktivnaPredavanjaDanas =
    predavanjaDana.filter(
      (predavanje) =>
        predavanje.status !==
        "otkazano"
    );

  const otkazanaDanas =
    predavanjaDana.filter(
      (predavanje) =>
        predavanje.status ===
        "otkazano"
    );

  const aktivneSkupine =
    skupine.filter(
      (skupina) =>
        skupina.status ===
        "aktivna"
    );

  const zauzeteUcioniceDanas =
    ucionice
      .map(
        (ucionica) => ({
          ucionica,
          termini:
            aktivnaPredavanjaDanas
              .filter(
                (predavanje) =>
                  predavanje.ucionica_id ===
                  ucionica.id
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  minuteVremena(
                    a.vrijeme_pocetka
                  ) -
                  minuteVremena(
                    b.vrijeme_pocetka
                  )
              ),
        })
      )
      .filter(
        (stavka) =>
          stavka.termini.length >
          0
      );

  const uskoroPocinju =
    aktivnaPredavanjaDanas.filter(
      (predavanje) => {
        if (
          predavanje.status !==
          "planirano"
        ) {
          return false;
        }

        const pocetak =
          minuteVremena(
            predavanje.vrijeme_pocetka
          );

        return (
          pocetak >=
            sadaMinute &&
          pocetak <=
            sadaMinute + 120
        );
      }
    );



  if (ucitavanje) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f4f6f8] px-6">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle
            size={32}
            className="animate-spin text-[#c9252d]"
          />

          <p className="text-[15px] font-semibold text-[#66717d]">
            Učitavanje administracije...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f4f6f8]">
      <header className="sticky top-0 z-20 border-b border-[#e2e7ec] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="min-w-0">
            <p className="text-[19px] font-extrabold tracking-[-0.02em] text-[#17324d]">
              UČILIŠTE MAESTRO
            </p>

            <p className="mt-0.5 text-[13px] font-medium text-[#7a8590]">
              Administratorski panel
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void odjava()
            }
            disabled={
              odjavaUTijeku
            }
            className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-[#dce2e7] bg-white px-4 text-[14px] font-bold text-[#17324d] transition hover:bg-[#f4f6f8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {odjavaUTijeku ? (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            ) : (
              <LogOut
                size={18}
              />
            )}

            <span className="hidden sm:inline">
              {odjavaUTijeku
                ? "Odjava..."
                : "Odjava"}
            </span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 md:px-8 md:py-9">
        <section className="max-w-3xl">
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#c9252d]">
            Administracija
          </p>

          <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-[-0.025em] text-[#17202a] md:text-[38px]">
            Dobro došli
            {profil?.ime_prezime
              ? `, ${profil.ime_prezime}`
              : ""}
          </h1>

          <p className="mt-3 text-[16px] leading-7 text-[#66717d]">
            Upravljajte programima, skupinama,
            polaznicima, profesorima, učionicama,
            rasporedom i obavijestima Učilišta
            Maestro.
          </p>
        </section>

        {greska && (
          <div className="mt-6 rounded-[18px] border border-[#f2c7ca] bg-[#fff5f5] px-4 py-4 text-[15px] leading-6 text-[#a71d24]">
            {greska}
          </div>
        )}

        <section className="mt-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#17324d] text-white">
              <School
                size={20}
              />
            </div>

            <div>
              <h2 className="text-[20px] font-bold text-[#17202a]">
                Upravljanje Učilištem
              </h2>

              <p className="mt-0.5 text-[14px] text-[#66717d]">
                Odaberite modul koji želite otvoriti.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moduli.map(
              (modul) => {
                const Ikona =
                  modul.Ikona;

                return (
                  <button
                    key={
                      modul.putanja
                    }
                    type="button"
                    onClick={() =>
                      router.push(
                        modul.putanja
                      )
                    }
                    className="group flex min-h-[168px] w-full flex-col items-start rounded-[22px] border border-[#dfe5ea] bg-white p-5 text-left shadow-[0_5px_18px_rgba(23,50,77,0.04)] transition hover:-translate-y-0.5 hover:border-[#cbd4dc] hover:shadow-[0_8px_24px_rgba(23,50,77,0.08)]"
                  >
                    <div className="flex w-full items-start justify-between gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d] transition group-hover:bg-[#17324d] group-hover:text-white">
                        <Ikona
                          size={21}
                        />
                      </div>

                      <ChevronRight
                        size={20}
                        className="mt-1 text-[#a2aab2] transition group-hover:translate-x-0.5 group-hover:text-[#17324d]"
                      />
                    </div>

                    <h3 className="mt-5 text-[18px] font-bold text-[#17202a]">
                      {
                        modul.naziv
                      }
                    </h3>

                    <p className="mt-2 text-[14px] leading-6 text-[#66717d]">
                      {
                        modul.opis
                      }
                    </p>
                  </button>
                );
              }
            )}
          </div>
        </section>


        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#c9252d]">
                Pregled dana
              </p>

              <h2 className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#17202a]">
                Danas u Učilištu
              </h2>

              <p className="mt-1 text-[14px] capitalize text-[#66717d]">
                {formatDanas(
                  sada
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/raspored"
                )
              }
              className="flex min-h-[44px] items-center justify-center gap-2 self-start rounded-xl border border-[#d7dde3] bg-white px-4 text-[13px] font-bold text-[#17324d] transition hover:bg-[#f4f6f8] sm:self-auto"
            >
              <CalendarDays
                size={17}
              />

              Otvori raspored
            </button>
          </div>

          {greskaPregleda && (
            <div className="mb-4 rounded-[18px] border border-[#f2c7ca] bg-[#fff5f5] px-4 py-4 text-[14px] leading-6 text-[#a71d24]">
              {
                greskaPregleda
              }
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[22px] border border-[#dfe5ea] bg-white p-5 shadow-[0_5px_18px_rgba(23,50,77,0.04)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8b949e]">
                    Danas predavanja
                  </p>

                  <p className="mt-2 text-[32px] font-extrabold text-[#17202a]">
                    {
                      aktivnaPredavanjaDanas.length
                    }
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <CalendarDays
                    size={23}
                  />
                </div>
              </div>

              {otkazanaDanas.length >
                0 && (
                <p className="mt-3 text-[12px] font-semibold text-[#a71d24]">
                  {
                    otkazanaDanas.length
                  }{" "}
                  {otkazanaDanas.length ===
                  1
                    ? "otkazani termin"
                    : "otkazana termina"}{" "}
                  nije uključen u broj.
                </p>
              )}
            </div>

            <div className="rounded-[22px] border border-[#dfe5ea] bg-white p-5 shadow-[0_5px_18px_rgba(23,50,77,0.04)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8b949e]">
                    Učionice s terminima danas
                  </p>

                  <p className="mt-2 text-[32px] font-extrabold text-[#17202a]">
                    {
                      zauzeteUcioniceDanas.length
                    }
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <DoorOpen
                    size={23}
                  />
                </div>
              </div>

              <p className="mt-3 text-[12px] font-semibold text-[#7a8590]">
                Broj učionica koje imaju barem jedan termin tijekom dana.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#dfe5ea] bg-white p-5 shadow-[0_5px_18px_rgba(23,50,77,0.04)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8b949e]">
                    Aktivne skupine
                  </p>

                  <p className="mt-2 text-[32px] font-extrabold text-[#17202a]">
                    {
                      aktivneSkupine.length
                    }
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <School
                    size={23}
                  />
                </div>
              </div>

              <p className="mt-3 text-[12px] font-semibold text-[#7a8590]">
                Skupine sa statusom aktivna.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[22px] border border-[#dfe5ea] bg-white p-5 shadow-[0_5px_18px_rgba(23,50,77,0.04)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <Clock3
                    size={20}
                  />
                </div>

                <div>
                  <h3 className="text-[18px] font-bold text-[#17202a]">
                    Uskoro počinju
                  </h3>

                  <p className="mt-0.5 text-[12px] text-[#7a8590]">
                    Predavanja u sljedeća 2 sata
                  </p>
                </div>
              </div>

              {uskoroPocinju.length ===
              0 ? (
                <div className="mt-4 rounded-xl bg-[#f7f9fa] px-4 py-4">
                  <p className="text-[14px] font-semibold text-[#66717d]">
                    Nema predavanja koja počinju u sljedeća 2 sata.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {uskoroPocinju.map(
                    (
                      predavanje
                    ) => (
                      <button
                        key={
                          predavanje.id
                        }
                        type="button"
                        onClick={() =>
                          router.push(
                            "/admin/raspored"
                          )
                        }
                        className="flex w-full items-start gap-3 rounded-xl border border-[#e2e7ec] bg-[#fbfcfd] p-4 text-left transition hover:border-[#cbd4dc] hover:bg-[#f7f9fa]"
                      >
                        <div className="flex min-w-[62px] shrink-0 flex-col items-center rounded-lg bg-[#17324d] px-2 py-2 text-white">
                          <span className="text-[15px] font-extrabold">
                            {formatVrijeme(
                              predavanje.vrijeme_pocetka
                            )}
                          </span>

                          <span className="mt-0.5 text-[10px] font-semibold opacity-80">
                            početak
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-bold text-[#17202a]">
                            {
                              predavanje.naziv
                            }
                          </p>

                          <p className="mt-1 truncate text-[12px] font-semibold text-[#c9252d]">
                            {nazivSkupine(
                              predavanje.skupina_id
                            )}
                          </p>

                          <p className="mt-1 text-[12px] leading-5 text-[#66717d]">
                            {nazivProfesora(
                              predavanje.profesor_id
                            )}
                            {" · "}
                            {nazivUcionice(
                              predavanje.ucionica_id
                            )}
                          </p>
                        </div>

                        <ChevronRight
                          size={18}
                          className="mt-1 shrink-0 text-[#a2aab2]"
                        />
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="rounded-[22px] border border-[#dfe5ea] bg-white p-5 shadow-[0_5px_18px_rgba(23,50,77,0.04)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <DoorOpen
                    size={20}
                  />
                </div>

                <div>
                  <h3 className="text-[18px] font-bold text-[#17202a]">
                    Zauzetost učionica danas
                  </h3>

                  <p className="mt-0.5 text-[12px] text-[#7a8590]">
                    Cijeli današnji dan
                  </p>
                </div>
              </div>

              {zauzeteUcioniceDanas.length ===
              0 ? (
                <div className="mt-4 rounded-xl border border-[#cde5d4] bg-[#f2faf4] px-4 py-4">
                  <p className="text-[14px] font-bold text-[#277442]">
                    Danas nema rezerviranih učionica.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {zauzeteUcioniceDanas.map(
                    (
                      stavka
                    ) => (
                      <button
                        key={
                          stavka.ucionica.id
                        }
                        type="button"
                        onClick={() =>
                          router.push(
                            "/admin/ucionice"
                          )
                        }
                        className="w-full rounded-xl border border-[#e2e7ec] bg-[#fbfcfd] p-4 text-left transition hover:border-[#cbd4dc] hover:bg-[#f7f9fa]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef3f7] text-[#17324d]">
                            <DoorOpen
                              size={19}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-[14px] font-extrabold text-[#17202a]">
                                {
                                  stavka.ucionica.naziv
                                }
                              </p>

                              <span className="rounded-full bg-[#fff0f0] px-2.5 py-1 text-[10px] font-bold text-[#b52027]">
                                {stavka.termini.length}{" "}
                                {stavka.termini.length ===
                                1
                                  ? "termin"
                                  : "termina"}
                              </span>
                            </div>

                            <div className="mt-3 space-y-2">
                              {stavka.termini.map(
                                (
                                  predavanje
                                ) => (
                                  <div
                                    key={
                                      predavanje.id
                                    }
                                    className="rounded-lg border border-[#e5e9ec] bg-white px-3 py-2.5"
                                  >
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                      <span className="font-mono text-[12px] font-extrabold text-[#c9252d]">
                                        {formatVrijeme(
                                          predavanje.vrijeme_pocetka
                                        )}
                                        {" – "}
                                        {formatVrijeme(
                                          predavanje.vrijeme_zavrsetka
                                        )}
                                      </span>

                                      <span className="text-[12px] font-bold text-[#17202a]">
                                        {
                                          predavanje.naziv
                                        }
                                      </span>
                                    </div>

                                    <p className="mt-1 text-[11px] font-semibold text-[#7a8590]">
                                      {nazivSkupine(
                                        predavanje.skupina_id
                                      )}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          <ChevronRight
                            size={18}
                            className="mt-1 shrink-0 text-[#a2aab2]"
                          />
                        </div>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>


        </section>

        <section className="mt-8 overflow-hidden rounded-[22px] border border-[#dfe5ea] bg-white shadow-[0_4px_16px_rgba(23,50,77,0.03)]">
          <div className="flex items-center gap-4 border-b border-[#e8ecef] px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
              <ShieldCheck
                size={20}
              />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                Prijavljeni korisnik
              </p>

              <p className="mt-0.5 text-[17px] font-bold text-[#17202a]">
                {profil?.ime_prezime ||
                  "Administrator"}
              </p>
            </div>
          </div>

          {profil?.email && (
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                <Mail
                  size={19}
                />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                  E-mail
                </p>

                <p className="mt-0.5 break-all text-[15px] font-semibold text-[#4f5b66]">
                  {
                    profil.email
                  }
                </p>
              </div>
            </div>
          )}
        </section>

        <p className="mt-7 text-center text-[12px] leading-5 text-[#929ba4]">
          Učilište Maestro
          <br />
          Administratorska aplikacija
        </p>
      </div>
    </main>
  );
}
