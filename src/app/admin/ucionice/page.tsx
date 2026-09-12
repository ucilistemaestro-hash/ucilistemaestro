"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Ucionica = {
  id: string;
  naziv: string;
  kapacitet: number | null;
  lokacija: string | null;
  oprema: string | null;
  aktivna: boolean;
};

export default function UcionicePage() {
  const router = useRouter();

  const [ucionice, setUcionice] = useState<Ucionica[]>([]);
  const [ucitavanje, setUcitavanje] = useState(true);
  const [spremanje, setSpremanje] = useState(false);
  const [greska, setGreska] = useState("");
  const [uspjeh, setUspjeh] = useState("");

  const [urediId, setUrediId] = useState<string | null>(null);
  const [naziv, setNaziv] = useState("");
  const [kapacitet, setKapacitet] = useState("");
  const [lokacija, setLokacija] = useState("");
  const [oprema, setOprema] = useState("");

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

    await ucitajUcionice();
  }

  async function ucitajUcionice() {
    setUcitavanje(true);
    setGreska("");

    const { data, error } = await supabase
      .from("ucionice")
      .select("id, naziv, kapacitet, lokacija, oprema, aktivna")
      .order("naziv");

    if (error) {
      setGreska("Nije moguće učitati učionice.");
    } else {
      setUcionice(data ?? []);
    }

    setUcitavanje(false);
  }

  async function spremiUcionicu(e: FormEvent) {
    e.preventDefault();

    if (!naziv.trim()) {
      setGreska("Naziv učionice je obavezan.");
      return;
    }

    if (kapacitet && Number(kapacitet) < 1) {
      setGreska("Kapacitet mora biti veći od 0.");
      return;
    }

    setGreska("");
    setUspjeh("");
    setSpremanje(true);

    const podaci = {
      naziv: naziv.trim(),
      kapacitet: kapacitet ? Number(kapacitet) : null,
      lokacija: lokacija.trim() || null,
      oprema: oprema.trim() || null,
    };

    if (urediId) {
      const { error } = await supabase
        .from("ucionice")
        .update(podaci)
        .eq("id", urediId);

      if (error) {
        setGreska("Učionicu nije moguće izmijeniti.");
        setSpremanje(false);
        return;
      }

      setUspjeh("Učionica je uspješno izmijenjena.");
    } else {
      const { error } = await supabase
        .from("ucionice")
        .insert({
          ...podaci,
          aktivna: true,
        });

      if (error) {
        setGreska("Učionicu nije moguće dodati.");
        setSpremanje(false);
        return;
      }

      setUspjeh("Učionica je uspješno dodana.");
    }

    ocistiFormu();
    await ucitajUcionice();
    setSpremanje(false);
  }

  function urediUcionicu(ucionica: Ucionica) {
    setUrediId(ucionica.id);
    setNaziv(ucionica.naziv);
    setKapacitet(
      ucionica.kapacitet ? String(ucionica.kapacitet) : ""
    );
    setLokacija(ucionica.lokacija ?? "");
    setOprema(ucionica.oprema ?? "");
    setUspjeh("");
    setGreska("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function ocistiFormu() {
    setUrediId(null);
    setNaziv("");
    setKapacitet("");
    setLokacija("");
    setOprema("");
  }

  async function promijeniStatus(ucionica: Ucionica) {
    setGreska("");
    setUspjeh("");

    const { error } = await supabase
      .from("ucionice")
      .update({
        aktivna: !ucionica.aktivna,
      })
      .eq("id", ucionica.id);

    if (error) {
      setGreska("Status učionice nije moguće promijeniti.");
      return;
    }

    await ucitajUcionice();
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
          Učionice
        </h1>

        <p className="mt-2 text-neutral-500">
          Prostorije, kapacitet i oprema
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">
              {urediId ? "Uredi učionicu" : "Nova učionica"}
            </h2>

            <form
              onSubmit={spremiUcionicu}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Naziv učionice *
                </label>

                <input
                  value={naziv}
                  onChange={(e) => setNaziv(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-red-600"
                  placeholder="npr. Učionica 2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Kapacitet
                </label>

                <input
                  type="number"
                  min="1"
                  value={kapacitet}
                  onChange={(e) => setKapacitet(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-red-600"
                  placeholder="npr. 20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Lokacija
                </label>

                <input
                  value={lokacija}
                  onChange={(e) => setLokacija(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-red-600"
                  placeholder="npr. Prizemlje"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Oprema
                </label>

                <textarea
                  value={oprema}
                  onChange={(e) => setOprema(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-red-600"
                  placeholder="Projektor, računalo, ploča..."
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
                className="w-full rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-50"
              >
                {spremanje
                  ? "Spremanje..."
                  : urediId
                  ? "Spremi promjene"
                  : "Dodaj učionicu"}
              </button>

              {urediId && (
                <button
                  type="button"
                  onClick={ocistiFormu}
                  className="w-full rounded-xl border border-neutral-300 px-5 py-3 font-semibold"
                >
                  Odustani
                </button>
              )}
            </form>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                Popis učionica
              </h2>

              <span className="text-sm text-neutral-500">
                Ukupno: {ucionice.length}
              </span>
            </div>

            {ucitavanje ? (
              <div className="rounded-2xl bg-white p-6">
                Učitavanje...
              </div>
            ) : (
              <div className="space-y-3">
                {ucionice.map((ucionica) => (
                  <div
                    key={ucionica.id}
                    className="rounded-2xl bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold">
                            {ucionica.naziv}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              ucionica.aktivna
                                ? "bg-green-100 text-green-700"
                                : "bg-neutral-200 text-neutral-600"
                            }`}
                          >
                            {ucionica.aktivna
                              ? "Aktivna"
                              : "Neaktivna"}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-neutral-600">
                          {ucionica.kapacitet && (
                            <p>
                              👥 Kapacitet:{" "}
                              <strong>
                                {ucionica.kapacitet}
                              </strong>
                            </p>
                          )}

                          {ucionica.lokacija && (
                            <p>
                              📍 {ucionica.lokacija}
                            </p>
                          )}

                          {ucionica.oprema && (
                            <p>
                              🖥️ {ucionica.oprema}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex h-fit gap-2">
                        <button
                          onClick={() =>
                            urediUcionicu(ucionica)
                          }
                          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold"
                        >
                          Uredi
                        </button>

                        <button
                          onClick={() =>
                            promijeniStatus(ucionica)
                          }
                          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold"
                        >
                          {ucionica.aktivna
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