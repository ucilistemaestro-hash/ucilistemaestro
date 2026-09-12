"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  School,
  Trash2,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Program = {
  id: string;
  naziv: string;
  aktivan: boolean;
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

  const [programi, setProgrami] =
    useState<Program[]>([]);

  const [skupine, setSkupine] =
    useState<Skupina[]>([]);

  const [
    ucitavanje,
    setUcitavanje,
  ] = useState(true);

  const [
    spremanje,
    setSpremanje,
  ] = useState(false);

  const [
    brisanjeUTijeku,
    setBrisanjeUTijeku,
  ] =
    useState<string | null>(
      null
    );

  const [greska, setGreska] =
    useState("");

  const [
    urediId,
    setUrediId,
  ] =
    useState<string | null>(
      null
    );

  const [
    programId,
    setProgramId,
  ] = useState("");

  const [naziv, setNaziv] =
    useState("");

  const [sifra, setSifra] =
    useState("");

  const [
    datumPocetka,
    setDatumPocetka,
  ] = useState("");

  const [
    datumZavrsetka,
    setDatumZavrsetka,
  ] = useState("");

  const [status, setStatus] =
    useState("aktivna");

  useEffect(() => {
    void provjeriPristup();
  }, []);

  async function provjeriPristup() {
    setGreska("");

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

    await Promise.all([
      ucitajPrograme(),
      ucitajSkupine(),
    ]);
  }

  async function ucitajPrograme() {
    const {
      data,
      error,
    } = await supabase
      .from(
        "obrazovni_programi"
      )
      .select(
        "id, naziv, aktivan"
      )
      .order("naziv");

    if (error) {
      setGreska(
        "Nije moguće učitati obrazovne programe."
      );
      return;
    }

    setProgrami(
      data ?? []
    );
  }

  async function ucitajSkupine() {
    setUcitavanje(true);

    const {
      data,
      error,
    } = await supabase
      .from(
        "obrazovne_skupine"
      )
      .select(
        "id, program_id, naziv, sifra, datum_pocetka, datum_zavrsetka, status"
      )
      .order(
        "datum_pocetka",
        {
          ascending: false,
        }
      );

    if (error) {
      setGreska(
        "Nije moguće učitati obrazovne skupine."
      );
    } else {
      setSkupine(
        data ?? []
      );
    }

    setUcitavanje(false);
  }

  async function spremiSkupinu(
    e: FormEvent
  ) {
    e.preventDefault();

    if (!programId) {
      setGreska(
        "Odaberite obrazovni program."
      );
      return;
    }

    if (!naziv.trim()) {
      setGreska(
        "Naziv skupine je obavezan."
      );
      return;
    }

    if (
      datumPocetka &&
      datumZavrsetka &&
      datumZavrsetka <
        datumPocetka
    ) {
      setGreska(
        "Datum završetka ne može biti prije datuma početka."
      );
      return;
    }

    setGreska("");
    setSpremanje(true);

    const podaci = {
      program_id:
        programId,

      naziv:
        naziv.trim(),

      sifra:
        sifra.trim() ||
        null,

      datum_pocetka:
        datumPocetka ||
        null,

      datum_zavrsetka:
        datumZavrsetka ||
        null,

      status,
    };

    if (urediId) {
      const {
        error,
      } = await supabase
        .from(
          "obrazovne_skupine"
        )
        .update(
          podaci
        )
        .eq(
          "id",
          urediId
        );

      if (error) {
        setGreska(
          "Skupinu nije moguće izmijeniti."
        );

        setSpremanje(false);
        return;
      }
    } else {
      const {
        error,
      } = await supabase
        .from(
          "obrazovne_skupine"
        )
        .insert(
          podaci
        );

      if (error) {
        setGreska(
          error.message.includes(
            "duplicate"
          )
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

  function pokreniUredivanje(
    skupina: Skupina
  ) {
    setUrediId(
      skupina.id
    );

    setProgramId(
      skupina.program_id
    );

    setNaziv(
      skupina.naziv
    );

    setSifra(
      skupina.sifra ??
        ""
    );

    setDatumPocetka(
      skupina.datum_pocetka ??
        ""
    );

    setDatumZavrsetka(
      skupina.datum_zavrsetka ??
        ""
    );

    setStatus(
      skupina.status
    );

    setGreska("");

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

  async function obrisiSkupinu(
    skupina: Skupina
  ) {
    if (
      brisanjeUTijeku ||
      spremanje
    ) {
      return;
    }

    setGreska("");

    const [
      clanstvaRezultat,
      predavanjaRezultat,
      obavijestiRezultat,
    ] = await Promise.all([
      supabase
        .from(
          "clanstva_skupina"
        )
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "skupina_id",
          skupina.id
        ),

      supabase
        .from(
          "predavanja"
        )
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "skupina_id",
          skupina.id
        ),

      supabase
        .from(
          "obavijesti"
        )
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "skupina_id",
          skupina.id
        ),
    ]);

    if (
      clanstvaRezultat.error ||
      predavanjaRezultat.error ||
      obavijestiRezultat.error
    ) {
      setGreska(
        "Nije moguće provjeriti koristi li se ova skupina."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    const brojClanstava =
      clanstvaRezultat.count ??
      0;

    const brojPredavanja =
      predavanjaRezultat.count ??
      0;

    const brojObavijesti =
      obavijestiRezultat.count ??
      0;

    if (
      brojClanstava > 0 ||
      brojPredavanja > 0 ||
      brojObavijesti > 0
    ) {
      const razlozi: string[] =
        [];

      if (
        brojClanstava > 0
      ) {
        razlozi.push(
          "ima evidentirane polaznike"
        );
      }

      if (
        brojPredavanja > 0
      ) {
        razlozi.push(
          "ima termine nastave"
        );
      }

      if (
        brojObavijesti > 0
      ) {
        razlozi.push(
          "ima povezane obavijesti"
        );
      }

      setGreska(
        `Skupinu "${skupina.naziv}" nije moguće obrisati jer ${razlozi.join(
          ", "
        )}. Umjesto brisanja promijenite status skupine u "Arhivirana".`
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    const potvrda =
      window.confirm(
        `Želite li trajno obrisati skupinu "${skupina.naziv}"?\n\nOvu radnju nije moguće poništiti.`
      );

    if (!potvrda) {
      return;
    }

    setBrisanjeUTijeku(
      skupina.id
    );

    const {
      error,
    } = await supabase
      .from(
        "obrazovne_skupine"
      )
      .delete()
      .eq(
        "id",
        skupina.id
      );

    if (error) {
      setGreska(
        "Skupinu nije moguće obrisati. Provjerite postoje li još povezani podaci."
      );

      setBrisanjeUTijeku(
        null
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (
      urediId ===
      skupina.id
    ) {
      ocistiFormu();
    }

    await ucitajSkupine();

    setBrisanjeUTijeku(
      null
    );
  }

  function nazivPrograma(
    trazeniProgramId: string
  ) {
    return (
      programi.find(
        (program) =>
          program.id ===
          trazeniProgramId
      )?.naziv ??
      "Nepoznat program"
    );
  }

  function nazivStatusa(
    vrijednost: string
  ) {
    if (
      vrijednost ===
      "aktivna"
    ) {
      return "Aktivna";
    }

    if (
      vrijednost ===
      "zavrsena"
    ) {
      return "Završena";
    }

    if (
      vrijednost ===
      "arhivirana"
    ) {
      return "Arhivirana";
    }

    return "U pripremi";
  }

  function statusKlasa(
    vrijednost: string
  ) {
    if (
      vrijednost ===
      "aktivna"
    ) {
      return "bg-[#edf7f0] text-[#277442]";
    }

    if (
      vrijednost ===
      "zavrsena"
    ) {
      return "bg-[#edf4fb] text-[#315f8c]";
    }

    if (
      vrijednost ===
      "arhivirana"
    ) {
      return "bg-[#f0f2f4] text-[#69737c]";
    }

    return "bg-[#fff7e6] text-[#966c17]";
  }

  function formatDatum(
    datum: string
  ) {
    return new Date(
      datum +
        "T12:00:00"
    ).toLocaleDateString(
      "hr-HR"
    );
  }

  const programiZaOdabir =
    programi.filter(
      (program) =>
        program.aktivan ||
        program.id ===
          programId
    );

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
              Obrazovne skupine
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 md:px-8 md:py-9">
        <section className="max-w-3xl">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#17324d] text-white sm:flex">
              <School
                size={23}
              />
            </div>

            <div>
              <h2 className="text-[28px] font-extrabold tracking-[-0.025em] text-[#17202a] md:text-[32px]">
                Upravljanje skupinama
              </h2>

              <p className="mt-2 text-[15px] leading-6 text-[#66717d]">
                Dodajte i uredite obrazovne skupine,
                odredite datume i status te uklonite
                skupine koje se još ne koriste.
              </p>
            </div>
          </div>
        </section>

        {greska && (
          <div className="mt-6 rounded-[18px] border border-[#f2c7ca] bg-[#fff5f5] px-4 py-4 text-[14px] leading-6 text-[#a71d24]">
            {greska}
          </div>
        )}

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[400px_1fr]">
          <section className="rounded-[24px] border border-[#dfe5ea] bg-white p-5 shadow-[0_6px_20px_rgba(23,50,77,0.04)] lg:sticky lg:top-[96px]">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  urediId
                    ? "bg-[#fff2f2] text-[#c9252d]"
                    : "bg-[#eef3f7] text-[#17324d]"
                }`}
              >
                {urediId ? (
                  <Pencil
                    size={19}
                  />
                ) : (
                  <Plus
                    size={20}
                  />
                )}
              </div>

              <div>
                <h2 className="text-[19px] font-bold text-[#17202a]">
                  {urediId
                    ? "Uredi skupinu"
                    : "Nova skupina"}
                </h2>

                <p className="mt-0.5 text-[13px] text-[#7a8590]">
                  {urediId
                    ? "Izmijenite podatke odabrane skupine."
                    : "Unesite podatke nove skupine."}
                </p>
              </div>
            </div>

            <form
              onSubmit={
                spremiSkupinu
              }
              className="mt-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="program"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Obrazovni program
                  <span className="ml-1 text-[#c9252d]">
                    *
                  </span>
                </label>

                <select
                  id="program"
                  value={
                    programId
                  }
                  onChange={(
                    e
                  ) =>
                    setProgramId(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                >
                  <option value="">
                    Odaberite program
                  </option>

                  {programiZaOdabir.map(
                    (
                      program
                    ) => (
                      <option
                        key={
                          program.id
                        }
                        value={
                          program.id
                        }
                      >
                        {
                          program.naziv
                        }
                        {!program.aktivan
                          ? " (neaktivan)"
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="naziv-skupine"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Naziv skupine
                  <span className="ml-1 text-[#c9252d]">
                    *
                  </span>
                </label>

                <input
                  id="naziv-skupine"
                  value={
                    naziv
                  }
                  onChange={(
                    e
                  ) =>
                    setNaziv(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="npr. Knjigovođa 2026/1"
                />
              </div>

              <div>
                <label
                  htmlFor="sifra-skupine"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Šifra skupine
                </label>

                <input
                  id="sifra-skupine"
                  value={
                    sifra
                  }
                  onChange={(
                    e
                  ) =>
                    setSifra(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="npr. KNJ-2026-01"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <label
                    htmlFor="datum-pocetka"
                    className="mb-2 block text-[13px] font-bold text-[#384550]"
                  >
                    Datum početka
                  </label>

                  <input
                    id="datum-pocetka"
                    type="date"
                    value={
                      datumPocetka
                    }
                    onChange={(
                      e
                    ) =>
                      setDatumPocetka(
                        e.target.value
                      )
                    }
                    className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="datum-zavrsetka"
                    className="mb-2 block text-[13px] font-bold text-[#384550]"
                  >
                    Datum završetka
                  </label>

                  <input
                    id="datum-zavrsetka"
                    type="date"
                    value={
                      datumZavrsetka
                    }
                    onChange={(
                      e
                    ) =>
                      setDatumZavrsetka(
                        e.target.value
                      )
                    }
                    className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Status
                </label>

                <select
                  id="status"
                  value={
                    status
                  }
                  onChange={(
                    e
                  ) =>
                    setStatus(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
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

              <button
                type="submit"
                disabled={
                  spremanje ||
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
                ) : urediId ? (
                  <Save
                    size={19}
                  />
                ) : (
                  <Plus
                    size={19}
                  />
                )}

                {spremanje
                  ? "Spremanje..."
                  : urediId
                  ? "Spremi promjene"
                  : "Dodaj skupinu"}
              </button>

              {urediId && (
                <button
                  type="button"
                  onClick={
                    ocistiFormu
                  }
                  disabled={
                    spremanje
                  }
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#d6dde3] bg-white px-5 text-[14px] font-bold text-[#52606d] transition hover:bg-[#f7f9fa] disabled:opacity-60"
                >
                  <RotateCcw
                    size={18}
                  />

                  Odustani od uređivanja
                </button>
              )}
            </form>
          </section>

          <section className="min-w-0">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.09em] text-[#c9252d]">
                  Evidencija
                </p>

                <h2 className="mt-1 text-[22px] font-extrabold text-[#17202a]">
                  Popis skupina
                </h2>
              </div>

              <div className="shrink-0 rounded-xl border border-[#dfe5ea] bg-white px-3 py-2 text-[13px] font-semibold text-[#66717d]">
                Ukupno:{" "}
                <span className="font-bold text-[#17202a]">
                  {
                    skupine.length
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
                    Učitavanje skupina...
                  </p>
                </div>
              </div>
            ) : skupine.length ===
              0 ? (
              <div className="mt-4 rounded-[22px] border border-[#dfe5ea] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <Users
                    size={21}
                  />
                </div>

                <h3 className="mt-4 text-[19px] font-bold text-[#17202a]">
                  Još nema obrazovnih skupina
                </h3>

                <p className="mt-2 text-[14px] leading-6 text-[#66717d]">
                  Prvu skupinu možete dodati pomoću
                  obrasca.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {skupine.map(
                  (
                    skupina
                  ) => (
                    <article
                      key={
                        skupina.id
                      }
                      className="rounded-[22px] border border-[#dfe5ea] bg-white p-5 shadow-[0_5px_18px_rgba(23,50,77,0.035)]"
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="text-[18px] font-bold leading-6 text-[#17202a]">
                              {
                                skupina.naziv
                              }
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusKlasa(
                                skupina.status
                              )}`}
                            >
                              {nazivStatusa(
                                skupina.status
                              )}
                            </span>
                          </div>

                          <p className="mt-2 text-[14px] font-bold text-[#c9252d]">
                            {nazivPrograma(
                              skupina.program_id
                            )}
                          </p>

                          {skupina.sifra && (
                            <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.06em] text-[#8b949e]">
                              {
                                skupina.sifra
                              }
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                            {skupina.datum_pocetka && (
                              <div className="flex items-start gap-2">
                                <CalendarDays
                                  size={17}
                                  className="mt-0.5 shrink-0 text-[#17324d]"
                                />

                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#8b949e]">
                                    Početak
                                  </p>

                                  <p className="mt-0.5 text-[14px] font-semibold text-[#52606d]">
                                    {formatDatum(
                                      skupina.datum_pocetka
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}

                            {skupina.datum_zavrsetka && (
                              <div className="flex items-start gap-2">
                                <CalendarDays
                                  size={17}
                                  className="mt-0.5 shrink-0 text-[#17324d]"
                                />

                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#8b949e]">
                                    Završetak
                                  </p>

                                  <p className="mt-0.5 text-[14px] font-semibold text-[#52606d]">
                                    {formatDatum(
                                      skupina.datum_zavrsetka
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              pokreniUredivanje(
                                skupina
                              )
                            }
                            disabled={
                              brisanjeUTijeku !==
                                null
                            }
                            className="flex min-h-[42px] items-center gap-2 rounded-xl border border-[#d6dde3] bg-white px-3.5 text-[13px] font-bold text-[#17324d] transition hover:bg-[#f4f6f8] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Pencil
                              size={16}
                            />

                            Uredi
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void obrisiSkupinu(
                                skupina
                              )
                            }
                            disabled={
                              brisanjeUTijeku !==
                                null ||
                              spremanje
                            }
                            className="flex min-h-[42px] items-center gap-2 rounded-xl border border-[#efc8cb] bg-white px-3.5 text-[13px] font-bold text-[#b52027] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {brisanjeUTijeku ===
                            skupina.id ? (
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
                            skupina.id
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