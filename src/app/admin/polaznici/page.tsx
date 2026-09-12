"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Skupina = {
  id: string;
  naziv: string;
  status: string;
};

type Polaznik = {
  id: string;
  ime_prezime: string | null;
  email: string | null;
  aktivan: boolean;
};

type Clanstvo = {
  korisnik_id: string;
  skupina_id: string;
  status: string;
};

export default function PolazniciPage() {
  const router = useRouter();

  const [skupine, setSkupine] = useState<Skupina[]>([]);
  const [polaznici, setPolaznici] = useState<Polaznik[]>([]);
  const [clanstva, setClanstva] = useState<Clanstvo[]>([]);

  const [imePrezime, setImePrezime] = useState("");
  const [email, setEmail] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [skupinaId, setSkupinaId] = useState("");

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

    await ucitajPodatke();
  }

  async function ucitajPodatke() {
    setUcitavanje(true);
    setGreska("");

    const [skupineRez, polazniciRez, clanstvaRez] =
      await Promise.all([
        supabase
          .from("obrazovne_skupine")
          .select("id, naziv, status")
          .in("status", ["aktivna", "u_pripremi"])
          .order("naziv"),

        supabase
          .from("profili")
          .select("id, ime_prezime, email, aktivan")
          .eq("uloga", "polaznik")
          .order("ime_prezime"),

        supabase
          .from("clanstva_skupina")
          .select("korisnik_id, skupina_id, status"),
      ]);

    if (skupineRez.error) {
      setGreska("Nije moguće učitati obrazovne skupine.");
    }

    if (polazniciRez.error) {
      setGreska("Nije moguće učitati polaznike.");
    }

    if (clanstvaRez.error) {
      setGreska("Nije moguće učitati članstva skupina.");
    }

    setSkupine(skupineRez.data ?? []);
    setPolaznici(polazniciRez.data ?? []);
    setClanstva(clanstvaRez.data ?? []);

    setUcitavanje(false);
  }

  async function dodajPolaznika(e: FormEvent) {
    e.preventDefault();

    setGreska("");
    setUspjeh("");

    if (!imePrezime.trim()) {
      setGreska("Ime i prezime su obavezni.");
      return;
    }

    if (!email.trim()) {
      setGreska("E-mail je obavezan.");
      return;
    }

    if (lozinka.length < 8) {
      setGreska("Privremena lozinka mora imati najmanje 8 znakova.");
      return;
    }

    if (!skupinaId) {
      setGreska("Odaberite obrazovnu skupinu.");
      return;
    }

    setSpremanje(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setGreska("Vaša prijava je istekla. Prijavite se ponovno.");
      setSpremanje(false);
      return;
    }

    const odgovor = await fetch("/api/admin/polaznici", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        ime_prezime: imePrezime.trim(),
        email: email.trim(),
        lozinka,
        skupina_id: skupinaId,
      }),
    });

    const rezultat = await odgovor.json();

    if (!odgovor.ok) {
      setGreska(
        rezultat.error ?? "Polaznika nije moguće dodati."
      );
      setSpremanje(false);
      return;
    }

    setImePrezime("");
    setEmail("");
    setLozinka("");
    setSkupinaId("");

    setUspjeh("Polaznik je uspješno dodan.");

    await ucitajPodatke();

    setSpremanje(false);
  }

  function nazivSkupineZaPolaznika(korisnikId: string) {
    const clanstvo = clanstva.find(
      (c) =>
        c.korisnik_id === korisnikId &&
        c.status === "aktivan"
    );

    if (!clanstvo) {
      return "Nije raspoređen";
    }

    const skupina = skupine.find(
      (s) => s.id === clanstvo.skupina_id
    );

    return skupina?.naziv ?? "Nepoznata skupina";
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
        <h1 className="text-3xl font-bold text-neutral-900">
          Polaznici
        </h1>

        <p className="mt-2 text-neutral-500">
          Dodavanje polaznika i raspoređivanje u obrazovne skupine
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">
              Novi polaznik
            </h2>

            <form
              onSubmit={dodajPolaznika}
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
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-red-600"
                  placeholder="npr. Ivan Horvat"
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
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-red-600"
                  placeholder="ivan@email.hr"
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
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-red-600"
                  placeholder="Najmanje 8 znakova"
                />

                <p className="mt-2 text-xs text-neutral-500">
                  Za test koristimo privremenu lozinku. Kasnije
                  ćemo napraviti sigurniji sustav pozivnice i
                  postavljanja vlastite lozinke.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Obrazovna skupina *
                </label>

                <select
                  value={skupinaId}
                  onChange={(e) =>
                    setSkupinaId(e.target.value)
                  }
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-red-600"
                >
                  <option value="">
                    Odaberite skupinu
                  </option>

                  {skupine.map((skupina) => (
                    <option
                      key={skupina.id}
                      value={skupina.id}
                    >
                      {skupina.naziv}
                    </option>
                  ))}
                </select>
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
                className="w-full rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-50"
              >
                {spremanje
                  ? "Dodavanje..."
                  : "Dodaj polaznika"}
              </button>
            </form>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                Popis polaznika
              </h2>

              <span className="text-sm text-neutral-500">
                Ukupno: {polaznici.length}
              </span>
            </div>

            {ucitavanje ? (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                Učitavanje...
              </div>
            ) : polaznici.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-neutral-500 shadow-sm">
                Još nema polaznika.
              </div>
            ) : (
              <div className="space-y-3">
                {polaznici.map((polaznik) => (
                  <div
                    key={polaznik.id}
                    className="rounded-2xl bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold">
                            {polaznik.ime_prezime ||
                              "Bez imena"}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              polaznik.aktivan
                                ? "bg-green-100 text-green-700"
                                : "bg-neutral-200 text-neutral-600"
                            }`}
                          >
                            {polaznik.aktivan
                              ? "Aktivan"
                              : "Neaktivan"}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-neutral-500">
                          {polaznik.email}
                        </p>

                        <p className="mt-3 text-sm">
                          <span className="font-semibold">
                            Skupina:
                          </span>{" "}
                          {nazivSkupineZaPolaznika(
                            polaznik.id
                          )}
                        </p>
                      </div>

                      <button
                        className="h-fit rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold"
                        disabled
                      >
                        Detalji
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