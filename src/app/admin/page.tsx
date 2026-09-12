"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Bell,
  BookOpen,
  CalendarDays,
  DoorOpen,
  GraduationCap,
  LogOut,
  School,
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
    opis: "Upravljanje programima obrazovanja.",
    putanja: "/admin/programi",
    Ikona: BookOpen,
  },
  {
    naziv: "Obrazovne skupine",
    opis: "Skupine, početak i završetak programa.",
    putanja: "/admin/skupine",
    Ikona: School,
  },
  {
    naziv: "Polaznici",
    opis: "Dodavanje i upravljanje polaznicima.",
    putanja: "/admin/polaznici",
    Ikona: Users,
  },
  {
    naziv: "Profesori",
    opis: "Profesori i korisnički pristup.",
    putanja: "/admin/profesori",
    Ikona: GraduationCap,
  },
  {
    naziv: "Učionice",
    opis: "Učionice, lokacije i kapaciteti.",
    putanja: "/admin/ucionice",
    Ikona: DoorOpen,
  },
  {
    naziv: "Raspored",
    opis: "Termini nastave, profesori i skupine.",
    putanja: "/admin/raspored",
    Ikona: CalendarDays,
  },
  {
    naziv: "Obavijesti",
    opis: "Objava obavijesti i push poruka.",
    putanja: "/admin/obavijesti",
    Ikona: Bell,
  },
];

export default function AdminPage() {
  const router = useRouter();

  const [profil, setProfil] =
    useState<AdminProfil | null>(null);

  const [ucitavanje, setUcitavanje] =
    useState(true);

  const [greska, setGreska] =
    useState("");

  useEffect(() => {
    provjeriAdministratora();
  }, []);

  async function provjeriAdministratora() {
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
      data,
      error,
    } = await supabase
      .from("profili")
      .select(
        "ime_prezime, email, uloga, aktivan"
      )
      .eq("id", user.id)
      .single();

    if (
      error ||
      !data ||
      data.uloga !== "administrator" ||
      data.aktivan !== true
    ) {
      router.replace("/login");
      return;
    }

    setProfil({
      ime_prezime:
        data.ime_prezime,
      email:
        data.email || user.email || null,
    });

    setUcitavanje(false);
  }

  async function odjava() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (ucitavanje) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-6">
        <p className="text-lg font-semibold text-[#66717d]">
          Učitavanje administracije...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f6f8]">
      <header className="border-b border-[#e2e7ec] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-5 md:px-8">
          <div>
            <div className="text-[27px] font-black tracking-[-0.02em] text-[#c9252d]">
              MAESTRO
            </div>

            <p className="mt-0.5 text-sm font-medium text-[#66717d]">
              Administracija Učilišta
            </p>
          </div>

          <button
            type="button"
            onClick={odjava}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-[#dce2e7] bg-white px-4 text-sm font-bold text-[#17324d] hover:bg-[#f4f6f8]"
          >
            <LogOut size={18} />
            Odjava
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <section>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#c9252d]">
            Administratorski panel
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.025em] text-[#17202a] md:text-4xl">
            Dobro došli
            {profil?.ime_prezime
              ? `, ${profil.ime_prezime}`
              : ""}
          </h1>

          <p className="mt-3 max-w-2xl text-[17px] leading-7 text-[#66717d]">
            Upravljajte programima, skupinama,
            polaznicima, profesorima, rasporedom i
            obavijestima Učilišta Maestro.
          </p>
        </section>

        {greska && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {greska}
          </div>
        )}

        <section className="mt-9">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#17324d] text-white">
              <School size={21} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#17202a]">
                Upravljanje Učilištem
              </h2>

              <p className="text-sm text-[#66717d]">
                Odaberite modul koji želite otvoriti.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moduli.map((modul) => {
              const Ikona = modul.Ikona;

              return (
                <button
                  key={modul.putanja}
                  type="button"
                  onClick={() =>
                    router.push(modul.putanja)
                  }
                  className="group flex min-h-[170px] w-full flex-col items-start rounded-[22px] border border-[#dfe5ea] bg-white p-5 text-left shadow-[0_5px_18px_rgba(23,50,77,0.04)] transition hover:-translate-y-0.5 hover:border-[#cbd4dc] hover:shadow-[0_8px_24px_rgba(23,50,77,0.08)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d] transition group-hover:bg-[#17324d] group-hover:text-white">
                    <Ikona size={23} />
                  </div>

                  <h3 className="mt-5 text-[19px] font-bold text-[#17202a]">
                    {modul.naziv}
                  </h3>

                  <p className="mt-2 text-[15px] leading-6 text-[#66717d]">
                    {modul.opis}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-[22px] border border-[#dfe5ea] bg-white p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-[#8b949e]">
            Prijavljeni korisnik
          </p>

          <p className="mt-2 text-lg font-bold text-[#17202a]">
            {profil?.ime_prezime ||
              "Administrator"}
          </p>

          {profil?.email && (
            <p className="mt-1 text-sm text-[#66717d]">
              {profil.email}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}