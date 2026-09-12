"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Ban,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DoorOpen,
  GraduationCap,
  Pencil,
  RotateCcw,
  Save,
  Search,
  School,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Skupina = {
  id: string;
  naziv: string;
  status: string;
};

type Profesor = {
  id: string;
  ime_prezime: string | null;
  aktivan: boolean;
};

type Ucionica = {
  id: string;
  naziv: string;
  aktivna: boolean;
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

type PrikazRasporeda =
  | "nadolazeca"
  | "sva";

type VrstaPushObavijesti =
  | "novo"
  | "promjena"
  | "otkazano";

export default function RasporedPage() {
  const router = useRouter();

  const [skupine, setSkupine] =
    useState<Skupina[]>([]);

  const [profesori, setProfesori] =
    useState<Profesor[]>([]);

  const [ucionice, setUcionice] =
    useState<Ucionica[]>([]);

  const [predavanja, setPredavanja] =
    useState<Predavanje[]>([]);

  const [naziv, setNaziv] =
    useState("");

  const [skupinaId, setSkupinaId] =
    useState("");

  const [profesorId, setProfesorId] =
    useState("");

  const [ucionicaId, setUcionicaId] =
    useState("");

  const [datum, setDatum] =
    useState("");

  const [pocetak, setPocetak] =
    useState("");

  const [zavrsetak, setZavrsetak] =
    useState("");

  const [napomena, setNapomena] =
    useState("");

  const [
    uredjivanjeId,
    setUredjivanjeId,
  ] = useState<string | null>(null);

  const [pretraga, setPretraga] =
    useState("");

  const [
    filterSkupina,
    setFilterSkupina,
  ] = useState("");

  const [
    filterProfesor,
    setFilterProfesor,
  ] = useState("");

  const [prikaz, setPrikaz] =
    useState<PrikazRasporeda>(
      "nadolazeca"
    );

  const [greska, setGreska] =
    useState("");

  const [uspjeh, setUspjeh] =
    useState("");

  const [spremanje, setSpremanje] =
    useState(false);

  const [ucitavanje, setUcitavanje] =
    useState(true);

  const [
    promjenaStatusaId,
    setPromjenaStatusaId,
  ] = useState<string | null>(null);

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
      profil.uloga !==
        "administrator" ||
      profil.aktivan !== true
    ) {
      router.replace("/login");
      return;
    }

    await ucitajPodatke();
  }

  async function ucitajPodatke() {
    setUcitavanje(true);
    setGreska("");

    const [
      skupineRez,
      profesoriRez,
      ucioniceRez,
      predavanjaRez,
    ] = await Promise.all([
      supabase
        .from(
          "obrazovne_skupine"
        )
        .select(
          "id, naziv, status"
        )
        .order("naziv"),

      supabase
        .from("profili")
        .select(
          "id, ime_prezime, aktivan"
        )
        .eq(
          "uloga",
          "profesor"
        )
        .order("ime_prezime"),

      supabase
        .from("ucionice")
        .select(
          "id, naziv, aktivna"
        )
        .order("naziv"),

      supabase
        .from("predavanja")
        .select(
          "id, skupina_id, profesor_id, ucionica_id, naziv, datum, vrijeme_pocetka, vrijeme_zavrsetka, napomena, status"
        )
        .order(
          "datum",
          {
            ascending: true,
          }
        )
        .order(
          "vrijeme_pocetka",
          {
            ascending: true,
          }
        ),
    ]);

    const prvaGreska =
      skupineRez.error ||
      profesoriRez.error ||
      ucioniceRez.error ||
      predavanjaRez.error;

    if (prvaGreska) {
      setGreska(
        "Nije moguće učitati raspored: " +
          prvaGreska.message
      );

      setUcitavanje(false);
      return;
    }

    setSkupine(
      skupineRez.data ?? []
    );

    setProfesori(
      profesoriRez.data ?? []
    );

    setUcionice(
      ucioniceRez.data ?? []
    );

    setPredavanja(
      predavanjaRez.data ??
        []
    );

    setUcitavanje(false);
  }

  async function posaljiPushRasporeda(
    predavanjeId: string,
    vrsta: VrstaPushObavijesti
  ): Promise<string | null> {
    try {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (
        !session?.access_token
      ) {
        return "Raspored je spremljen, ali push obavijest nije poslana jer je prijava istekla.";
      }

      const response =
        await fetch(
          "/api/admin/raspored/push",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body:
              JSON.stringify({
                predavanje_id:
                  predavanjeId,

                vrsta,
              }),
          }
        );

      const rezultat =
        await response.json();

      if (!response.ok) {
        return (
          rezultat.error ||
          "Raspored je spremljen, ali push obavijest nije poslana."
        );
      }

      return null;
    } catch (error) {
      console.error(
        "Push obavijest rasporeda:",
        error
      );

      return "Raspored je spremljen, ali push obavijest nije poslana.";
    }
  }

  function ocistiObrazac() {
    setNaziv("");
    setSkupinaId("");
    setProfesorId("");
    setUcionicaId("");
    setDatum("");
    setPocetak("");
    setZavrsetak("");
    setNapomena("");
    setUredjivanjeId(null);
  }

  async function spremiPredavanje(
    e: FormEvent
  ) {
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
      setGreska(
        "Popunite sva obavezna polja."
      );
      return;
    }

    if (
      zavrsetak <= pocetak
    ) {
      setGreska(
        "Vrijeme završetka mora biti nakon početka."
      );
      return;
    }

    setSpremanje(true);

    const podaci = {
      naziv: naziv.trim(),
      skupina_id: skupinaId,
      profesor_id:
        profesorId,
      ucionica_id:
        ucionicaId || null,
      datum,
      vrijeme_pocetka:
        pocetak,
      vrijeme_zavrsetka:
        zavrsetak,
      napomena:
        napomena.trim() ||
        null,
    };

    const bioUredjivanje =
      Boolean(uredjivanjeId);

    let spremljenoId:
      | string
      | null =
      uredjivanjeId;

    let greskaSpremanja:
      | string
      | null =
      null;

    if (uredjivanjeId) {
      const {
        error,
      } = await supabase
        .from("predavanja")
        .update(podaci)
        .eq(
          "id",
          uredjivanjeId
        );

      if (error) {
        greskaSpremanja =
          error.message;
      }
    } else {
      const {
        data,
        error,
      } = await supabase
        .from("predavanja")
        .insert({
          ...podaci,
          status:
            "planirano",
        })
        .select("id")
        .single();

      if (error) {
        greskaSpremanja =
          error.message;
      } else {
        spremljenoId =
          data.id;
      }
    }

    if (
      greskaSpremanja
    ) {
      setGreska(
        "Termin nije moguće spremiti: " +
          greskaSpremanja
      );

      setSpremanje(false);
      return;
    }

    let pushUpozorenje:
      | string
      | null =
      null;

    if (spremljenoId) {
      pushUpozorenje =
        await posaljiPushRasporeda(
          spremljenoId,
          bioUredjivanje
            ? "promjena"
            : "novo"
        );
    }

    ocistiObrazac();

    await ucitajPodatke();

    setUspjeh(
      bioUredjivanje
        ? "Promjene termina su uspješno spremljene."
        : "Predavanje je uspješno dodano."
    );

    if (
      pushUpozorenje
    ) {
      setGreska(
        pushUpozorenje
      );
    }

    setSpremanje(false);
  }

  function urediPredavanje(
    predavanje: Predavanje
  ) {
    setGreska("");
    setUspjeh("");

    setUredjivanjeId(
      predavanje.id
    );

    setNaziv(
      predavanje.naziv
    );

    setSkupinaId(
      predavanje.skupina_id
    );

    setProfesorId(
      predavanje.profesor_id
    );

    setUcionicaId(
      predavanje.ucionica_id ??
        ""
    );

    setDatum(
      predavanje.datum
    );

    setPocetak(
      predavanje.vrijeme_pocetka.slice(
        0,
        5
      )
    );

    setZavrsetak(
      predavanje.vrijeme_zavrsetka.slice(
        0,
        5
      )
    );

    setNapomena(
      predavanje.napomena ??
        ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function odustaniOdUredjivanja() {
    ocistiObrazac();
    setGreska("");
    setUspjeh("");
  }

  async function promijeniStatus(
    predavanje: Predavanje,
    noviStatus: string
  ) {
    setGreska("");
    setUspjeh("");

    if (
      noviStatus ===
      "otkazano"
    ) {
      const potvrda =
        window.confirm(
          `Želite li otkazati termin "${predavanje.naziv}"?`
        );

      if (!potvrda) {
        return;
      }
    }

    setPromjenaStatusaId(
      predavanje.id
    );

    const {
      error,
    } = await supabase
      .from("predavanja")
      .update({
        status:
          noviStatus,
      })
      .eq(
        "id",
        predavanje.id
      );

    if (error) {
      setGreska(
        "Status termina nije moguće promijeniti: " +
          error.message
      );

      setPromjenaStatusaId(
        null
      );

      return;
    }

    let pushUpozorenje:
      | string
      | null =
      null;

    if (
      noviStatus ===
      "otkazano"
    ) {
      pushUpozorenje =
        await posaljiPushRasporeda(
          predavanje.id,
          "otkazano"
        );
    }

    if (
      noviStatus ===
      "planirano"
    ) {
      pushUpozorenje =
        await posaljiPushRasporeda(
          predavanje.id,
          "promjena"
        );
    }

    await ucitajPodatke();

    if (
      noviStatus ===
      "otkazano"
    ) {
      setUspjeh(
        "Termin je otkazan."
      );
    } else if (
      noviStatus ===
      "odrzano"
    ) {
      setUspjeh(
        "Termin je označen kao održan."
      );
    } else {
      setUspjeh(
        "Termin je ponovno postavljen kao planiran."
      );
    }

    if (
      pushUpozorenje
    ) {
      setGreska(
        pushUpozorenje
      );
    }

    setPromjenaStatusaId(
      null
    );
  }

  function nazivSkupine(
    id: string
  ) {
    return (
      skupine.find(
        (skupina) =>
          skupina.id === id
      )?.naziv ??
      "Nepoznata skupina"
    );
  }

  function nazivProfesora(
    id: string
  ) {
    return (
      profesori.find(
        (profesor) =>
          profesor.id === id
      )?.ime_prezime ??
      "Nepoznat profesor"
    );
  }

  function nazivUcionice(
    id: string | null
  ) {
    if (!id) {
      return "Online / bez učionice";
    }

    return (
      ucionice.find(
        (ucionica) =>
          ucionica.id === id
      )?.naziv ??
      "Nepoznata učionica"
    );
  }

  function formatDatum(
    datumVrijednost: string
  ) {
    return new Date(
      datumVrijednost +
        "T12:00:00"
    ).toLocaleDateString(
      "hr-HR",
      {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  function terminJeBuduci(
    predavanje: Predavanje
  ) {
    const kraj = new Date(
      `${predavanje.datum}T${predavanje.vrijeme_zavrsetka}`
    );

    return kraj >= new Date();
  }

  const aktivniProfesori =
    profesori.filter(
      (profesor) =>
        profesor.aktivan
    );

  const nadolazecaPredavanja =
    predavanja.filter(
      (predavanje) =>
        predavanje.status !==
          "otkazano" &&
        terminJeBuduci(
          predavanje
        )
    );

  const otkazanaPredavanja =
    predavanja.filter(
      (predavanje) =>
        predavanje.status ===
        "otkazano"
    );

  const filtriranaPredavanja =
    useMemo(() => {
      let rezultat = [
        ...predavanja,
      ];

      if (
        prikaz ===
        "nadolazeca"
      ) {
        rezultat =
          rezultat.filter(
            (predavanje) =>
              terminJeBuduci(
                predavanje
              )
          );
      }

      if (filterSkupina) {
        rezultat =
          rezultat.filter(
            (predavanje) =>
              predavanje.skupina_id ===
              filterSkupina
          );
      }

      if (
        filterProfesor
      ) {
        rezultat =
          rezultat.filter(
            (predavanje) =>
              predavanje.profesor_id ===
              filterProfesor
          );
      }

      const pojam =
        pretraga
          .trim()
          .toLowerCase();

      if (pojam) {
        rezultat =
          rezultat.filter(
            (predavanje) => {
              const tekst = [
                predavanje.naziv,

                nazivSkupine(
                  predavanje.skupina_id
                ),

                nazivProfesora(
                  predavanje.profesor_id
                ),

                nazivUcionice(
                  predavanje.ucionica_id
                ),
              ]
                .join(" ")
                .toLowerCase();

              return tekst.includes(
                pojam
              );
            }
          );
      }

      return rezultat;
    }, [
      predavanja,
      prikaz,
      filterSkupina,
      filterProfesor,
      pretraga,
      skupine,
      profesori,
      ucionice,
    ]);

  function statusPostavke(
    status: string
  ) {
    if (
      status === "otkazano"
    ) {
      return {
        tekst: "Otkazano",
        klasa:
          "bg-red-100 text-red-700",
      };
    }

    if (
      status === "odrzano"
    ) {
      return {
        tekst: "Održano",
        klasa:
          "bg-green-100 text-green-700",
      };
    }

    return {
      tekst: "Planirano",
      klasa:
        "bg-[#eef3f7] text-[#17324d]",
    };
  }

  return (
    <main className="min-h-screen bg-[#f4f6f8]">
      <header className="border-b border-[#e2e7ec] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-5 md:px-8">
          <div>
            <div className="text-[27px] font-black tracking-[-0.02em] text-[#c9252d]">
              MAESTRO
            </div>

            <p className="mt-0.5 text-sm font-medium text-[#66717d]">
              Administracija Učilišta
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin"
              )
            }
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-[#d7dde3] bg-white px-4 text-sm font-bold text-[#17324d]"
          >
            <ArrowLeft
              size={18}
            />
            Natrag
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <section>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#c9252d]">
            Organizacija nastave
          </p>

          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.025em] text-[#17202a] md:text-4xl">
            Raspored predavanja
          </h1>

          <p className="mt-3 max-w-2xl text-[17px] leading-7 text-[#66717d]">
            Dodjeljujte profesore obrazovnim
            skupinama, planirajte termine i
            upravljajte učionicama.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#dce4ea] bg-white px-4 py-3 text-sm font-semibold text-[#52606d]">
            <BellRing
              size={18}
              className="text-[#17324d]"
            />

            Promjene rasporeda automatski šalju push obavijest.
          </div>
        </section>

        <section className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[20px] border border-[#dfe5ea] bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-wide text-[#8b949e]">
                  Nadolazeći
                </p>

                <p className="mt-2 text-3xl font-extrabold text-[#17202a]">
                  {
                    nadolazecaPredavanja.length
                  }
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                <CalendarDays
                  size={23}
                />
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-[#dfe5ea] bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-wide text-[#8b949e]">
                  Profesori
                </p>

                <p className="mt-2 text-3xl font-extrabold text-[#17202a]">
                  {
                    aktivniProfesori.length
                  }
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                <GraduationCap
                  size={24}
                />
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-[#dfe5ea] bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-wide text-[#8b949e]">
                  Otkazani
                </p>

                <p className="mt-2 text-3xl font-extrabold text-[#17202a]">
                  {
                    otkazanaPredavanja.length
                  }
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#c9252d]">
                <Ban size={23} />
              </div>
            </div>
          </div>
        </section>

        {greska && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            {greska}
          </div>
        )}

        {uspjeh && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-700">
            {uspjeh}
          </div>
        )}

        <div className="mt-8 grid gap-8 xl:grid-cols-[420px_1fr]">
          <section className="h-fit rounded-[22px] border border-[#dfe5ea] bg-white p-6 shadow-[0_5px_18px_rgba(23,50,77,0.04)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-wide text-[#c9252d]">
                  {uredjivanjeId
                    ? "Uređivanje"
                    : "Novi termin"}
                </p>

                <h2 className="mt-1 text-[22px] font-extrabold text-[#17202a]">
                  {uredjivanjeId
                    ? "Uredi predavanje"
                    : "Dodaj predavanje"}
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                {uredjivanjeId ? (
                  <Pencil
                    size={21}
                  />
                ) : (
                  <CalendarDays
                    size={21}
                  />
                )}
              </div>
            </div>

            {uredjivanjeId && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#fff8e8] p-3">
                <p className="text-sm font-semibold text-[#765d22]">
                  Uređujete postojeći termin.
                </p>

                <button
                  type="button"
                  onClick={
                    odustaniOdUredjivanja
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#66717d]"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <form
              onSubmit={
                spremiPredavanje
              }
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-bold text-[#28333e]">
                  Naziv predavanja *
                </label>

                <input
                  value={naziv}
                  onChange={(e) =>
                    setNaziv(
                      e.target.value
                    )
                  }
                  placeholder="npr. Osnove računovodstva"
                  className="w-full rounded-xl border border-[#d7dde3] bg-white px-4 py-3 outline-none focus:border-[#17324d]"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#28333e]">
                  <School size={17} />
                  Obrazovna skupina *
                </label>

                <select
                  value={skupinaId}
                  onChange={(e) =>
                    setSkupinaId(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#d7dde3] bg-white px-4 py-3 outline-none focus:border-[#17324d]"
                >
                  <option value="">
                    Odaberite skupinu
                  </option>

                  {skupine.map(
                    (skupina) => (
                      <option
                        key={
                          skupina.id
                        }
                        value={
                          skupina.id
                        }
                        disabled={
                          skupina.status !==
                          "aktivna"
                        }
                      >
                        {skupina.naziv}
                        {skupina.status !==
                        "aktivna"
                          ? " (neaktivna)"
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#28333e]">
                  <GraduationCap
                    size={18}
                  />
                  Profesor *
                </label>

                <select
                  value={profesorId}
                  onChange={(e) =>
                    setProfesorId(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#d7dde3] bg-white px-4 py-3 outline-none focus:border-[#17324d]"
                >
                  <option value="">
                    Odaberite profesora
                  </option>

                  {profesori.map(
                    (profesor) => (
                      <option
                        key={
                          profesor.id
                        }
                        value={
                          profesor.id
                        }
                        disabled={
                          !profesor.aktivan
                        }
                      >
                        {profesor.ime_prezime ??
                          "Profesor"}
                        {!profesor.aktivan
                          ? " (neaktivan)"
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#28333e]">
                  <DoorOpen
                    size={17}
                  />
                  Učionica
                </label>

                <select
                  value={ucionicaId}
                  onChange={(e) =>
                    setUcionicaId(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#d7dde3] bg-white px-4 py-3 outline-none focus:border-[#17324d]"
                >
                  <option value="">
                    Online / bez učionice
                  </option>

                  {ucionice.map(
                    (ucionica) => (
                      <option
                        key={
                          ucionica.id
                        }
                        value={
                          ucionica.id
                        }
                        disabled={
                          !ucionica.aktivna
                        }
                      >
                        {ucionica.naziv}
                        {!ucionica.aktivna
                          ? " (neaktivna)"
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#28333e]">
                  Datum *
                </label>

                <input
                  type="date"
                  value={datum}
                  onChange={(e) =>
                    setDatum(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#d7dde3] px-4 py-3 outline-none focus:border-[#17324d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#28333e]">
                    Početak *
                  </label>

                  <input
                    type="time"
                    value={pocetak}
                    onChange={(e) =>
                      setPocetak(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-[#d7dde3] px-3 py-3 outline-none focus:border-[#17324d]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#28333e]">
                    Završetak *
                  </label>

                  <input
                    type="time"
                    value={zavrsetak}
                    onChange={(e) =>
                      setZavrsetak(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-[#d7dde3] px-3 py-3 outline-none focus:border-[#17324d]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#28333e]">
                  Napomena
                </label>

                <textarea
                  value={napomena}
                  onChange={(e) =>
                    setNapomena(
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Dodatne informacije o terminu..."
                  className="w-full resize-none rounded-xl border border-[#d7dde3] px-4 py-3 outline-none focus:border-[#17324d]"
                />
              </div>

              <button
                type="submit"
                disabled={
                  spremanje
                }
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#17324d] px-5 font-bold text-white disabled:opacity-50"
              >
                <Save size={19} />

                {spremanje
                  ? "Spremanje..."
                  : uredjivanjeId
                    ? "Spremi promjene"
                    : "Dodaj predavanje"}
              </button>

              {uredjivanjeId && (
                <button
                  type="button"
                  onClick={
                    odustaniOdUredjivanja
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d7dde3] bg-white px-5 font-bold text-[#66717d]"
                >
                  Odustani od uređivanja
                </button>
              )}
            </form>
          </section>

          <section className="min-w-0">
            <div className="rounded-[22px] border border-[#dfe5ea] bg-white p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-[13px] font-bold uppercase tracking-wide text-[#c9252d]">
                    Pregled
                  </p>

                  <h2 className="mt-1 text-[22px] font-extrabold text-[#17202a]">
                    Termini nastave
                  </h2>
                </div>

                <div className="flex rounded-xl bg-[#f4f6f8] p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setPrikaz(
                        "nadolazeca"
                      )
                    }
                    className={`rounded-lg px-3 py-2 text-sm font-bold ${
                      prikaz ===
                      "nadolazeca"
                        ? "bg-white text-[#17324d] shadow-sm"
                        : "text-[#66717d]"
                    }`}
                  >
                    Nadolazeći
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPrikaz(
                        "sva"
                      )
                    }
                    className={`rounded-lg px-3 py-2 text-sm font-bold ${
                      prikaz === "sva"
                        ? "bg-white text-[#17324d] shadow-sm"
                        : "text-[#66717d]"
                    }`}
                  >
                    Svi
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-3">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]"
                  />

                  <input
                    value={pretraga}
                    onChange={(e) =>
                      setPretraga(
                        e.target.value
                      )
                    }
                    placeholder="Pretraži..."
                    className="w-full rounded-xl border border-[#d7dde3] py-3 pl-10 pr-4 outline-none focus:border-[#17324d]"
                  />
                </div>

                <select
                  value={
                    filterSkupina
                  }
                  onChange={(e) =>
                    setFilterSkupina(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#d7dde3] bg-white px-4 py-3 outline-none focus:border-[#17324d]"
                >
                  <option value="">
                    Sve skupine
                  </option>

                  {skupine.map(
                    (skupina) => (
                      <option
                        key={
                          skupina.id
                        }
                        value={
                          skupina.id
                        }
                      >
                        {
                          skupina.naziv
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    filterProfesor
                  }
                  onChange={(e) =>
                    setFilterProfesor(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#d7dde3] bg-white px-4 py-3 outline-none focus:border-[#17324d]"
                >
                  <option value="">
                    Svi profesori
                  </option>

                  {profesori.map(
                    (profesor) => (
                      <option
                        key={
                          profesor.id
                        }
                        value={
                          profesor.id
                        }
                      >
                        {profesor.ime_prezime ??
                          "Profesor"}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-[#66717d]">
                Prikazano:{" "}
                {
                  filtriranaPredavanja.length
                }
              </p>

              {(pretraga ||
                filterSkupina ||
                filterProfesor) && (
                <button
                  type="button"
                  onClick={() => {
                    setPretraga("");
                    setFilterSkupina(
                      ""
                    );
                    setFilterProfesor(
                      ""
                    );
                  }}
                  className="text-sm font-bold text-[#17324d]"
                >
                  Očisti filtre
                </button>
              )}
            </div>

            {ucitavanje ? (
              <div className="mt-4 rounded-[22px] border border-[#dfe5ea] bg-white p-6 text-[#66717d]">
                Učitavanje rasporeda...
              </div>
            ) : filtriranaPredavanja.length ===
              0 ? (
              <div className="mt-4 rounded-[22px] border border-[#dfe5ea] bg-white p-6">
                <CalendarDays
                  size={27}
                  className="text-[#17324d]"
                />

                <h3 className="mt-4 text-lg font-bold text-[#17202a]">
                  Nema termina
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#66717d]">
                  Nema termina koji odgovaraju odabranim filtrima.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {filtriranaPredavanja.map(
                  (predavanje) => {
                    const status =
                      statusPostavke(
                        predavanje.status
                      );

                    return (
                      <article
                        key={
                          predavanje.id
                        }
                        className={`overflow-hidden rounded-[22px] border bg-white shadow-[0_5px_18px_rgba(23,50,77,0.04)] ${
                          predavanje.status ===
                          "otkazano"
                            ? "border-red-200"
                            : "border-[#dfe5ea]"
                        }`}
                      >
                        <div className="p-5">
                          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${status.klasa}`}
                                >
                                  {
                                    status.tekst
                                  }
                                </span>

                                <span className="text-sm font-semibold capitalize text-[#66717d]">
                                  {formatDatum(
                                    predavanje.datum
                                  )}
                                </span>
                              </div>

                              <h3 className="mt-3 text-[21px] font-extrabold leading-tight text-[#17202a]">
                                {
                                  predavanje.naziv
                                }
                              </h3>

                              <p className="mt-2 font-bold text-[#c9252d]">
                                {nazivSkupine(
                                  predavanje.skupina_id
                                )}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                urediPredavanje(
                                  predavanje
                                )
                              }
                              className="flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl border border-[#d7dde3] bg-white px-4 text-sm font-bold text-[#17324d]"
                            >
                              <Pencil
                                size={16}
                              />
                              Uredi
                            </button>
                          </div>

                          <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <div className="flex items-center gap-3 rounded-xl bg-[#f6f7f9] p-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#17324d]">
                                <Clock3
                                  size={19}
                                />
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-[#8b949e]">
                                  Vrijeme
                                </p>

                                <p className="mt-0.5 font-semibold text-[#28333e]">
                                  {predavanje.vrijeme_pocetka.slice(
                                    0,
                                    5
                                  )}
                                  {" – "}
                                  {predavanje.vrijeme_zavrsetka.slice(
                                    0,
                                    5
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-xl bg-[#f6f7f9] p-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#17324d]">
                                <GraduationCap
                                  size={20}
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-wide text-[#8b949e]">
                                  Profesor
                                </p>

                                <p className="mt-0.5 truncate font-semibold text-[#28333e]">
                                  {nazivProfesora(
                                    predavanje.profesor_id
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-xl bg-[#f6f7f9] p-3 sm:col-span-2">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#17324d]">
                                <DoorOpen
                                  size={19}
                                />
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-[#8b949e]">
                                  Učionica
                                </p>

                                <p className="mt-0.5 font-semibold text-[#28333e]">
                                  {nazivUcionice(
                                    predavanje.ucionica_id
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>

                          {predavanje.napomena && (
                            <div className="mt-4 rounded-xl border border-[#e6eaed] bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-wide text-[#8b949e]">
                                Napomena
                              </p>

                              <p className="mt-1 text-sm leading-6 text-[#52606d]">
                                {
                                  predavanje.napomena
                                }
                              </p>
                            </div>
                          )}

                          <div className="mt-5 flex flex-wrap gap-2 border-t border-[#e8ecef] pt-4">
                            {predavanje.status ===
                            "planirano" ? (
                              <>
                                <button
                                  type="button"
                                  disabled={
                                    promjenaStatusaId ===
                                    predavanje.id
                                  }
                                  onClick={() =>
                                    promijeniStatus(
                                      predavanje,
                                      "odrzano"
                                    )
                                  }
                                  className="flex min-h-[42px] items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 text-sm font-bold text-green-700 disabled:opacity-50"
                                >
                                  <CheckCircle2
                                    size={17}
                                  />
                                  Održano
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    promjenaStatusaId ===
                                    predavanje.id
                                  }
                                  onClick={() =>
                                    promijeniStatus(
                                      predavanje,
                                      "otkazano"
                                    )
                                  }
                                  className="flex min-h-[42px] items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 disabled:opacity-50"
                                >
                                  <Ban
                                    size={17}
                                  />
                                  Otkaži
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                disabled={
                                  promjenaStatusaId ===
                                  predavanje.id
                                }
                                onClick={() =>
                                  promijeniStatus(
                                    predavanje,
                                    "planirano"
                                  )
                                }
                                className="flex min-h-[42px] items-center gap-2 rounded-xl border border-[#d7dde3] bg-white px-4 text-sm font-bold text-[#17324d] disabled:opacity-50"
                              >
                                <RotateCcw
                                  size={17}
                                />
                                Vrati na planirano
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}