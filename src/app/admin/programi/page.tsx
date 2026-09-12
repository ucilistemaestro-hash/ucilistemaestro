"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Program = {
  id: string;
  naziv: string;
  sifra: string | null;
  opis: string | null;
  aktivan: boolean;
};

export default function ProgramiPage() {
  const router = useRouter();

  const [programi, setProgrami] =
    useState<Program[]>([]);

  const [ucitavanje, setUcitavanje] =
    useState(true);

  const [spremanje, setSpremanje] =
    useState(false);

  const [
    statusUTijeku,
    setStatusUTijeku,
  ] =
    useState<string | null>(
      null
    );

  const [
    brisanjeUTijeku,
    setBrisanjeUTijeku,
  ] =
    useState<string | null>(
      null
    );

  const [greska, setGreska] =
    useState("");

  const [urediId, setUrediId] =
    useState<string | null>(
      null
    );

  const [naziv, setNaziv] =
    useState("");

  const [sifra, setSifra] =
    useState("");

  const [opis, setOpis] =
    useState("");

  useEffect(() => {
    void provjeriKorisnika();
  }, []);

  async function provjeriKorisnika() {
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
        "administrator" ||
      profil.aktivan !==
        true
    ) {
      router.replace("/login");
      return;
    }

    await ucitajPrograme();
  }

  async function ucitajPrograme() {
    setUcitavanje(true);
    setGreska("");

    const {
      data,
      error,
    } = await supabase
      .from(
        "obrazovni_programi"
      )
      .select(
        "id, naziv, sifra, opis, aktivan"
      )
      .order(
        "naziv"
      );

    if (error) {
      setGreska(
        "Nije moguće učitati obrazovne programe."
      );
    } else {
      setProgrami(
        data ?? []
      );
    }

    setUcitavanje(false);
  }

  async function spremiProgram(
    e: FormEvent
  ) {
    e.preventDefault();

    if (!naziv.trim()) {
      setGreska(
        "Naziv programa je obavezan."
      );
      return;
    }

    setGreska("");
    setSpremanje(true);

    if (urediId) {
      const {
        error,
      } = await supabase
        .from(
          "obrazovni_programi"
        )
        .update({
          naziv:
            naziv.trim(),

          sifra:
            sifra.trim() ||
            null,

          opis:
            opis.trim() ||
            null,
        })
        .eq(
          "id",
          urediId
        );

      if (error) {
        setGreska(
          "Program nije moguće izmijeniti."
        );

        setSpremanje(false);
        return;
      }
    } else {
      const {
        error,
      } = await supabase
        .from(
          "obrazovni_programi"
        )
        .insert({
          naziv:
            naziv.trim(),

          sifra:
            sifra.trim() ||
            null,

          opis:
            opis.trim() ||
            null,

          aktivan: true,
        });

      if (error) {
        setGreska(
          error.message.includes(
            "duplicate"
          )
            ? "Program s tom šifrom već postoji."
            : "Program nije moguće spremiti."
        );

        setSpremanje(false);
        return;
      }
    }

    ocistiFormu();

    await ucitajPrograme();

    setSpremanje(false);
  }

  function pokreniUredivanje(
    program: Program
  ) {
    setUrediId(
      program.id
    );

    setNaziv(
      program.naziv
    );

    setSifra(
      program.sifra ??
        ""
    );

    setOpis(
      program.opis ??
        ""
    );

    setGreska("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function ocistiFormu() {
    setUrediId(null);
    setNaziv("");
    setSifra("");
    setOpis("");
    setGreska("");
  }

  async function promijeniStatus(
    program: Program
  ) {
    if (
      statusUTijeku ||
      brisanjeUTijeku
    ) {
      return;
    }

    setStatusUTijeku(
      program.id
    );

    setGreska("");

    const {
      error,
    } = await supabase
      .from(
        "obrazovni_programi"
      )
      .update({
        aktivan:
          !program.aktivan,
      })
      .eq(
        "id",
        program.id
      );

    if (error) {
      setGreska(
        "Status programa nije moguće promijeniti."
      );

      setStatusUTijeku(
        null
      );

      return;
    }

    await ucitajPrograme();

    setStatusUTijeku(
      null
    );
  }

  async function obrisiProgram(
    program: Program
  ) {
    if (
      brisanjeUTijeku ||
      statusUTijeku
    ) {
      return;
    }

    setGreska("");

    const {
      count,
      error:
        skupineError,
    } = await supabase
      .from(
        "obrazovne_skupine"
      )
      .select(
        "id",
        {
          count: "exact",
          head: true,
        }
      )
      .eq(
        "program_id",
        program.id
      );

    if (
      skupineError
    ) {
      setGreska(
        "Nije moguće provjeriti koristi li se ovaj program."
      );
      return;
    }

    if (
      (count ?? 0) >
      0
    ) {
      setGreska(
        `Program "${program.naziv}" nije moguće obrisati jer postoje obrazovne skupine povezane s njim. Program možete deaktivirati.`
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    const potvrda =
      window.confirm(
        `Želite li trajno obrisati program "${program.naziv}"?\n\nOvu radnju nije moguće poništiti.`
      );

    if (!potvrda) {
      return;
    }

    setBrisanjeUTijeku(
      program.id
    );

    const {
      error,
    } = await supabase
      .from(
        "obrazovni_programi"
      )
      .delete()
      .eq(
        "id",
        program.id
      );

    if (error) {
      setGreska(
        "Program nije moguće obrisati. Provjerite je li povezan s drugim podacima."
      );

      setBrisanjeUTijeku(
        null
      );

      return;
    }

    if (
      urediId ===
      program.id
    ) {
      ocistiFormu();
    }

    await ucitajPrograme();

    setBrisanjeUTijeku(
      null
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f4f6f8]">
      <header className="sticky top-0 z-20 border-b border-[#e2e7ec] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 md:px-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin"
              )
            }
            aria-label="Povratak na administratorsku početnu stranicu"
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
              Obrazovni programi
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 md:px-8 md:py-9">
        <section className="max-w-3xl">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#17324d] text-white sm:flex">
              <BookOpen
                size={23}
              />
            </div>

            <div>
              <h2 className="text-[28px] font-extrabold tracking-[-0.025em] text-[#17202a] md:text-[32px]">
                Upravljanje programima
              </h2>

              <p className="mt-2 text-[15px] leading-6 text-[#66717d]">
                Dodajte nove obrazovne programe,
                uredite postojeće podatke, promijenite
                njihov status ili obrišite programe
                koji se još ne koriste.
              </p>
            </div>
          </div>
        </section>

        {greska && (
          <div className="mt-6 rounded-[18px] border border-[#f2c7ca] bg-[#fff5f5] px-4 py-4 text-[14px] leading-6 text-[#a71d24]">
            {greska}
          </div>
        )}

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[380px_1fr]">
          <section className="rounded-[24px] border border-[#dfe5ea] bg-white p-5 shadow-[0_6px_20px_rgba(23,50,77,0.04)] lg:sticky lg:top-[96px]">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  urediId
                    ? "bg-[#fff2f2] text-[#c9252d]"
                    : "bg-[#eef3f7] text-[#17324d]"
                }`}
              >
                {urediId ? (
                  <Pencil
                    size={19}
                  />
                ) : (
                  <Plus
                    size={20}
                  />
                )}
              </div>

              <div>
                <h2 className="text-[19px] font-bold text-[#17202a]">
                  {urediId
                    ? "Uredi program"
                    : "Novi program"}
                </h2>

                <p className="mt-0.5 text-[13px] text-[#7a8590]">
                  {urediId
                    ? "Izmijenite podatke odabranog programa."
                    : "Unesite podatke novog programa."}
                </p>
              </div>
            </div>

            <form
              onSubmit={
                spremiProgram
              }
              className="mt-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="naziv-programa"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Naziv programa
                  <span className="ml-1 text-[#c9252d]">
                    *
                  </span>
                </label>

                <input
                  id="naziv-programa"
                  value={
                    naziv
                  }
                  onChange={(
                    e
                  ) =>
                    setNaziv(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="npr. Knjigovođa"
                />
              </div>

              <div>
                <label
                  htmlFor="sifra-programa"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Šifra programa
                </label>

                <input
                  id="sifra-programa"
                  value={
                    sifra
                  }
                  onChange={(
                    e
                  ) =>
                    setSifra(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="npr. KNJ-2026"
                />
              </div>

              <div>
                <label
                  htmlFor="opis-programa"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Opis
                </label>

                <textarea
                  id="opis-programa"
                  value={
                    opis
                  }
                  onChange={(
                    e
                  ) =>
                    setOpis(
                      e.target.value
                    )
                  }
                  rows={5}
                  className="w-full resize-none rounded-xl border border-[#d6dde3] bg-white px-4 py-3 text-[15px] leading-6 text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="Kratki opis programa..."
                />
              </div>

              <button
                type="submit"
                disabled={
                  spremanje
                }
                className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#17324d] px-5 text-[15px] font-bold text-white transition hover:bg-[#102437] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {spremanje ? (
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                ) : urediId ? (
                  <Save
                    size={19}
                  />
                ) : (
                  <Plus
                    size={19}
                  />
                )}

                {spremanje
                  ? "Spremanje..."
                  : urediId
                  ? "Spremi promjene"
                  : "Dodaj program"}
              </button>

              {urediId && (
                <button
                  type="button"
                  onClick={
                    ocistiFormu
                  }
                  disabled={
                    spremanje
                  }
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#d6dde3] bg-white px-5 text-[14px] font-bold text-[#52606d] transition hover:bg-[#f7f9fa] disabled:opacity-60"
                >
                  <RotateCcw
                    size={18}
                  />

                  Odustani od uređivanja
                </button>
              )}
            </form>
          </section>

          <section className="min-w-0">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.09em] text-[#c9252d]">
                  Evidencija
                </p>

                <h2 className="mt-1 text-[22px] font-extrabold text-[#17202a]">
                  Popis programa
                </h2>
              </div>

              <div className="shrink-0 rounded-xl border border-[#dfe5ea] bg-white px-3 py-2 text-[13px] font-semibold text-[#66717d]">
                Ukupno:{" "}
                <span className="font-bold text-[#17202a]">
                  {
                    programi.length
                  }
                </span>
              </div>
            </div>

            {ucitavanje ? (
              <div className="mt-4 flex min-h-[180px] items-center justify-center rounded-[22px] border border-[#dfe5ea] bg-white">
                <div className="flex flex-col items-center gap-3">
                  <LoaderCircle
                    size={29}
                    className="animate-spin text-[#c9252d]"
                  />

                  <p className="text-[14px] font-semibold text-[#66717d]">
                    Učitavanje programa...
                  </p>
                </div>
              </div>
            ) : programi.length ===
              0 ? (
              <div className="mt-4 rounded-[22px] border border-[#dfe5ea] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <BookOpen
                    size={21}
                  />
                </div>

                <h3 className="mt-4 text-[19px] font-bold text-[#17202a]">
                  Još nema obrazovnih programa
                </h3>

                <p className="mt-2 text-[14px] leading-6 text-[#66717d]">
                  Prvi program možete dodati pomoću
                  obrasca.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {programi.map(
                  (
                    program
                  ) => (
                    <article
                      key={
                        program.id
                      }
                      className="rounded-[22px] border border-[#dfe5ea] bg-white p-5 shadow-[0_5px_18px_rgba(23,50,77,0.035)]"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="text-[18px] font-bold leading-6 text-[#17202a]">
                              {
                                program.naziv
                              }
                            </h3>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                program.aktivan
                                  ? "bg-[#edf7f0] text-[#277442]"
                                  : "bg-[#f0f2f4] text-[#69737c]"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  program.aktivan
                                    ? "bg-[#35985a]"
                                    : "bg-[#89929a]"
                                }`}
                              />

                              {program.aktivan
                                ? "Aktivan"
                                : "Neaktivan"}
                            </span>
                          </div>

                          {program.sifra && (
                            <p className="mt-1.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#8b949e]">
                              {
                                program.sifra
                              }
                            </p>
                          )}

                          {program.opis ? (
                            <p className="mt-3 whitespace-pre-line text-[14px] leading-6 text-[#5e6974]">
                              {
                                program.opis
                              }
                            </p>
                          ) : (
                            <p className="mt-3 text-[14px] italic text-[#9aa2aa]">
                              Opis nije upisan.
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              pokreniUredivanje(
                                program
                              )
                            }
                            disabled={
                              brisanjeUTijeku !==
                                null ||
                              statusUTijeku !==
                                null
                            }
                            className="flex min-h-[42px] items-center gap-2 rounded-xl border border-[#d6dde3] bg-white px-3.5 text-[13px] font-bold text-[#17324d] transition hover:bg-[#f4f6f8] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Pencil
                              size={16}
                            />

                            Uredi
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void promijeniStatus(
                                program
                              )
                            }
                            disabled={
                              statusUTijeku !==
                                null ||
                              brisanjeUTijeku !==
                                null
                            }
                            className={`flex min-h-[42px] items-center gap-2 rounded-xl border px-3.5 text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              program.aktivan
                                ? "border-[#efc8cb] bg-white text-[#b52027] hover:bg-[#fff5f5]"
                                : "border-[#cce4d3] bg-white text-[#277442] hover:bg-[#f4fbf6]"
                            }`}
                          >
                            {statusUTijeku ===
                            program.id ? (
                              <LoaderCircle
                                size={16}
                                className="animate-spin"
                              />
                            ) : program.aktivan ? (
                              <Power
                                size={16}
                              />
                            ) : (
                              <CheckCircle2
                                size={16}
                              />
                            )}

                            {statusUTijeku ===
                            program.id
                              ? "Spremanje..."
                              : program.aktivan
                              ? "Deaktiviraj"
                              : "Aktiviraj"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void obrisiProgram(
                                program
                              )
                            }
                            disabled={
                              brisanjeUTijeku !==
                                null ||
                              statusUTijeku !==
                                null
                            }
                            className="flex min-h-[42px] items-center gap-2 rounded-xl border border-[#efc8cb] bg-white px-3.5 text-[13px] font-bold text-[#b52027] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {brisanjeUTijeku ===
                            program.id ? (
                              <LoaderCircle
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2
                                size={16}
                              />
                            )}

                            {brisanjeUTijeku ===
                            program.id
                              ? "Brisanje..."
                              : "Obriši"}
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}