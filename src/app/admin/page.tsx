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
    void provjeriAdministratora();
  }, []);

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