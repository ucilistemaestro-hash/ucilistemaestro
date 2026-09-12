"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Skupina = {
  id: string;
  naziv: string;
};

type Profesor = {
  id: string;
  ime_prezime: string | null;
};

type Ucionica = {
  id: string;
  naziv: string;
};

type Predavanje = {
  id: string;
  skupina_id: string;
  profesor_id: string;
  ucionica_id: string | null;
  naziv: string;
  datum: string;
  vrijeme_pocetka: string;
  vrijeme_zavrsetka: string;
  napomena: string | null;
  status: string;
};

export default function RasporedPage() {
  const router = useRouter();

  const [skupine, setSkupine] = useState<Skupina[]>([]);
  const [profesori, setProfesori] = useState<Profesor[]>([]);
  const [ucionice, setUcionice] = useState<Ucionica[]>([]);
  const [predavanja, setPredavanja] = useState<Predavanje[]>([]);

  const [naziv, setNaziv] = useState("");
  const [skupinaId, setSkupinaId] = useState("");
  const [profesorId, setProfesorId] = useState("");
  const [ucionicaId, setUcionicaId] = useState("");
  const [datum, setDatum] = useState("");
  const [pocetak, setPocetak] = useState("");
  const [zavrsetak, setZavrsetak] = useState("");
  const [napomena, setNapomena] = useState("");

  const [greska, setGreska] = useState("");
  const [uspjeh, setUspjeh] = useState("");
  const [spremanje, setSpremanje] = useState(false);
  const [ucitavanje, setUcitavanje] = useState(true);

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

    const [
      skupineRez,
      profesoriRez,
      ucioniceRez,
      predavanjaRez,
    ] = await Promise.all([
      supabase
        .from("obrazovne_skupine")
        .select("id, naziv")
        .eq("status", "aktivna")
        .order("naziv"),

      supabase
        .from("profili")
        .select("id, ime_prezime")
        .eq("uloga", "profesor")
        .eq("aktivan", true)
        .order("ime_prezime"),

      supabase
        .from("ucionice")
        .select("id, naziv")
        .eq("aktivna", true)
        .order("naziv"),

      supabase
        .from("predavanja")
        .select(
          "id, skupina_id, profesor_id, ucionica_id, naziv, datum, vrijeme_pocetka, vrijeme_zavrsetka, napomena, status"
        )
        .order("datum", { ascending: true })
        .order("vrijeme_pocetka", { ascending: true }),
    ]);

    setSkupine(skupineRez.data ?? []);
    setProfesori(profesoriRez.data ?? []);
    setUcionice(ucioniceRez.data ?? []);
    setPredavanja(predavanjaRez.data ?? []);

    setUcitavanje(false);
  }

  async function spremiPredavanje(e: FormEvent) {
    e.preventDefault();

    setGreska("");
    setUspjeh("");

    if (
      !naziv.trim() ||
      !skupinaId ||
      !profesorId ||
      !datum ||
      !pocetak ||
      !zavrsetak
    ) {
      setGreska("Popunite sva obavezna polja.");
      return;
    }

    if (zavrsetak <= pocetak) {
      setGreska("Vrijeme završetka mora biti nakon početka.");
      return;
    }

    setSpremanje(true);

    const { error } = await supabase
      .from("predavanja")
      .insert({
        naziv: naziv.trim(),
        skupina_id: skupinaId,
        profesor_id: profesorId,
        ucionica_id: ucionicaId || null,
        datum,
        vrijeme_pocetka: pocetak,
        vrijeme_zavrsetka: zavrsetak,
        napomena: napomena.trim() || null,
        status: "planirano",
      });

    if (error) {
      setGreska(error.message);
      setSpremanje(false);
      return;
    }

    setNaziv("");
    setSkupinaId("");
    setProfesorId("");
    setUcionicaId("");
    setDatum("");
    setPocetak("");
    setZavrsetak("");
    setNapomena("");

    setUspjeh("Predavanje je uspješno dodano.");

    await ucitajPodatke();
    setSpremanje(false);
  }

  function nazivSkupine(id: string) {
    return skupine.find((s) => s.id === id)?.naziv ?? "Nepoznata skupina";
  }

  function nazivProfesora(id: string) {
    return (
      profesori.find((p) => p.id === id)?.ime_prezime ??
      "Nepoznat profesor"
    );
  }

  function nazivUcionice(id: string | null) {
    if (!id) return "Online / bez učionice";

    return (
      ucionice.find((u) => u.id === id)?.naziv ??
      "Nepoznata učionica"
    );
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
          Raspored predavanja
        </h1>

        <p className="mt-2 text-neutral-500">
          Planiranje nastave, profesora i učionica
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">
              Novo predavanje
            </h2>

            <form
              onSubmit={spremiPredavanje}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Naziv predavanja *
                </label>

                <input
                  value={naziv}
                  onChange={(e) => setNaziv(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  placeholder="npr. Osnove računovodstva"
                />
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
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3"
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

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Profesor *
                </label>

                <select
                  value={profesorId}
                  onChange={(e) =>
                    setProfesorId(e.target.value)
                  }
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3"
                >
                  <option value="">
                    Odaberite profesora
                  </option>

                  {profesori.map((profesor) => (
                    <option
                      key={profesor.id}
                      value={profesor.id}
                    >
                      {profesor.ime_prezime}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Učionica
                </label>

                <select
                  value={ucionicaId}
                  onChange={(e) =>
                    setUcionicaId(e.target.value)
                  }
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3"
                >
                  <option value="">
                    Online / bez učionice
                  </option>

                  {ucionice.map((ucionica) => (
                    <option
                      key={ucionica.id}
                      value={ucionica.id}
                    >
                      {ucionica.naziv}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Datum *
                </label>

                <input
                  type="date"
                  value={datum}
                  onChange={(e) => setDatum(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Početak *
                  </label>

                  <input
                    type="time"
                    value={pocetak}
                    onChange={(e) =>
                      setPocetak(e.target.value)
                    }
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Završetak *
                  </label>

                  <input
                    type="time"
                    value={zavrsetak}
                    onChange={(e) =>
                      setZavrsetak(e.target.value)
                    }
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Napomena
                </label>

                <textarea
                  value={napomena}
                  onChange={(e) =>
                    setNapomena(e.target.value)
                  }
                  rows={3}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3"
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
                  ? "Spremanje..."
                  : "Dodaj predavanje"}
              </button>
            </form>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                Predavanja
              </h2>

              <span className="text-sm text-neutral-500">
                Ukupno: {predavanja.length}
              </span>
            </div>

            {ucitavanje ? (
              <div className="rounded-2xl bg-white p-6">
                Učitavanje...
              </div>
            ) : predavanja.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-neutral-500">
                Još nema predavanja.
              </div>
            ) : (
              <div className="space-y-3">
                {predavanja.map((predavanje) => (
                  <div
                    key={predavanje.id}
                    className="rounded-2xl bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row">
                      <div>
                        <h3 className="text-lg font-bold">
                          {predavanje.naziv}
                        </h3>

                        <p className="mt-2 font-semibold text-red-600">
                          {nazivSkupine(
                            predavanje.skupina_id
                          )}
                        </p>

                        <div className="mt-3 space-y-1 text-sm text-neutral-600">
                          <p>
                            📅{" "}
                            {new Date(
                              predavanje.datum +
                                "T12:00:00"
                            ).toLocaleDateString(
                              "hr-HR"
                            )}
                          </p>

                          <p>
                            🕒{" "}
                            {predavanje.vrijeme_pocetka.slice(
                              0,
                              5
                            )}{" "}
                            –{" "}
                            {predavanje.vrijeme_zavrsetka.slice(
                              0,
                              5
                            )}
                          </p>

                          <p>
                            👨‍🏫{" "}
                            {nazivProfesora(
                              predavanje.profesor_id
                            )}
                          </p>

                          <p>
                            🏫{" "}
                            {nazivUcionice(
                              predavanje.ucionica_id
                            )}
                          </p>

                          {predavanje.napomena && (
                            <p>
                              📝 {predavanje.napomena}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Planirano
                        </span>
                      </div>
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