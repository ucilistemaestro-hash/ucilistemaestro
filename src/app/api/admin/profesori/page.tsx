"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Eye,
  EyeOff,
  KeyRound,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Profesor = {
  id: string;
  ime_prezime: string | null;
  email: string | null;
  telefon: string | null;
  aktivan: boolean;
  created_at: string;
};

export default function ProfesoriPage() {
  const router = useRouter();

  const [profesori, setProfesori] =
    useState<Profesor[]>([]);

  const [ucitavanje, setUcitavanje] =
    useState(true);

  const [spremanje, setSpremanje] =
    useState(false);

  const [greska, setGreska] =
    useState("");

  const [uspjeh, setUspjeh] =
    useState("");

  /*
    Novi profesor
  */
  const [imePrezime, setImePrezime] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [telefon, setTelefon] =
    useState("");

  const [lozinka, setLozinka] =
    useState("");

  const [
    prikaziLozinkuNovog,
    setPrikaziLozinkuNovog,
  ] = useState(false);

  /*
    Promjena lozinke
  */
  const [
    profesorZaLozinku,
    setProfesorZaLozinku,
  ] = useState<Profesor | null>(null);

  const [
    novaLozinka,
    setNovaLozinka,
  ] = useState("");

  const [
    ponoviLozinku,
    setPonoviLozinku,
  ] = useState("");

  const [
    prikaziNovuLozinku,
    setPrikaziNovuLozinku,
  ] = useState(false);

  const [
    mijenjanjeLozinke,
    setMijenjanjeLozinke,
  ] = useState(false);

  useEffect(() => {
    provjeriPristup();
  }, []);

  async function provjeriPristup() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const {
      data: profil,
      error,
    } = await supabase
      .from("profili")
      .select("uloga, aktivan")
      .eq("id", user.id)
      .single();

    if (
      error ||
      !profil ||
      profil.uloga !== "administrator" ||
      profil.aktivan !== true
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
        "id, ime_prezime, email, telefon, aktivan, created_at"
      )
      .eq("uloga", "profesor")
      .order("ime_prezime", {
        ascending: true,
      });

    if (error) {
      setGreska(
        "Nije moguće učitati profesore: " +
          error.message
      );

      setUcitavanje(false);
      return;
    }

    setProfesori(data ?? []);
    setUcitavanje(false);
  }

  async function dodajProfesora(
    e: FormEvent
  ) {
    e.preventDefault();

    setGreska("");
    setUspjeh("");

    if (
      !imePrezime.trim() ||
      !email.trim() ||
      !lozinka
    ) {
      setGreska(
        "Ime i prezime, e-mail i privremena lozinka su obavezni."
      );
      return;
    }

    if (lozinka.length < 8) {
      setGreska(
        "Privremena lozinka mora imati najmanje 8 znakova."
      );
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setGreska(
        "Prijava je istekla. Prijavite se ponovno."
      );
      return;
    }

    setSpremanje(true);

    try {
      const response = await fetch(
        "/api/admin/profesori",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            ime_prezime:
              imePrezime.trim(),

            email:
              email.trim(),

            telefon:
              telefon.trim() || null,

            /*
              Šaljemo ista značenja pod više
              naziva kako bi ostalo kompatibilno
              s postojećim API-jem.
            */
            lozinka,
            privremena_lozinka:
              lozinka,
            password:
              lozinka,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGreska(
          data.error ||
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
      console.error(error);

      setGreska(
        "Došlo je do greške kod dodavanja profesora."
      );
    } finally {
      setSpremanje(false);
    }
  }

  async function promijeniStatus(
    profesor: Profesor
  ) {
    setGreska("");
    setUspjeh("");

    const {
      error,
    } = await supabase
      .from("profili")
      .update({
        aktivan:
          !profesor.aktivan,
      })
      .eq("id", profesor.id);

    if (error) {
      setGreska(
        "Status profesora nije moguće promijeniti."
      );
      return;
    }

    setUspjeh(
      profesor.aktivan
        ? "Profesor je deaktiviran."
        : "Profesor je aktiviran."
    );

    await ucitajProfesore();
  }

  function otvoriPromjenuLozinke(
    profesor: Profesor
  ) {
    setProfesorZaLozinku(
      profesor
    );

    setNovaLozinka("");
    setPonoviLozinku("");
    setPrikaziNovuLozinku(false);
    setGreska("");
    setUspjeh("");
  }

  function zatvoriPromjenuLozinke() {
    setProfesorZaLozinku(null);
    setNovaLozinka("");
    setPonoviLozinku("");
    setPrikaziNovuLozinku(false);
  }

  async function promijeniLozinku(
    e: FormEvent
  ) {
    e.preventDefault();

    setGreska("");
    setUspjeh("");

    if (!profesorZaLozinku) {
      return;
    }

    if (
      novaLozinka.length < 8
    ) {
      setGreska(
        "Nova lozinka mora imati najmanje 8 znakova."
      );
      return;
    }

    if (
      novaLozinka !== ponoviLozinku
    ) {
      setGreska(
        "Lozinke se ne podudaraju."
      );
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setGreska(
        "Prijava je istekla. Prijavite se ponovno."
      );
      return;
    }

    setMijenjanjeLozinke(true);

    try {
      const response = await fetch(
        "/api/admin/profesori/lozinka",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            profesor_id:
              profesorZaLozinku.id,

            nova_lozinka:
              novaLozinka,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setGreska(
          data.error ||
            "Lozinku nije moguće promijeniti."
        );
        return;
      }

      const ime =
        profesorZaLozinku.ime_prezime ||
        profesorZaLozinku.email ||
        "profesora";

      zatvoriPromjenuLozinke();

      setUspjeh(
        `Nova lozinka za ${ime} je uspješno postavljena.`
      );
    } catch (error) {
      console.error(error);

      setGreska(
        "Došlo je do greške kod promjene lozinke."
      );
    } finally {
      setMijenjanjeLozinke(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f6f8]">
      <header className="border-b border-[#e2e7ec] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-2xl font-black text-[#c9252d]">
              MAESTRO
            </div>

            <div className="mt-1 text-sm text-[#66717d]">
              Administracija
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/admin")
            }
            className="rounded-xl border border-[#d7dde3] bg-white px-4 py-2.5 text-sm font-bold text-[#17324d]"
          >
            ← Natrag
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[#c9252d]">
            Korisnici
          </p>

          <h1 className="mt-1 text-3xl font-extrabold text-[#17202a]">
            Profesori
          </h1>

          <p className="mt-2 text-[#66717d]">
            Dodavanje profesora, upravljanje pristupom
            i promjena privremenih lozinki.
          </p>
        </div>

        {greska && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {greska}
          </div>
        )}

        {uspjeh && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {uspjeh}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[400px_1fr]">
          <section className="h-fit rounded-2xl border border-[#e0e5e9] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                <UserPlus size={21} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#17202a]">
                  Novi profesor
                </h2>

                <p className="text-sm text-[#66717d]">
                  Otvorite novi korisnički račun.
                </p>
              </div>
            </div>

            <form
              onSubmit={
                dodajProfesora
              }
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-bold text-[#28333e]">
                  Ime i prezime *
                </label>

                <input
                  value={
                    imePrezime
                  }
                  onChange={(e) =>
                    setImePrezime(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#d7dde3] px-4 py-3 outline-none focus:border-[#17324d]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#28333e]">
                  E-mail *
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#d7dde3] px-4 py-3 outline-none focus:border-[#17324d]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#28333e]">
                  Telefon
                </label>

                <input
                  value={telefon}
                  onChange={(e) =>
                    setTelefon(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#d7dde3] px-4 py-3 outline-none focus:border-[#17324d]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#28333e]">
                  Privremena lozinka *
                </label>

                <div className="relative">
                  <input
                    type={
                      prikaziLozinkuNovog
                        ? "text"
                        : "password"
                    }
                    value={
                      lozinka
                    }
                    onChange={(e) =>
                      setLozinka(
                        e.target.value
                      )
                    }
                    minLength={8}
                    className="w-full rounded-xl border border-[#d7dde3] px-4 py-3 pr-12 outline-none focus:border-[#17324d]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setPrikaziLozinkuNovog(
                        (vrijednost) =>
                          !vrijednost
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66717d]"
                  >
                    {prikaziLozinkuNovog ? (
                      <EyeOff
                        size={20}
                      />
                    ) : (
                      <Eye
                        size={20}
                      />
                    )}
                  </button>
                </div>

                <p className="mt-2 text-xs text-[#7b858f]">
                  Najmanje 8 znakova.
                </p>
              </div>

              <button
                disabled={
                  spremanje
                }
                className="min-h-[50px] w-full rounded-xl bg-[#17324d] px-5 font-bold text-white disabled:opacity-50"
              >
                {spremanje
                  ? "Dodavanje..."
                  : "Dodaj profesora"}
              </button>
            </form>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <Users size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#17202a]">
                    Profesori
                  </h2>

                  <p className="text-sm text-[#66717d]">
                    Ukupno:{" "}
                    {profesori.length}
                  </p>
                </div>
              </div>
            </div>

            {ucitavanje ? (
              <div className="rounded-2xl border border-[#e0e5e9] bg-white p-6">
                Učitavanje...
              </div>
            ) : profesori.length ===
              0 ? (
              <div className="rounded-2xl border border-[#e0e5e9] bg-white p-6 text-[#66717d]">
                Još nema profesora.
              </div>
            ) : (
              <div className="space-y-3">
                {profesori.map(
                  (profesor) => (
                    <article
                      key={
                        profesor.id
                      }
                      className="rounded-2xl border border-[#e0e5e9] bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-bold text-[#17202a]">
                              {profesor.ime_prezime ||
                                "Profesor"}
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                profesor.aktivan
                                  ? "bg-green-100 text-green-700"
                                  : "bg-neutral-200 text-neutral-600"
                              }`}
                            >
                              {profesor.aktivan
                                ? "Aktivan"
                                : "Neaktivan"}
                            </span>
                          </div>

                          <p className="mt-2 break-all text-sm text-[#66717d]">
                            {profesor.email ||
                              "E-mail nije upisan"}
                          </p>

                          {profesor.telefon && (
                            <p className="mt-1 text-sm text-[#66717d]">
                              {
                                profesor.telefon
                              }
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              otvoriPromjenuLozinke(
                                profesor
                              )
                            }
                            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#17324d] px-4 text-sm font-bold text-white"
                          >
                            <KeyRound
                              size={17}
                            />
                            Nova lozinka
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              promijeniStatus(
                                profesor
                              )
                            }
                            className={`min-h-[44px] rounded-xl border px-4 text-sm font-bold ${
                              profesor.aktivan
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-green-200 bg-green-50 text-green-700"
                            }`}
                          >
                            {profesor.aktivan
                              ? "Deaktiviraj"
                              : "Aktiviraj"}
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

      {profesorZaLozinku && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <section className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <KeyRound size={22} />
                </div>

                <h2 className="mt-4 text-2xl font-extrabold text-[#17202a]">
                  Nova lozinka
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#66717d]">
                  Profesor:{" "}
                  <strong>
                    {profesorZaLozinku.ime_prezime ||
                      profesorZaLozinku.email}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                onClick={
                  zatvoriPromjenuLozinke
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f6f8] text-[#66717d]"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                promijeniLozinku
              }
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-bold text-[#28333e]">
                  Nova lozinka *
                </label>

                <div className="relative">
                  <input
                    type={
                      prikaziNovuLozinku
                        ? "text"
                        : "password"
                    }
                    value={
                      novaLozinka
                    }
                    onChange={(e) =>
                      setNovaLozinka(
                        e.target.value
                      )
                    }
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-[#d7dde3] px-4 py-3 pr-12 outline-none focus:border-[#17324d]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setPrikaziNovuLozinku(
                        (vrijednost) =>
                          !vrijednost
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66717d]"
                  >
                    {prikaziNovuLozinku ? (
                      <EyeOff
                        size={20}
                      />
                    ) : (
                      <Eye
                        size={20}
                      />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#28333e]">
                  Ponovite novu lozinku *
                </label>

                <input
                  type="password"
                  value={
                    ponoviLozinku
                  }
                  onChange={(e) =>
                    setPonoviLozinku(
                      e.target.value
                    )
                  }
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-[#d7dde3] px-4 py-3 outline-none focus:border-[#17324d]"
                />
              </div>

              <div className="rounded-xl bg-[#f4f6f8] p-4 text-sm leading-6 text-[#66717d]">
                Nakon spremanja profesor se može prijaviti
                novom lozinkom. Staru lozinku više ne mora
                znati.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={
                    zatvoriPromjenuLozinke
                  }
                  className="min-h-[50px] flex-1 rounded-xl border border-[#d7dde3] bg-white font-bold text-[#4f5b66]"
                >
                  Odustani
                </button>

                <button
                  disabled={
                    mijenjanjeLozinke
                  }
                  className="min-h-[50px] flex-1 rounded-xl bg-[#17324d] font-bold text-white disabled:opacity-50"
                >
                  {mijenjanjeLozinke
                    ? "Spremanje..."
                    : "Spremi lozinku"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}