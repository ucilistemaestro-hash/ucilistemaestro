"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CheckCircle2,
  DoorOpen,
  LoaderCircle,
  MapPin,
  Monitor,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Save,
  Trash2,
  Users,
} from "lucide-react";

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

  const [ucionice, setUcionice] =
    useState<Ucionica[]>([]);

  const [
    ucitavanje,
    setUcitavanje,
  ] = useState(true);

  const [
    spremanje,
    setSpremanje,
  ] = useState(false);

  const [
    statusUTijeku,
    setStatusUTijeku,
  ] =
    useState<string | null>(
      null
    );

  const [
    brisanjeUTijeku,
    setBrisanjeUTijeku,
  ] =
    useState<string | null>(
      null
    );

  const [greska, setGreska] =
    useState("");

  const [uspjeh, setUspjeh] =
    useState("");

  const [
    urediId,
    setUrediId,
  ] =
    useState<string | null>(
      null
    );

  const [naziv, setNaziv] =
    useState("");

  const [
    kapacitet,
    setKapacitet,
  ] = useState("");

  const [
    lokacija,
    setLokacija,
  ] = useState("");

  const [oprema, setOprema] =
    useState("");

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

    await ucitajUcionice();
  }

  async function ucitajUcionice() {
    setUcitavanje(true);

    const {
      data,
      error,
    } = await supabase
      .from("ucionice")
      .select(
        "id, naziv, kapacitet, lokacija, oprema, aktivna"
      )
      .order("naziv");

    if (error) {
      setGreska(
        "Nije moguće učitati učionice."
      );
    } else {
      setUcionice(
        data ?? []
      );
    }

    setUcitavanje(false);
  }

  async function spremiUcionicu(
    e: FormEvent
  ) {
    e.preventDefault();

    if (!naziv.trim()) {
      setGreska(
        "Naziv učionice je obavezan."
      );
      return;
    }

    if (
      kapacitet &&
      Number(kapacitet) < 1
    ) {
      setGreska(
        "Kapacitet mora biti veći od 0."
      );
      return;
    }

    setGreska("");
    setUspjeh("");
    setSpremanje(true);

    const podaci = {
      naziv:
        naziv.trim(),

      kapacitet:
        kapacitet
          ? Number(
              kapacitet
            )
          : null,

      lokacija:
        lokacija.trim() ||
        null,

      oprema:
        oprema.trim() ||
        null,
    };

    if (urediId) {
      const {
        error,
      } = await supabase
        .from("ucionice")
        .update(
          podaci
        )
        .eq(
          "id",
          urediId
        );

      if (error) {
        setGreska(
          "Učionicu nije moguće izmijeniti."
        );

        setSpremanje(false);
        return;
      }

      setUspjeh(
        "Učionica je uspješno izmijenjena."
      );
    } else {
      const {
        error,
      } = await supabase
        .from("ucionice")
        .insert({
          ...podaci,
          aktivna: true,
        });

      if (error) {
        setGreska(
          "Učionicu nije moguće dodati."
        );

        setSpremanje(false);
        return;
      }

      setUspjeh(
        "Učionica je uspješno dodana."
      );
    }

    ocistiFormu();

    await ucitajUcionice();

    setSpremanje(false);
  }

  function urediUcionicu(
    ucionica: Ucionica
  ) {
    setUrediId(
      ucionica.id
    );

    setNaziv(
      ucionica.naziv
    );

    setKapacitet(
      ucionica.kapacitet
        ? String(
            ucionica.kapacitet
          )
        : ""
    );

    setLokacija(
      ucionica.lokacija ??
        ""
    );

    setOprema(
      ucionica.oprema ??
        ""
    );

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

  async function promijeniStatus(
    ucionica: Ucionica
  ) {
    if (
      statusUTijeku ||
      brisanjeUTijeku
    ) {
      return;
    }

    setGreska("");
    setUspjeh("");

    setStatusUTijeku(
      ucionica.id
    );

    const {
      error,
    } = await supabase
      .from("ucionice")
      .update({
        aktivna:
          !ucionica.aktivna,
      })
      .eq(
        "id",
        ucionica.id
      );

    if (error) {
      setGreska(
        "Status učionice nije moguće promijeniti."
      );

      setStatusUTijeku(
        null
      );

      return;
    }

    setUspjeh(
      ucionica.aktivna
        ? "Učionica je deaktivirana."
        : "Učionica je aktivirana."
    );

    await ucitajUcionice();

    setStatusUTijeku(
      null
    );
  }

  async function obrisiUcionicu(
    ucionica: Ucionica
  ) {
    if (
      brisanjeUTijeku ||
      statusUTijeku ||
      spremanje
    ) {
      return;
    }

    setGreska("");
    setUspjeh("");

    const {
      count,
      error:
        predavanjaError,
    } = await supabase
      .from("predavanja")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        }
      )
      .eq(
        "ucionica_id",
        ucionica.id
      );

    if (
      predavanjaError
    ) {
      setGreska(
        "Nije moguće provjeriti koristi li se ova učionica."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (
      (count ?? 0) > 0
    ) {
      setGreska(
        `Učionicu "${ucionica.naziv}" nije moguće obrisati jer je povezana s evidencijom predavanja. Umjesto brisanja učionicu možete deaktivirati.`
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    const potvrda =
      window.confirm(
        `Želite li trajno obrisati učionicu "${ucionica.naziv}"?\n\nOvu radnju nije moguće poništiti.`
      );

    if (!potvrda) {
      return;
    }

    setBrisanjeUTijeku(
      ucionica.id
    );

    const {
      error,
    } = await supabase
      .from("ucionice")
      .delete()
      .eq(
        "id",
        ucionica.id
      );

    if (error) {
      setGreska(
        "Učionicu nije moguće obrisati. Provjerite postoje li povezani podaci."
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
      ucionica.id
    ) {
      ocistiFormu();
    }

    setUspjeh(
      `Učionica "${ucionica.naziv}" je trajno obrisana.`
    );

    await ucitajUcionice();

    setBrisanjeUTijeku(
      null
    );
  }

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
              Učionice
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 md:px-8 md:py-9">
        <section className="max-w-3xl">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#17324d] text-white sm:flex">
              <DoorOpen
                size={23}
              />
            </div>

            <div>
              <h2 className="text-[28px] font-extrabold tracking-[-0.025em] text-[#17202a] md:text-[32px]">
                Upravljanje učionicama
              </h2>

              <p className="mt-2 text-[15px] leading-6 text-[#66717d]">
                Dodajte i uredite prostorije, evidentirajte
                kapacitet i opremu te upravljajte njihovom
                dostupnošću.
              </p>
            </div>
          </div>
        </section>

        {greska && (
          <div className="mt-6 rounded-[18px] border border-[#f2c7ca] bg-[#fff5f5] px-4 py-4 text-[14px] leading-6 text-[#a71d24]">
            {greska}
          </div>
        )}

        {uspjeh && (
          <div className="mt-6 rounded-[18px] border border-[#cde5d4] bg-[#f2faf4] px-4 py-4 text-[14px] leading-6 text-[#277442]">
            {uspjeh}
          </div>
        )}

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[420px_1fr]">
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
                    ? "Uredi učionicu"
                    : "Nova učionica"}
                </h2>

                <p className="mt-0.5 text-[13px] text-[#7a8590]">
                  {urediId
                    ? "Izmijenite podatke odabrane učionice."
                    : "Unesite podatke nove učionice."}
                </p>
              </div>
            </div>

            <form
              onSubmit={
                spremiUcionicu
              }
              className="mt-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="naziv-ucionice"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Naziv učionice
                  <span className="ml-1 text-[#c9252d]">
                    *
                  </span>
                </label>

                <input
                  id="naziv-ucionice"
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
                  placeholder="npr. Učionica 2"
                />
              </div>

              <div>
                <label
                  htmlFor="kapacitet"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Kapacitet
                </label>

                <input
                  id="kapacitet"
                  type="number"
                  min="1"
                  value={
                    kapacitet
                  }
                  onChange={(
                    e
                  ) =>
                    setKapacitet(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="npr. 20"
                />
              </div>

              <div>
                <label
                  htmlFor="lokacija"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Lokacija
                </label>

                <input
                  id="lokacija"
                  value={
                    lokacija
                  }
                  onChange={(
                    e
                  ) =>
                    setLokacija(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="npr. Prizemlje"
                />
              </div>

              <div>
                <label
                  htmlFor="oprema"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Oprema
                </label>

                <textarea
                  id="oprema"
                  value={
                    oprema
                  }
                  onChange={(
                    e
                  ) =>
                    setOprema(
                      e.target.value
                    )
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-[#d6dde3] bg-white px-4 py-3 text-[15px] leading-6 text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="Projektor, računalo, ploča..."
                />
              </div>

              <button
                type="submit"
                disabled={
                  spremanje ||
                  statusUTijeku !==
                    null ||
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
                  : "Dodaj učionicu"}
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
                  Popis učionica
                </h2>
              </div>

              <div className="shrink-0 rounded-xl border border-[#dfe5ea] bg-white px-3 py-2 text-[13px] font-semibold text-[#66717d]">
                Ukupno:{" "}
                <span className="font-bold text-[#17202a]">
                  {
                    ucionice.length
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
                    Učitavanje učionica...
                  </p>
                </div>
              </div>
            ) : ucionice.length ===
              0 ? (
              <div className="mt-4 rounded-[22px] border border-[#dfe5ea] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <DoorOpen
                    size={21}
                  />
                </div>

                <h3 className="mt-4 text-[19px] font-bold text-[#17202a]">
                  Još nema učionica
                </h3>

                <p className="mt-2 text-[14px] leading-6 text-[#66717d]">
                  Prvu učionicu možete dodati pomoću
                  obrasca.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {ucionice.map(
                  (
                    ucionica
                  ) => (
                    <article
                      key={
                        ucionica.id
                      }
                      className="rounded-[22px] border border-[#dfe5ea] bg-white p-5 shadow-[0_5px_18px_rgba(23,50,77,0.035)]"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="text-[18px] font-bold leading-6 text-[#17202a]">
                              {
                                ucionica.naziv
                              }
                            </h3>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                ucionica.aktivna
                                  ? "bg-[#edf7f0] text-[#277442]"
                                  : "bg-[#f0f2f4] text-[#69737c]"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  ucionica.aktivna
                                    ? "bg-[#35985a]"
                                    : "bg-[#89929a]"
                                }`}
                              />

                              {ucionica.aktivna
                                ? "Aktivna"
                                : "Neaktivna"}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {ucionica.kapacitet !==
                              null && (
                              <div className="flex items-start gap-2">
                                <Users
                                  size={17}
                                  className="mt-0.5 shrink-0 text-[#17324d]"
                                />

                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#8b949e]">
                                    Kapacitet
                                  </p>

                                  <p className="mt-0.5 text-[14px] font-semibold text-[#52606d]">
                                    {
                                      ucionica.kapacitet
                                    }{" "}
                                    osoba
                                  </p>
                                </div>
                              </div>
                            )}

                            {ucionica.lokacija && (
                              <div className="flex items-start gap-2">
                                <MapPin
                                  size={17}
                                  className="mt-0.5 shrink-0 text-[#17324d]"
                                />

                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#8b949e]">
                                    Lokacija
                                  </p>

                                  <p className="mt-0.5 text-[14px] font-semibold text-[#52606d]">
                                    {
                                      ucionica.lokacija
                                    }
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {ucionica.oprema && (
                            <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#f7f9fa] px-3 py-3">
                              <Monitor
                                size={17}
                                className="mt-0.5 shrink-0 text-[#17324d]"
                              />

                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#8b949e]">
                                  Oprema
                                </p>

                                <p className="mt-1 whitespace-pre-line text-[14px] leading-5 text-[#52606d]">
                                  {
                                    ucionica.oprema
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2 border-t border-[#edf0f2] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                          <button
                            type="button"
                            onClick={() =>
                              urediUcionicu(
                                ucionica
                              )
                            }
                            disabled={
                              brisanjeUTijeku !==
                                null ||
                              statusUTijeku !==
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
                              void promijeniStatus(
                                ucionica
                              )
                            }
                            disabled={
                              statusUTijeku !==
                                null ||
                              brisanjeUTijeku !==
                                null
                            }
                            className={`flex min-h-[42px] items-center gap-2 rounded-xl border px-3.5 text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              ucionica.aktivna
                                ? "border-[#d6dde3] bg-white text-[#52606d] hover:bg-[#f4f6f8]"
                                : "border-[#cce4d3] bg-white text-[#277442] hover:bg-[#f4fbf6]"
                            }`}
                          >
                            {statusUTijeku ===
                            ucionica.id ? (
                              <LoaderCircle
                                size={16}
                                className="animate-spin"
                              />
                            ) : ucionica.aktivna ? (
                              <Power
                                size={16}
                              />
                            ) : (
                              <CheckCircle2
                                size={16}
                              />
                            )}

                            {statusUTijeku ===
                            ucionica.id
                              ? "Spremanje..."
                              : ucionica.aktivna
                              ? "Deaktiviraj"
                              : "Aktiviraj"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void obrisiUcionicu(
                                ucionica
                              )
                            }
                            disabled={
                              brisanjeUTijeku !==
                                null ||
                              statusUTijeku !==
                                null ||
                              spremanje
                            }
                            className="flex min-h-[42px] items-center gap-2 rounded-xl border border-[#efc8cb] bg-white px-3.5 text-[13px] font-bold text-[#b52027] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {brisanjeUTijeku ===
                            ucionica.id ? (
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
                            ucionica.id
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