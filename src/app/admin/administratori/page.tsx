"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserCog,
  UserPlus,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Administrator = {
  id: string;
  ime_prezime: string | null;
  email: string | null;
  aktivan: boolean;
  created_at: string | null;
};

type ApiOdgovor = {
  success?: boolean;
  message?: string;
  error?: string;
};

async function procitajApiOdgovor(
  response: Response
): Promise<ApiOdgovor> {
  const tekst = await response.text();

  if (!tekst) {
    return {};
  }

  try {
    return JSON.parse(tekst) as ApiOdgovor;
  } catch {
    return {
      error:
        "Poslužitelj je vratio neočekivani odgovor.",
    };
  }
}

export default function AdministratoriPage() {
  const router = useRouter();

  const [administratori, setAdministratori] = useState<
    Administrator[]
  >([]);

  const [trenutniKorisnikId, setTrenutniKorisnikId] =
    useState<string | null>(null);

  const [imePrezime, setImePrezime] = useState("");
  const [email, setEmail] = useState("");

  const [ucitavanje, setUcitavanje] = useState(true);
  const [spremanje, setSpremanje] = useState(false);
  const [akcijaId, setAkcijaId] = useState<
    string | null
  >(null);

  const [poruka, setPoruka] = useState("");
  const [greska, setGreska] = useState("");

  const dohvatiAccessToken = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      return null;
    }

    return session.access_token;
  }, []);

  const ucitajAdministratore = useCallback(async () => {
    setUcitavanje(true);
    setGreska("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      setTrenutniKorisnikId(user.id);

      const {
        data: mojProfil,
        error: mojProfilError,
      } = await supabase
        .from("profili")
        .select("id, uloga, aktivan")
        .eq("id", user.id)
        .maybeSingle();

      if (
        mojProfilError ||
        !mojProfil ||
        mojProfil.uloga !== "administrator" ||
        mojProfil.aktivan !== true
      ) {
        router.replace("/login");
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("profili")
        .select(
          "id, ime_prezime, email, aktivan, created_at"
        )
        .eq("uloga", "administrator")
        .order("ime_prezime", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setAdministratori(
        (data ?? []) as Administrator[]
      );
    } catch (error) {
      console.error(
        "Greška pri učitavanju administratora:",
        error
      );

      setGreska(
        "Nije moguće učitati administratore."
      );
    } finally {
      setUcitavanje(false);
    }
  }, [router]);

  useEffect(() => {
    void ucitajAdministratore();
  }, [ucitajAdministratore]);

  async function dodajAdministratora(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPoruka("");
    setGreska("");

    const cistoIme = imePrezime.trim();
    const cistiEmail = email
      .trim()
      .toLowerCase();

    if (!cistoIme) {
      setGreska(
        "Unesite ime i prezime administratora."
      );
      return;
    }

    if (!cistiEmail) {
      setGreska(
        "Unesite e-mail administratora."
      );
      return;
    }

    setSpremanje(true);

    try {
      const accessToken =
        await dohvatiAccessToken();

      if (!accessToken) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        "/api/admin/administratori",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ime_prezime: cistoIme,
            email: cistiEmail,
          }),
        }
      );

      const rezultat =
        await procitajApiOdgovor(response);

      if (!response.ok) {
        throw new Error(
          rezultat.error ||
            "Administrator nije dodan."
        );
      }

      setImePrezime("");
      setEmail("");

      setPoruka(
        rezultat.message ||
          "Administrator je dodan i pozivnica je poslana."
      );

      await ucitajAdministratore();
    } catch (error) {
      setGreska(
        error instanceof Error
          ? error.message
          : "Dogodila se greška pri dodavanju administratora."
      );
    } finally {
      setSpremanje(false);
    }
  }

  async function promijeniStatus(
    administrator: Administrator
  ) {
    setPoruka("");
    setGreska("");

    const noviStatus =
      !administrator.aktivan;

    const potvrda = window.confirm(
      noviStatus
        ? `Želite li aktivirati administratora "${
            administrator.ime_prezime ||
            administrator.email ||
            "Administrator"
          }"?`
        : `Želite li deaktivirati administratora "${
            administrator.ime_prezime ||
            administrator.email ||
            "Administrator"
          }"? Deaktivirani administrator neće se moći prijaviti u administraciju.`
    );

    if (!potvrda) {
      return;
    }

    setAkcijaId(administrator.id);

    try {
      const accessToken =
        await dohvatiAccessToken();

      if (!accessToken) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        "/api/admin/administratori/status",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            administrator_id:
              administrator.id,
            aktivan: noviStatus,
          }),
        }
      );

      const rezultat =
        await procitajApiOdgovor(response);

      if (!response.ok) {
        throw new Error(
          rezultat.error ||
            "Status administratora nije promijenjen."
        );
      }

      setPoruka(
        rezultat.message ||
          (noviStatus
            ? "Administrator je aktiviran."
            : "Administrator je deaktiviran.")
      );

      await ucitajAdministratore();
    } catch (error) {
      setGreska(
        error instanceof Error
          ? error.message
          : "Dogodila se greška pri promjeni statusa administratora."
      );
    } finally {
      setAkcijaId(null);
    }
  }

  async function obrisiAdministratora(
    administrator: Administrator
  ) {
    setPoruka("");
    setGreska("");

    const naziv =
      administrator.ime_prezime ||
      administrator.email ||
      "Administrator";

    const potvrda = window.confirm(
      `Želite li trajno obrisati administratora "${naziv}"?\n\nAko administrator ima povezane povijesne podatke, sustav će spriječiti brisanje i predložiti deaktivaciju.`
    );

    if (!potvrda) {
      return;
    }

    setAkcijaId(administrator.id);

    try {
      const accessToken =
        await dohvatiAccessToken();

      if (!accessToken) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        "/api/admin/administratori/obrisi",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            administrator_id:
              administrator.id,
          }),
        }
      );

      const rezultat =
        await procitajApiOdgovor(response);

      if (!response.ok) {
        throw new Error(
          rezultat.error ||
            "Administrator nije obrisan."
        );
      }

      setPoruka(
        rezultat.message ||
          "Administrator je obrisan."
      );

      await ucitajAdministratore();
    } catch (error) {
      setGreska(
        error instanceof Error
          ? error.message
          : "Dogodila se greška pri brisanju administratora."
      );
    } finally {
      setAkcijaId(null);
    }
  }

  const brojAktivnih =
    administratori.filter(
      (administrator) => administrator.aktivan
    ).length;

  const brojNeaktivnih =
    administratori.length - brojAktivnih;

  return (
    <main className="min-h-screen bg-[#f4f6f8] px-4 py-6 text-[#17202a] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#66717d] transition hover:text-[#17324d]"
          >
            <ArrowLeft className="h-4 w-4" />
            Natrag na administraciju
          </Link>
        </div>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#17324d] text-white">
                <UserCog className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#c9252d]">
                  Učilište Maestro
                </p>

                <h1 className="text-2xl font-bold text-[#102437] sm:text-3xl">
                  Administratori
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-[#66717d]">
              Dodajte osobe koje smiju
              upravljati aplikacijom. Novi
              administrator dobit će e-mail
              pozivnicu i sam postaviti svoju
              lozinku.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void ucitajAdministratore()
            }
            disabled={ucitavanje}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d7dde3] bg-white px-4 py-2.5 text-sm font-semibold text-[#17324d] shadow-sm transition hover:bg-[#f8fafb] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                ucitavanje
                  ? "animate-spin"
                  : ""
              }`}
            />
            Osvježi
          </button>
        </div>

        {poruka && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{poruka}</span>
          </div>
        )}

        {greska && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{greska}</span>
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e2e7ec] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#66717d]">
              Ukupno administratora
            </p>

            <p className="mt-2 text-3xl font-bold text-[#102437]">
              {administratori.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e2e7ec] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#66717d]">
              Aktivni
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {brojAktivnih}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e2e7ec] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#66717d]">
              Neaktivni
            </p>

            <p className="mt-2 text-3xl font-bold text-[#66717d]">
              {brojNeaktivnih}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <section className="self-start rounded-2xl border border-[#e2e7ec] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#c9252d]" />

                <h2 className="text-lg font-bold text-[#102437]">
                  Dodaj administratora
                </h2>
              </div>

              <p className="text-sm leading-6 text-[#66717d]">
                Administratoru će biti
                poslana pozivnica na e-mail.
                Lozinku postavlja sam.
              </p>
            </div>

            <form
              onSubmit={dodajAdministratora}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="ime_prezime"
                  className="mb-1.5 block text-sm font-semibold text-[#17324d]"
                >
                  Ime i prezime
                </label>

                <input
                  id="ime_prezime"
                  type="text"
                  value={imePrezime}
                  onChange={(event) =>
                    setImePrezime(
                      event.target.value
                    )
                  }
                  placeholder="npr. Ivan Horvat"
                  autoComplete="name"
                  disabled={spremanje}
                  className="w-full rounded-xl border border-[#d7dde3] bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-[#9aa3ac] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10 disabled:bg-[#f4f6f8]"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-semibold text-[#17324d]"
                >
                  E-mail
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#89939d]" />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="ime@primjer.hr"
                    autoComplete="email"
                    disabled={spremanje}
                    className="w-full rounded-xl border border-[#d7dde3] bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-[#9aa3ac] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10 disabled:bg-[#f4f6f8]"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-[#f4f6f8] p-3 text-xs leading-5 text-[#66717d]">
                Novi administrator ima pristup
                cjelokupnoj administraciji
                Učilišta Maestro. Dodajte samo
                osobe kojima želite dati pune
                administratorske ovlasti.
              </div>

              <button
                type="submit"
                disabled={spremanje}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17324d] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#102437] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {spremanje ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Slanje pozivnice...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Dodaj i pošalji pozivnicu
                  </>
                )}
              </button>
            </form>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#e2e7ec] bg-white shadow-sm">
            <div className="border-b border-[#e2e7ec] px-5 py-5 sm:px-6">
              <h2 className="text-lg font-bold text-[#102437]">
                Popis administratora
              </h2>

              <p className="mt-1 text-sm text-[#66717d]">
                Aktivirajte, deaktivirajte ili
                uklonite administratorske
                račune.
              </p>
            </div>

            {ucitavanje ? (
              <div className="flex min-h-48 items-center justify-center p-8">
                <div className="flex items-center gap-3 text-sm text-[#66717d]">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Učitavanje administratora...
                </div>
              </div>
            ) : administratori.length === 0 ? (
              <div className="p-8 text-center">
                <UserCog className="mx-auto mb-3 h-10 w-10 text-[#a6afb8]" />

                <p className="font-semibold text-[#17324d]">
                  Nema administratora za
                  prikaz.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#e2e7ec]">
                {administratori.map(
                  (administrator) => {
                    const mojRacun =
                      administrator.id ===
                      trenutniKorisnikId;

                    const akcijaUTijeku =
                      akcijaId ===
                      administrator.id;

                    return (
                      <div
                        key={administrator.id}
                        className="p-5 sm:p-6"
                      >
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-bold text-[#102437]">
                                {administrator.ime_prezime ||
                                  "Administrator"}
                              </h3>

                              {mojRacun && (
                                <span className="rounded-full bg-[#17324d]/10 px-2.5 py-1 text-xs font-bold text-[#17324d]">
                                  Vi
                                </span>
                              )}

                              {administrator.aktivan ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  Aktivan
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f3f5] px-2.5 py-1 text-xs font-bold text-[#66717d]">
                                  <ShieldOff className="h-3.5 w-3.5" />
                                  Neaktivan
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex items-center gap-2 text-sm text-[#66717d]">
                              <Mail className="h-4 w-4 shrink-0" />

                              <span className="truncate">
                                {administrator.email ||
                                  "E-mail nije upisan"}
                              </span>
                            </div>

                            {administrator.created_at && (
                              <p className="mt-2 text-xs text-[#89939d]">
                                Kreiran:{" "}
                                {new Intl.DateTimeFormat(
                                  "hr-HR",
                                  {
                                    day: "2-digit",
                                    month:
                                      "2-digit",
                                    year: "numeric",
                                  }
                                ).format(
                                  new Date(
                                    administrator.created_at
                                  )
                                )}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              type="button"
                              disabled={
                                akcijaUTijeku ||
                                mojRacun
                              }
                              onClick={() =>
                                void promijeniStatus(
                                  administrator
                                )
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d7dde3] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#17324d] transition hover:bg-[#f8fafb] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {akcijaUTijeku ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : administrator.aktivan ? (
                                <ShieldOff className="h-4 w-4" />
                              ) : (
                                <ShieldCheck className="h-4 w-4" />
                              )}

                              {administrator.aktivan
                                ? "Deaktiviraj"
                                : "Aktiviraj"}
                            </button>

                            <button
                              type="button"
                              disabled={
                                akcijaUTijeku ||
                                mojRacun
                              }
                              onClick={() =>
                                void obrisiAdministratora(
                                  administrator
                                )
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#c9252d] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {akcijaUTijeku ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}

                              Obriši
                            </button>
                          </div>
                        </div>

                        {mojRacun && (
                          <p className="mt-3 text-xs leading-5 text-[#66717d]">
                            Vlastiti račun ne
                            možete deaktivirati
                            niti obrisati iz ovog
                            modula.
                          </p>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}