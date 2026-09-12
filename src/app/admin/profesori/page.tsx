"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profesor = {
  id: string;
  ime_prezime: string | null;
  email: string | null;
  telefon: string | null;
  aktivan: boolean;
};

export default function ProfesoriPage() {
  const router = useRouter();

  const [profesori, setProfesori] = useState<Profesor[]>([]);
  const [imePrezime, setImePrezime] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [lozinka, setLozinka] = useState("");

  const [ucitavanje, setUcitavanje] = useState(true);
  const [spremanje, setSpremanje] = useState(false);
  const [greska, setGreska] = useState("");
  const [uspjeh, setUspjeh] = useState("");

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

    const { data: profil } = await supabase
      .from("profili")
      .select("uloga, aktivan")
      .eq("id", user.id)
      .single();

    if (
      !profil ||
      profil.uloga !== "administrator" ||
      profil.aktivan !== true
    ) {
      router.replace("/");
      return;
    }

    await ucitajProfesore();
  }

  async function ucitajProfesore() {
    setUcitavanje(true);

    const { data, error } = await supabase
      .from("profili")
      .select("id, ime_prezime, email, telefon, aktivan")
      .eq("uloga", "profesor")
      .order("ime_prezime");

    if (error) {
      setGreska("Nije moguće učitati profesore.");
    } else {
      setProfesori(data ?? []);
    }

    setUcitavanje(false);
  }

  async function dodajProfesora(e: FormEvent) {
    e.preventDefault();

    setGreska("");
    setUspjeh("");

    if (!imePrezime.trim() || !email.trim()) {
      setGreska("Ime i e-mail su obavezni.");
      return;
    }

    if (lozinka.length < 8) {
      setGreska("Lozinka mora imati najmanje 8 znakova.");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setGreska("Prijava je istekla.");
      return;
    }

    setSpremanje(true);

    const odgovor = await fetch("/api/admin/profesori", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        ime_prezime: imePrezime,
        email,
        telefon,
        lozinka,
      }),
    });

    const rezultat = await odgovor.json();

    if (!odgovor.ok) {
      setGreska(
        rezultat.error ?? "Profesora nije moguće dodati."
      );
      setSpremanje(false);
      return;
    }

    setImePrezime("");
    setEmail("");
    setTelefon("");
    setLozinka("");

    setUspjeh("Profesor je uspješno dodan.");

    await ucitajProfesore();

    setSpremanje(false);
  }

  async function promijeniStatus(profesor: Profesor) {
    const { error } = await supabase
      .from("profili")
      .update({
        aktivan: !profesor.aktivan,
      })
      .eq("id", profesor.id);

    if (error) {
      setGreska("Status profesora nije moguće promijeniti.");
      return;
    }

    await ucitajProfesore();
  }

  return (
    <main className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-2xl font-black text-red-600">
              MAESTRO
            </div>
            <div className="text-xs text-neutral-500">
              Administracija
            </div>
          </div>

          <button
            onClick={() => router.push("/admin")}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold"
          >
            ← Natrag
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-3xl font-bold">
          Profesori
        </h1>

        <p className="mt-2 text-neutral-500">
          Upravljanje profesorima i predavačima
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">
              Novi profesor
            </h2>

            <form
              onSubmit={dodajProfesora}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Ime i prezime *
                </label>

                <input
                  value={imePrezime}
                  onChange={(e) =>
                    setImePrezime(e.target.value)
                  }
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  E-mail *
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Telefon
                </label>

                <input
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Privremena lozinka *
                </label>

                <input
                  type="password"
                  value={lozinka}
                  onChange={(e) => setLozinka(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  placeholder="Najmanje 8 znakova"
                />
              </div>

              {greska && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {greska}
                </div>
              )}

              {uspjeh && (
                <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
                  {uspjeh}
                </div>
              )}

              <button
                disabled={spremanje}
                className="w-full rounded-xl bg-red-600 px-5 py-3 font-bold text-white"
              >
                {spremanje
                  ? "Dodavanje..."
                  : "Dodaj profesora"}
              </button>
            </form>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                Popis profesora
              </h2>

              <span className="text-sm text-neutral-500">
                Ukupno: {profesori.length}
              </span>
            </div>

            {ucitavanje ? (
              <div className="rounded-2xl bg-white p-6">
                Učitavanje...
              </div>
            ) : profesori.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-neutral-500">
                Još nema profesora.
              </div>
            ) : (
              <div className="space-y-3">
                {profesori.map((profesor) => (
                  <div
                    key={profesor.id}
                    className="rounded-2xl bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold">
                            {profesor.ime_prezime}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
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

                        <p className="mt-2 text-sm text-neutral-500">
                          {profesor.email}
                        </p>

                        {profesor.telefon && (
                          <p className="mt-1 text-sm text-neutral-500">
                            {profesor.telefon}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          promijeniStatus(profesor)
                        }
                        className="h-fit rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold"
                      >
                        {profesor.aktivan
                          ? "Deaktiviraj"
                          : "Aktiviraj"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}