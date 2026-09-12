"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  GraduationCap,
  LoaderCircle,
  Mail,
  Phone,
  Plus,
  Power,
  Trash2,
  UserRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Profesor = {
  id: string;
  ime_prezime: string | null;
  email: string | null;
  telefon: string | null;
  aktivan: boolean;
};

type ApiOdgovor = {
  success?: boolean;
  error?: string;
  message?: string;
};

export default function ProfesoriPage() {
  const router = useRouter();

  const [profesori, setProfesori] =
    useState<Profesor[]>([]);

  const [
    imePrezime,
    setImePrezime,
  ] = useState("");

  const [email, setEmail] =
    useState("");

  const [telefon, setTelefon] =
    useState("");

  const [lozinka, setLozinka] =
    useState("");

  const [
    ucitavanje,
    setUcitavanje,
  ] = useState(true);

  const [
    spremanje,
    setSpremanje,
  ] = useState(false);

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

  const [uspjeh, setUspjeh] =
    useState("");

  useEffect(() => {
    void provjeriPristup();
  }, []);

  async function provjeriPristup() {
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

    await ucitajProfesore();
  }

  async function ucitajProfesore() {
    setUcitavanje(true);

    const {
      data,
      error,
    } = await supabase
      .from("profili")
      .select(
        "id, ime_prezime, email, telefon, aktivan"
      )
      .eq(
        "uloga",
        "profesor"
      )
      .order(
        "ime_prezime"
      );

    if (error) {
      setGreska(
        "Nije moguće učitati profesore."
      );
    } else {
      setProfesori(
        data ?? []
      );
    }

    setUcitavanje(false);
  }

  async function procitajApiOdgovor(
    odgovor: Response
  ): Promise<ApiOdgovor> {
    const tekst =
      await odgovor.text();

    if (!tekst) {
      return {};
    }

    try {
      return JSON.parse(
        tekst
      ) as ApiOdgovor;
    } catch {
      return {
        error:
          "Poslužitelj je vratio neočekivan odgovor.",
      };
    }
  }

  async function dodajProfesora(
    e: FormEvent
  ) {
    e.preventDefault();

    setGreska("");
    setUspjeh("");

    if (
      !imePrezime.trim()
    ) {
      setGreska(
        "Ime i prezime su obavezni."
      );
      return;
    }

    if (!email.trim()) {
      setGreska(
        "E-mail je obavezan."
      );
      return;
    }

    if (
      lozinka.length < 8
    ) {
      setGreska(
        "Privremena lozinka mora imati najmanje 8 znakova."
      );
      return;
    }

    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    if (!session) {
      setGreska(
        "Vaša prijava je istekla. Prijavite se ponovno."
      );
      return;
    }

    setSpremanje(true);

    try {
      const odgovor =
        await fetch(
          "/api/admin/profesori",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify(
              {
                ime_prezime:
                  imePrezime.trim(),

                email:
                  email.trim(),

                telefon:
                  telefon.trim(),

                lozinka,
              }
            ),
          }
        );

      const rezultat =
        await procitajApiOdgovor(
          odgovor
        );

      if (!odgovor.ok) {
        setGreska(
          rezultat.error ??
            "Profesora nije moguće dodati."
        );
        return;
      }

      setImePrezime("");
      setEmail("");
      setTelefon("");
      setLozinka("");

      setUspjeh(
        "Profesor je uspješno dodan."
      );

      await ucitajProfesore();
    } catch (error) {
      console.error(
        "Greška dodavanja profesora:",
        error
      );

      setGreska(
        "Profesora trenutačno nije moguće dodati."
      );
    } finally {
      setSpremanje(false);
    }
  }

  async function promijeniStatus(
    profesor: Profesor
  ) {
    if (
      statusUTijeku ||
      brisanjeUTijeku
    ) {
      return;
    }

    setGreska("");
    setUspjeh("");

    setStatusUTijeku(
      profesor.id
    );

    const {
      error,
    } = await supabase
      .from("profili")
      .update({
        aktivan:
          !profesor.aktivan,
      })
      .eq(
        "id",
        profesor.id
      );

    if (error) {
      setGreska(
        "Status profesora nije moguće promijeniti."
      );

      setStatusUTijeku(
        null
      );

      return;
    }

    setUspjeh(
      profesor.aktivan
        ? "Profesor je deaktiviran."
        : "Profesor je aktiviran."
    );

    await ucitajProfesore();

    setStatusUTijeku(
      null
    );
  }

  async function obrisiProfesora(
    profesor: Profesor
  ) {
    if (
      brisanjeUTijeku ||
      statusUTijeku
    ) {
      return;
    }

    setGreska("");
    setUspjeh("");

    const prikazImena =
      profesor.ime_prezime ||
      profesor.email ||
      "Profesor";

    const potvrda =
      window.confirm(
        `Želite li TRAJNO obrisati profesora "${prikazImena}"?\n\nProfesor se može obrisati samo ako nema evidentiranih predavanja.\n\nOvu radnju nije moguće poništiti.`
      );

    if (!potvrda) {
      return;
    }

    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    if (!session) {
      setGreska(
        "Vaša prijava je istekla. Prijavite se ponovno."
      );
      return;
    }

    setBrisanjeUTijeku(
      profesor.id
    );

    try {
      const odgovor =
        await fetch(
          "/api/admin/profesori/obrisi",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify(
              {
                korisnik_id:
                  profesor.id,
              }
            ),
          }
        );

      const rezultat =
        await procitajApiOdgovor(
          odgovor
        );

      if (!odgovor.ok) {
        setGreska(
          rezultat.error ??
            "Profesora nije moguće obrisati."
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      setUspjeh(
        `Profesor "${prikazImena}" je trajno obrisan.`
      );

      await ucitajProfesore();
    } catch (error) {
      console.error(
        "Greška brisanja profesora:",
        error
      );

      setGreska(
        "Profesora trenutačno nije moguće obrisati."
      );
    } finally {
      setBrisanjeUTijeku(
        null
      );
    }
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
              Profesori
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 md:px-8 md:py-9">
        <section className="max-w-3xl">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#17324d] text-white sm:flex">
              <GraduationCap
                size={24}
              />
            </div>

            <div>
              <h2 className="text-[28px] font-extrabold tracking-[-0.025em] text-[#17202a] md:text-[32px]">
                Upravljanje profesorima
              </h2>

              <p className="mt-2 text-[15px] leading-6 text-[#66717d]">
                Dodajte profesore, upravljajte njihovim
                pristupom aplikaciji i uklonite korisničke
                račune koji više nisu potrebni.
              </p>
            </div>
          </div>
        </section>

        {greska && (
          <div className="mt-6 rounded-[18px] border border-[#f2c7ca] bg-[#fff5f5] px-4 py-4 text-[14px] leading-6 text-[#a71d24]">
            {greska}
          </div>
        )}

        {uspjeh && (
          <div className="mt-6 rounded-[18px] border border-[#cde5d4] bg-[#f2faf4] px-4 py-4 text-[14px] leading-6 text-[#277442]">
            {uspjeh}
          </div>
        )}

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-[24px] border border-[#dfe5ea] bg-white p-5 shadow-[0_6px_20px_rgba(23,50,77,0.04)] lg:sticky lg:top-[96px]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                <Plus
                  size={20}
                />
              </div>

              <div>
                <h2 className="text-[19px] font-bold text-[#17202a]">
                  Novi profesor
                </h2>

                <p className="mt-0.5 text-[13px] text-[#7a8590]">
                  Kreirajte korisnički račun profesora.
                </p>
              </div>
            </div>

            <form
              onSubmit={
                dodajProfesora
              }
              className="mt-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="ime-prezime"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Ime i prezime
                  <span className="ml-1 text-[#c9252d]">
                    *
                  </span>
                </label>

                <input
                  id="ime-prezime"
                  value={
                    imePrezime
                  }
                  onChange={(
                    e
                  ) =>
                    setImePrezime(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="npr. Ana Horvat"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  E-mail
                  <span className="ml-1 text-[#c9252d]">
                    *
                  </span>
                </label>

                <input
                  id="email"
                  type="email"
                  value={
                    email
                  }
                  onChange={(
                    e
                  ) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="ana@email.hr"
                />
              </div>

              <div>
                <label
                  htmlFor="telefon"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Telefon
                </label>

                <input
                  id="telefon"
                  type="tel"
                  value={
                    telefon
                  }
                  onChange={(
                    e
                  ) =>
                    setTelefon(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="npr. 091 123 4567"
                />
              </div>

              <div>
                <label
                  htmlFor="lozinka"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Privremena lozinka
                  <span className="ml-1 text-[#c9252d]">
                    *
                  </span>
                </label>

                <input
                  id="lozinka"
                  type="password"
                  value={
                    lozinka
                  }
                  onChange={(
                    e
                  ) =>
                    setLozinka(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="Najmanje 8 znakova"
                />

                <p className="mt-2 text-[12px] leading-5 text-[#7a8590]">
                  Privremenu lozinku dostavite profesoru
                  sigurnim putem.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  spremanje ||
                  statusUTijeku !==
                    null ||
                  brisanjeUTijeku !==
                    null
                }
                className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#17324d] px-5 text-[15px] font-bold text-white transition hover:bg-[#102437] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {spremanje ? (
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                ) : (
                  <Plus
                    size={19}
                  />
                )}

                {spremanje
                  ? "Dodavanje..."
                  : "Dodaj profesora"}
              </button>
            </form>
          </section>

          <section className="min-w-0">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.09em] text-[#c9252d]">
                  Evidencija
                </p>

                <h2 className="mt-1 text-[22px] font-extrabold text-[#17202a]">
                  Popis profesora
                </h2>
              </div>

              <div className="shrink-0 rounded-xl border border-[#dfe5ea] bg-white px-3 py-2 text-[13px] font-semibold text-[#66717d]">
                Ukupno:{" "}
                <span className="font-bold text-[#17202a]">
                  {
                    profesori.length
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
                    Učitavanje profesora...
                  </p>
                </div>
              </div>
            ) : profesori.length ===
              0 ? (
              <div className="mt-4 rounded-[22px] border border-[#dfe5ea] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <GraduationCap
                    size={22}
                  />
                </div>

                <h3 className="mt-4 text-[19px] font-bold text-[#17202a]">
                  Još nema profesora
                </h3>

                <p className="mt-2 text-[14px] leading-6 text-[#66717d]">
                  Prvog profesora možete dodati pomoću
                  obrasca.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {profesori.map(
                  (
                    profesor
                  ) => (
                    <article
                      key={
                        profesor.id
                      }
                      className="rounded-[22px] border border-[#dfe5ea] bg-white p-5 shadow-[0_5px_18px_rgba(23,50,77,0.035)]"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef3f7] text-[#17324d]">
                            <UserRound
                              size={21}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h3 className="text-[18px] font-bold leading-6 text-[#17202a]">
                                {profesor.ime_prezime ||
                                  "Bez imena"}
                              </h3>

                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                  profesor.aktivan
                                    ? "bg-[#edf7f0] text-[#277442]"
                                    : "bg-[#f0f2f4] text-[#69737c]"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    profesor.aktivan
                                      ? "bg-[#35985a]"
                                      : "bg-[#89929a]"
                                  }`}
                                />

                                {profesor.aktivan
                                  ? "Aktivan"
                                  : "Neaktivan"}
                              </span>
                            </div>

                            {profesor.email && (
                              <a
                                href={`mailto:${profesor.email}`}
                                className="mt-3 flex items-start gap-2 text-[14px] text-[#66717d] transition hover:text-[#c9252d]"
                              >
                                <Mail
                                  size={16}
                                  className="mt-0.5 shrink-0"
                                />

                                <span className="break-all">
                                  {
                                    profesor.email
                                  }
                                </span>
                              </a>
                            )}

                            {profesor.telefon && (
                              <a
                                href={`tel:${profesor.telefon}`}
                                className="mt-2 flex items-center gap-2 text-[14px] text-[#66717d] transition hover:text-[#c9252d]"
                              >
                                <Phone
                                  size={16}
                                  className="shrink-0"
                                />

                                {
                                  profesor.telefon
                                }
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2 border-t border-[#edf0f2] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                          <button
                            type="button"
                            onClick={() =>
                              void promijeniStatus(
                                profesor
                              )
                            }
                            disabled={
                              statusUTijeku !==
                                null ||
                              brisanjeUTijeku !==
                                null
                            }
                            className={`flex min-h-[42px] items-center gap-2 rounded-xl border px-3.5 text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              profesor.aktivan
                                ? "border-[#d6dde3] bg-white text-[#52606d] hover:bg-[#f4f6f8]"
                                : "border-[#cce4d3] bg-white text-[#277442] hover:bg-[#f4fbf6]"
                            }`}
                          >
                            {statusUTijeku ===
                            profesor.id ? (
                              <LoaderCircle
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Power
                                size={16}
                              />
                            )}

                            {statusUTijeku ===
                            profesor.id
                              ? "Spremanje..."
                              : profesor.aktivan
                              ? "Deaktiviraj"
                              : "Aktiviraj"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void obrisiProfesora(
                                profesor
                              )
                            }
                            disabled={
                              brisanjeUTijeku !==
                                null ||
                              statusUTijeku !==
                                null ||
                              spremanje
                            }
                            className="flex min-h-[42px] items-center gap-2 rounded-xl border border-[#efc8cb] bg-white px-3.5 text-[13px] font-bold text-[#b52027] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {brisanjeUTijeku ===
                            profesor.id ? (
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
                            profesor.id
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