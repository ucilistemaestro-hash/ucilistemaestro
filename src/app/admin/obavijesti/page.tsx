"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Skupina = {
  id: string;
  naziv: string;
};

type Obavijest = {
  id: string;
  naslov: string;
  poruka: string;
  link: string | null;
  cilj: string;
  skupina_id: string | null;
  aktivna: boolean;
  datum_objave: string;
};

export default function ObavijestiPage() {
  const router = useRouter();

  const [skupine, setSkupine] = useState<Skupina[]>([]);
  const [obavijesti, setObavijesti] = useState<Obavijest[]>([]);

  const [naslov, setNaslov] = useState("");
  const [poruka, setPoruka] = useState("");
  const [link, setLink] = useState("");
  const [cilj, setCilj] = useState("svi");
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

    const [skupineRez, obavijestiRez] = await Promise.all([
      supabase
        .from("obrazovne_skupine")
        .select("id, naziv")
        .eq("status", "aktivna")
        .order("naziv"),

      supabase
        .from("obavijesti")
        .select(
          "id, naslov, poruka, link, cilj, skupina_id, aktivna, datum_objave"
        )
        .order("datum_objave", { ascending: false }),
    ]);

    if (skupineRez.error || obavijestiRez.error) {
      setGreska("Nije moguće učitati podatke.");
    }

    setSkupine(skupineRez.data ?? []);
    setObavijesti(obavijestiRez.data ?? []);

    setUcitavanje(false);
  }

  async function posaljiObavijest(e: FormEvent) {
    e.preventDefault();

    setGreska("");
    setUspjeh("");

    if (!naslov.trim() || !poruka.trim()) {
      setGreska("Naslov i poruka su obavezni.");
      return;
    }

    if (cilj === "skupina" && !skupinaId) {
      setGreska("Odaberite obrazovnu skupinu.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setGreska("Prijava je istekla.");
      return;
    }

    setSpremanje(true);

    const { error } = await supabase
      .from("obavijesti")
      .insert({
        naslov: naslov.trim(),
        poruka: poruka.trim(),
        link: link.trim() || null,
        cilj,
        skupina_id:
          cilj === "skupina" ? skupinaId : null,
        created_by: user.id,
      });

    if (error) {
      setGreska("Obavijest nije moguće poslati: " + error.message);
      setSpremanje(false);
      return;
    }

    setNaslov("");
    setPoruka("");
    setLink("");
    setCilj("svi");
    setSkupinaId("");

    setUspjeh("Obavijest je uspješno poslana.");

    await ucitajPodatke();

    setSpremanje(false);
  }

  async function promijeniStatus(obavijest: Obavijest) {
    const { error } = await supabase
      .from("obavijesti")
      .update({
        aktivna: !obavijest.aktivna,
      })
      .eq("id", obavijest.id);

    if (error) {
      setGreska("Status obavijesti nije moguće promijeniti.");
      return;
    }

    await ucitajPodatke();
  }

  function nazivCilja(obavijest: Obavijest) {
    if (obavijest.cilj === "svi") {
      return "Svi korisnici";
    }

    if (obavijest.cilj === "polaznici") {
      return "Svi polaznici";
    }

    if (obavijest.cilj === "profesori") {
      return "Svi profesori";
    }

    if (obavijest.cilj === "skupina") {
      const skupina = skupine.find(
        (s) => s.id === obavijest.skupina_id
      );

      return skupina?.naziv ?? "Obrazovna skupina";
    }

    return "";
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
          Obavijesti
        </h1>

        <p className="mt-2 text-neutral-500">
          Poruke za polaznike, profesore i obrazovne skupine
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">
              Nova obavijest
            </h2>

            <form
              onSubmit={posaljiObavijest}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Naslov *
                </label>

                <input
                  value={naslov}
                  onChange={(e) => setNaslov(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  placeholder="npr. Promjena termina predavanja"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Poruka *
                </label>

                <textarea
                  value={poruka}
                  onChange={(e) => setPoruka(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  placeholder="Upišite obavijest..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Kome poslati? *
                </label>

                <select
                  value={cilj}
                  onChange={(e) => {
                    setCilj(e.target.value);

                    if (e.target.value !== "skupina") {
                      setSkupinaId("");
                    }
                  }}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3"
                >
                  <option value="svi">
                    Svim korisnicima
                  </option>

                  <option value="polaznici">
                    Svim polaznicima
                  </option>

                  <option value="profesori">
                    Svim profesorima
                  </option>

                  <option value="skupina">
                    Obrazovnoj skupini
                  </option>
                </select>
              </div>

              {cilj === "skupina" && (
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
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Poveznica
                </label>

                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  placeholder="https://..."
                />

                <p className="mt-2 text-xs text-neutral-500">
                  Npr. Google Forms anketa, Teams sastanak ili
                  dokument.
                </p>
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
                  ? "Slanje..."
                  : "Pošalji obavijest"}
              </button>
            </form>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                Poslane obavijesti
              </h2>

              <span className="text-sm text-neutral-500">
                Ukupno: {obavijesti.length}
              </span>
            </div>

            {ucitavanje ? (
              <div className="rounded-2xl bg-white p-6">
                Učitavanje...
              </div>
            ) : obavijesti.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-neutral-500">
                Još nema obavijesti.
              </div>
            ) : (
              <div className="space-y-3">
                {obavijesti.map((obavijest) => (
                  <div
                    key={obavijest.id}
                    className="rounded-2xl bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold">
                            {obavijest.naslov}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              obavijest.aktivna
                                ? "bg-green-100 text-green-700"
                                : "bg-neutral-200 text-neutral-600"
                            }`}
                          >
                            {obavijest.aktivna
                              ? "Aktivna"
                              : "Neaktivna"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-red-600">
                          {nazivCilja(obavijest)}
                        </p>

                        <p className="mt-3 text-sm text-neutral-600">
                          {obavijest.poruka}
                        </p>

                        {obavijest.link && (
                          <a
                            href={obavijest.link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-block text-sm font-semibold text-red-600"
                          >
                            Otvori poveznicu →
                          </a>
                        )}

                        <p className="mt-3 text-xs text-neutral-400">
                          {new Date(
                            obavijest.datum_objave
                          ).toLocaleString("hr-HR")}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          promijeniStatus(obavijest)
                        }
                        className="h-fit rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold"
                      >
                        {obavijest.aktivna
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