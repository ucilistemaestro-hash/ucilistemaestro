"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Bell,
  LogOut,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProfesorNav from "@/components/ProfesorNav";
import PushObavijesti from "@/components/PushObavijesti";

type Profil = {
  ime_prezime: string | null;
  email: string | null;
  telefon: string | null;
};

export default function ProfesorProfilPage() {
  const router = useRouter();

  const [profil, setProfil] = useState<Profil | null>(null);
  const [ucitavanje, setUcitavanje] = useState(true);
  const [greska, setGreska] = useState("");

  useEffect(() => {
    ucitajProfil();
  }, []);

  async function ucitajProfil() {
    setUcitavanje(true);
    setGreska("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profili")
      .select(
        "ime_prezime, email, telefon, uloga, aktivan"
      )
      .eq("id", user.id)
      .single();

    if (
      error ||
      !data ||
      data.uloga !== "profesor" ||
      data.aktivan !== true
    ) {
      router.replace("/login");
      return;
    }

    setProfil({
      ime_prezime: data.ime_prezime,
      email:
        data.email ||
        user.email ||
        null,
      telefon: data.telefon,
    });

    setUcitavanje(false);
  }

  async function odjava() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden bg-[#f4f6f8] pb-28">
      <header className="w-full border-b border-[#e2e7ec] bg-white">
        <div className="w-full px-4 py-6 md:mx-auto md:max-w-[640px] md:px-5">
          <p className="text-[13px] font-bold uppercase tracking-[0.09em] text-[#c9252d]">
            Učilište Maestro
          </p>

          <h1 className="mt-1 text-[32px] font-extrabold tracking-[-0.025em] text-[#17202a]">
            Moj profil
          </h1>

          <p className="mt-2 text-[17px] leading-6 text-[#66717d]">
            Vaši podaci i postavke profesorskog računa.
          </p>
        </div>
      </header>

      <div className="w-full px-4 py-6 md:mx-auto md:max-w-[640px] md:px-5">
        {ucitavanje ? (
          <div className="rounded-[22px] border border-[#dfe5ea] bg-white p-6">
            <p className="text-[17px] font-medium text-[#66717d]">
              Učitavanje profila...
            </p>
          </div>
        ) : greska ? (
          <div className="rounded-[22px] border border-red-200 bg-red-50 p-5 text-[17px] leading-7 text-red-700">
            {greska}
          </div>
        ) : profil ? (
          <>
            <section className="overflow-hidden rounded-[24px] border border-[#dfe5ea] bg-white shadow-[0_6px_20px_rgba(23,50,77,0.05)]">
              <div className="bg-[#17324d] px-5 py-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <UserRound size={30} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold uppercase tracking-wide text-white/60">
                      Profesor
                    </p>

                    <h2 className="mt-1 text-[25px] font-extrabold leading-tight text-white">
                      {profil.ime_prezime ||
                        "Profesor"}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[#e8ecef]">
                <div className="flex items-start gap-4 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                    <Mail size={21} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[13px] font-bold uppercase tracking-wide text-[#8b949e]">
                      E-mail
                    </p>

                    <p className="mt-1 break-all text-[17px] font-semibold leading-6 text-[#28333e]">
                      {profil.email ||
                        "Nije upisan"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                    <Phone size={21} />
                  </div>

                  <div>
                    <p className="text-[13px] font-bold uppercase tracking-wide text-[#8b949e]">
                      Telefon
                    </p>

                    <p className="mt-1 text-[17px] font-semibold text-[#28333e]">
                      {profil.telefon ||
                        "Nije upisan"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <Bell
                  size={19}
                  className="text-[#17324d]"
                />

                <h2 className="text-[19px] font-bold text-[#17202a]">
                  Push obavijesti
                </h2>
              </div>

              <PushObavijesti />

              <p className="mt-3 px-1 text-[14px] leading-6 text-[#7b858f]">
                Push obavijesti koristimo za promjene
                rasporeda i važne informacije vezane uz
                nastavu.
              </p>
            </section>

            <section className="mt-8">
              <button
                type="button"
                onClick={odjava}
                className="flex min-h-[58px] w-full items-center justify-center gap-3 rounded-[18px] border-2 border-[#c9252d] bg-white px-5 text-[17px] font-bold text-[#c9252d]"
              >
                <LogOut size={21} />
                Odjavi se
              </button>
            </section>

            <p className="mt-6 text-center text-[13px] leading-5 text-[#929ba4]">
              Učilište Maestro
              <br />
              Aplikacija za profesore
            </p>
          </>
        ) : null}
      </div>

      <ProfesorNav />
    </main>
  );
}