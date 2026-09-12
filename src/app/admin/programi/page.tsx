"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  const [programi, setProgrami] = useState<Program[]>([]);
  const [ucitavanje, setUcitavanje] = useState(true);
  const [spremanje, setSpremanje] = useState(false);
  const [greska, setGreska] = useState("");

  const [urediId, setUrediId] = useState<string | null>(null);
  const [naziv, setNaziv] = useState("");
  const [sifra, setSifra] = useState("");
  const [opis, setOpis] = useState("");

  useEffect(() => {
    provjeriKorisnika();
  }, []);

  async function provjeriKorisnika() {
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

    await ucitajPrograme();
  }

  async function ucitajPrograme() {
    setUcitavanje(true);

    const { data, error } = await supabase
      .from("obrazovni_programi")
      .select("id, naziv, sifra, opis, aktivan")
      .order("naziv");

    if (error) {
      setGreska("Nije moguće učitati obrazovne programe.");
    } else {
      setProgrami(data ?? []);
    }

    setUcitavanje(false);
  }

  async function spremiProgram(e: FormEvent) {
    e.preventDefault();

    if (!naziv.trim()) {
      setGreska("Naziv programa je obavezan.");
      return;
    }

    setGreska("");
    setSpremanje(true);

    if (urediId) {
      const { error } = await supabase
        .from("obrazovni_programi")
        .update({
          naziv: naziv.trim(),
          sifra: sifra.trim() || null,
          opis: opis.trim() || null,
        })
        .eq("id", urediId);

      if (error) {
        setGreska("Program nije moguće izmijeniti.");
        setSpremanje(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("obrazovni_programi")
        .insert({
          naziv: naziv.trim(),
          sifra: sifra.trim() || null,
          opis: opis.trim() || null,
          aktivan: true,
        });

      if (error) {
        setGreska(
          error.message.includes("duplicate")
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

  function pokreniUredivanje(program: Program) {
    setUrediId(program.id);
    setNaziv(program.naziv);
    setSifra(program.sifra ?? "");
    setOpis(program.opis ?? "");

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

  async function promijeniStatus(program: Program) {
    const { error } = await supabase
      .from("obrazovni_programi")
      .update({
        aktivan: !program.aktivan,
      })
      .eq("id", program.id);

    if (error) {
      setGreska("Status programa nije moguće promijeniti.");
      return;
    }

    await ucitajPrograme();
  }

  return (
    <main className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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

      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-bold text-neutral-900">
          Obrazovni programi
        </h1>

        <p className="mt-2 text-neutral-500">
          Dodavanje i uređivanje programa Učilišta Maestro
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">
              {urediId ? "Uredi program" : "Novi program"}
            </h2>

            <form onSubmit={spremiProgram} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Naziv programa *
                </label>

                <input
                  value={naziv}
                  onChange={(e) => setNaziv(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-red-600"
                  placeholder="npr. Knjigovođa"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Šifra programa
                </label>

                <input
                  value={sifra}
                  onChange={(e) => setSifra(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-red-600"
                  placeholder="npr. KNJ-2026"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Opis
                </label>

                <textarea
                  value={opis}
                  onChange={(e) => setOpis(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-red-600"
                  placeholder="Kratki opis programa..."
                />
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
                  : "Dodaj program"}
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
                Popis programa
              </h2>

              <span className="text-sm text-neutral-500">
                Ukupno: {programi.length}
              </span>
            </div>

            {ucitavanje ? (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                Učitavanje...
              </div>
            ) : programi.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-neutral-500 shadow-sm">
                Još nema obrazovnih programa.
              </div>
            ) : (
              <div className="space-y-3">
                {programi.map((program) => (
                  <div
                    key={program.id}
                    className="rounded-2xl bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold">
                            {program.naziv}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              program.aktivan
                                ? "bg-green-100 text-green-700"
                                : "bg-neutral-200 text-neutral-600"
                            }`}
                          >
                            {program.aktivan
                              ? "Aktivan"
                              : "Neaktivan"}
                          </span>
                        </div>

                        {program.sifra && (
                          <p className="mt-1 text-sm font-medium text-neutral-500">
                            {program.sifra}
                          </p>
                        )}

                        {program.opis && (
                          <p className="mt-3 text-sm text-neutral-600">
                            {program.opis}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => pokreniUredivanje(program)}
                          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold"
                        >
                          Uredi
                        </button>

                        <button
                          onClick={() => promijeniStatus(program)}
                          className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600"
                        >
                          {program.aktivan
                            ? "Deaktiviraj"
                            : "Aktiviraj"}
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