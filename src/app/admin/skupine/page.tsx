"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Program = {
  id: string;
  naziv: string;
};

type Skupina = {
  id: string;
  program_id: string;
  naziv: string;
  sifra: string | null;
  datum_pocetka: string | null;
  datum_zavrsetka: string | null;
  status: string;
};

export default function SkupinePage() {
  const router = useRouter();

  const [programi, setProgrami] = useState<Program[]>([]);
  const [skupine, setSkupine] = useState<Skupina[]>([]);

  const [ucitavanje, setUcitavanje] = useState(true);
  const [spremanje, setSpremanje] = useState(false);
  const [greska, setGreska] = useState("");

  const [urediId, setUrediId] = useState<string | null>(null);

  const [programId, setProgramId] = useState("");
  const [naziv, setNaziv] = useState("");
  const [sifra, setSifra] = useState("");
  const [datumPocetka, setDatumPocetka] = useState("");
  const [datumZavrsetka, setDatumZavrsetka] = useState("");
  const [status, setStatus] = useState("aktivna");

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

    await Promise.all([ucitajPrograme(), ucitajSkupine()]);
  }

  async function ucitajPrograme() {
    const { data, error } = await supabase
      .from("obrazovni_programi")
      .select("id, naziv")
      .eq("aktivan", true)
      .order("naziv");

    if (error) {
      setGreska("Nije moguće učitati obrazovne programe.");
      return;
    }

    setProgrami(data ?? []);
  }

  async function ucitajSkupine() {
    setUcitavanje(true);

    const { data, error } = await supabase
      .from("obrazovne_skupine")
      .select(
        "id, program_id, naziv, sifra, datum_pocetka, datum_zavrsetka, status"
      )
      .order("datum_pocetka", { ascending: false });

    if (error) {
      setGreska("Nije moguće učitati obrazovne skupine.");
    } else {
      setSkupine(data ?? []);
    }

    setUcitavanje(false);
  }

  async function spremiSkupinu(e: FormEvent) {
    e.preventDefault();

    if (!programId) {
      setGreska("Odaberite obrazovni program.");
      return;
    }

    if (!naziv.trim()) {
      setGreska("Naziv skupine je obavezan.");
      return;
    }

    setGreska("");
    setSpremanje(true);

    const podaci = {
      program_id: programId,
      naziv: naziv.trim(),
      sifra: sifra.trim() || null,
      datum_pocetka: datumPocetka || null,
      datum_zavrsetka: datumZavrsetka || null,
      status,
    };

    if (urediId) {
      const { error } = await supabase
        .from("obrazovne_skupine")
        .update(podaci)
        .eq("id", urediId);

      if (error) {
        setGreska("Skupinu nije moguće izmijeniti.");
        setSpremanje(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("obrazovne_skupine")
        .insert(podaci);

      if (error) {
        setGreska(
          error.message.includes("duplicate")
            ? "Skupina s tom šifrom već postoji."
            : "Skupinu nije moguće spremiti."
        );

        setSpremanje(false);
        return;
      }
    }

    ocistiFormu();
    await ucitajSkupine();
    setSpremanje(false);
  }

  function pokreniUredivanje(skupina: Skupina) {
    setUrediId(skupina.id);
    setProgramId(skupina.program_id);
    setNaziv(skupina.naziv);
    setSifra(skupina.sifra ?? "");
    setDatumPocetka(skupina.datum_pocetka ?? "");
    setDatumZavrsetka(skupina.datum_zavrsetka ?? "");
    setStatus(skupina.status);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function ocistiFormu() {
    setUrediId(null);
    setProgramId("");
    setNaziv("");
    setSifra("");
    setDatumPocetka("");
    setDatumZavrsetka("");
    setStatus("aktivna");
    setGreska("");
  }

  function nazivPrograma(programId: string) {
    return (
      programi.find((program) => program.id === programId)?.naziv ??
      "Nepoznat program"
    );
  }

  function statusKlasa(status: string) {
    if (status === "aktivna") {
      return "bg-green-100 text-green-700";
    }

    if (status === "zavrsena") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "arhivirana") {
      return "bg-neutral-200 text-neutral-600";
    }

    return "bg-yellow-100 text-yellow-700";
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
          Obrazovne skupine
        </h1>

        <p className="mt-2 text-neutral-500">
          Upravljanje skupinama polaznika
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[400px_1fr]">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">
              {urediId ? "Uredi skupinu" : "Nova skupina"}
            </h2>

            <form
              onSubmit={spremiSkupinu}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Obrazovni program *
                </label>

                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-red-600"
                >
                  <option value="">
                    Odaberite program
                  </option>

                  {programi.map((program) => (
                    <option
                      key={program.id}
                      value={program.id}
                    >
                      {program.naziv}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Naziv skupine *
                </label>

                <input
                  value={naziv}
                  onChange={(e) => setNaziv(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-red-600"
                  placeholder="npr. Knjigovođa 2026/1"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Šifra skupine
                </label>

                <input
                  value={sifra}
                  onChange={(e) => setSifra(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-red-600"
                  placeholder="npr. KNJ-2026-01"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Datum početka
                </label>

                <input
                  type="date"
                  value={datumPocetka}
                  onChange={(e) => setDatumPocetka(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Datum završetka
                </label>

                <input
                  type="date"
                  value={datumZavrsetka}
                  onChange={(e) => setDatumZavrsetka(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3"
                >
                  <option value="u_pripremi">
                    U pripremi
                  </option>

                  <option value="aktivna">
                    Aktivna
                  </option>

                  <option value="zavrsena">
                    Završena
                  </option>

                  <option value="arhivirana">
                    Arhivirana
                  </option>
                </select>
              </div>

              {greska && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {greska}
                </div>
              )}

              <button
                disabled={spremanje}
                className="w-full rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-50"
              >
                {spremanje
                  ? "Spremanje..."
                  : urediId
                  ? "Spremi promjene"
                  : "Dodaj skupinu"}
              </button>

              {urediId && (
                <button
                  type="button"
                  onClick={ocistiFormu}
                  className="w-full rounded-xl border border-neutral-300 px-5 py-3 font-semibold"
                >
                  Odustani od uređivanja
                </button>
              )}
            </form>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                Popis skupina
              </h2>

              <span className="text-sm text-neutral-500">
                Ukupno: {skupine.length}
              </span>
            </div>

            {ucitavanje ? (
              <div className="rounded-2xl bg-white p-6">
                Učitavanje...
              </div>
            ) : skupine.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-neutral-500">
                Još nema obrazovnih skupina.
              </div>
            ) : (
              <div className="space-y-3">
                {skupine.map((skupina) => (
                  <div
                    key={skupina.id}
                    className="rounded-2xl bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold">
                            {skupina.naziv}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusKlasa(
                              skupina.status
                            )}`}
                          >
                            {skupina.status === "aktivna"
                              ? "Aktivna"
                              : skupina.status === "zavrsena"
                              ? "Završena"
                              : skupina.status === "arhivirana"
                              ? "Arhivirana"
                              : "U pripremi"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-red-600">
                          {nazivPrograma(skupina.program_id)}
                        </p>

                        {skupina.sifra && (
                          <p className="mt-1 text-sm text-neutral-500">
                            {skupina.sifra}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-600">
                          {skupina.datum_pocetka && (
                            <span>
                              Početak:{" "}
                              {new Date(
                                skupina.datum_pocetka
                              ).toLocaleDateString("hr-HR")}
                            </span>
                          )}

                          {skupina.datum_zavrsetka && (
                            <span>
                              Završetak:{" "}
                              {new Date(
                                skupina.datum_zavrsetka
                              ).toLocaleDateString("hr-HR")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <button
                          onClick={() =>
                            pokreniUredivanje(skupina)
                          }
                          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold"
                        >
                          Uredi
                        </button>
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