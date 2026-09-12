"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Bell,
  ExternalLink,
  Info,
} from "lucide-react";

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

export default function ObavijestiPage() {
  const router = useRouter();

  const [obavijesti, setObavijesti] =
    useState<Obavijest[]>([]);

  const [ucitavanje, setUcitavanje] =
    useState(true);

  const [greska, setGreska] =
    useState("");

  useEffect(() => {
    ucitajObavijesti();
  }, []);

  async function ucitajObavijesti() {
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
      profil.uloga !== "polaznik" ||
      profil.aktivan !== true
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
      setObavijesti(data ?? []);
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

  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden bg-[#f4f6f8] pb-28">
      <header className="w-full border-b border-[#e2e7ec] bg-white">
        <div className="w-full px-4 py-6 md:mx-auto md:max-w-[640px] md:px-5">
          <p className="text-[13px] font-bold uppercase tracking-[0.09em] text-[#c9252d]">
            Učilište Maestro
          </p>

          <h1 className="mt-1 text-[32px] font-extrabold tracking-[-0.025em] text-[#17202a]">
            Obavijesti
          </h1>

          <p className="mt-2 text-[17px] leading-6 text-[#66717d]">
            Važne informacije, promjene i obavijesti
            Učilišta.
          </p>
        </div>
      </header>

      <div className="w-full px-4 py-6 md:mx-auto md:max-w-[640px] md:px-5">
        {ucitavanje ? (
          <div className="rounded-[22px] border border-[#dfe5ea] bg-white p-6">
            <p className="text-[17px] font-medium text-[#66717d]">
              Učitavanje obavijesti...
            </p>
          </div>
        ) : greska ? (
          <div className="rounded-[22px] border border-red-200 bg-red-50 p-5 text-[17px] leading-7 text-red-700">
            {greska}
          </div>
        ) : obavijesti.length === 0 ? (
          <section className="rounded-[24px] border border-[#dfe5ea] bg-white p-6 shadow-[0_6px_20px_rgba(23,50,77,0.05)]">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#eef3f7] text-[#17324d]">
              <Bell size={25} />
            </div>

            <h2 className="mt-5 text-[22px] font-bold text-[#17202a]">
              Nema novih obavijesti
            </h2>

            <p className="mt-2 text-[17px] leading-7 text-[#66717d]">
              Nove informacije Učilišta bit će
              prikazane ovdje.
            </p>
          </section>
        ) : (
          <>
            <section className="mb-6 flex items-center justify-between rounded-[20px] border border-[#dfe5ea] bg-white px-5 py-4">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-wide text-[#8b949e]">
                  Vaše obavijesti
                </p>

                <p className="mt-1 text-[20px] font-bold text-[#17202a]">
                  {obavijesti.length}{" "}
                  {obavijesti.length === 1
                    ? "obavijest"
                    : "obavijesti"}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3f7] text-[#17324d]">
                <Bell size={24} />
              </div>
            </section>

            <div className="overflow-hidden rounded-[24px] border border-[#dfe5ea] bg-white shadow-[0_6px_20px_rgba(23,50,77,0.05)]">
              {obavijesti.map(
                (obavijest, index) => (
                  <article
                    key={
                      obavijest.obavijest_id
                    }
                    className={`p-5 ${
                      index !==
                      obavijesti.length - 1
                        ? "border-b border-[#e8ecef]"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                        <Info size={22} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1">
                          <h2 className="text-[20px] font-bold leading-6 text-[#17202a]">
                            {
                              obavijest.naslov
                            }
                          </h2>

                          <p className="text-[14px] font-medium text-[#929ba4]">
                            {formatDatum(
                              obavijest.datum_objave
                            )}
                            {" · "}
                            {formatVrijeme(
                              obavijest.datum_objave
                            )}
                          </p>
                        </div>

                        <p className="mt-3 text-[17px] leading-7 text-[#4f5b66]">
                          {
                            obavijest.poruka
                          }
                        </p>

                        {obavijest.link && (
                          <a
                            href={
                              obavijest.link
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#17324d] px-4 text-[16px] font-bold text-white"
                          >
                            Otvori poveznicu
                            <ExternalLink
                              size={18}
                            />
                          </a>
                        )}
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