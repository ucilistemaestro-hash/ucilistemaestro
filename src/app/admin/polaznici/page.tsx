"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  LoaderCircle,
  Mail,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";

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
  id: string;
  korisnik_id: string;
  skupina_id: string;
  status: string;
};

export default function PolazniciPage() {
  const router = useRouter();

  const [skupine, setSkupine] =
    useState<Skupina[]>([]);

  const [polaznici, setPolaznici] =
    useState<Polaznik[]>([]);

  const [clanstva, setClanstva] =
    useState<Clanstvo[]>([]);

  const [
    imePrezime,
    setImePrezime,
  ] = useState("");

  const [email, setEmail] =
    useState("");

  const [lozinka, setLozinka] =
    useState("");

  const [
    skupinaId,
    setSkupinaId,
  ] = useState("");

  const [
    ucitavanje,
    setUcitavanje,
  ] = useState(true);

  const [
    spremanje,
    setSpremanje,
  ] = useState(false);

  const [
    akcijaUTijeku,
    setAkcijaUTijeku,
  ] =
    useState<string | null>(
      null
    );

  const [
    odabranaSkupina,
    setOdabranaSkupina,
  ] = useState<
    Record<string, string>
  >({});

  const [greska, setGreska] =
    useState("");

  const [uspjeh, setUspjeh] =
    useState("");

  useEffect(() => {
    void provjeriPristup();
  }, []);

  async function provjeriPristup() {
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

    await ucitajPodatke();
  }

  async function ucitajPodatke() {
    setUcitavanje(true);
    setGreska("");

    const [
      skupineRez,
      polazniciRez,
      clanstvaRez,
    ] =
      await Promise.all([
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
            "id, ime_prezime, email, aktivan"
          )
          .eq(
            "uloga",
            "polaznik"
          )
          .order(
            "ime_prezime"
          ),

        supabase
          .from(
            "clanstva_skupina"
          )
          .select(
            "id, korisnik_id, skupina_id, status"
          ),
      ]);

    if (
      skupineRez.error
    ) {
      setGreska(
        "Nije moguće učitati obrazovne skupine."
      );
    }

    if (
      polazniciRez.error
    ) {
      setGreska(
        "Nije moguće učitati polaznike."
      );
    }

    if (
      clanstvaRez.error
    ) {
      setGreska(
        "Nije moguće učitati članstva skupina."
      );
    }

    setSkupine(
      skupineRez.data ??
        []
    );

    setPolaznici(
      polazniciRez.data ??
        []
    );

    setClanstva(
      clanstvaRez.data ??
        []
    );

    setUcitavanje(false);
  }

  async function dodajPolaznika(
    e: FormEvent
  ) {
    e.preventDefault();

    setGreska("");
    setUspjeh("");

    if (
      !imePrezime.trim()
    ) {
      setGreska(
        "Ime i prezime su obavezni."
      );
      return;
    }

    if (!email.trim()) {
      setGreska(
        "E-mail je obavezan."
      );
      return;
    }

    if (
      lozinka.length < 8
    ) {
      setGreska(
        "Privremena lozinka mora imati najmanje 8 znakova."
      );
      return;
    }

    if (!skupinaId) {
      setGreska(
        "Odaberite obrazovnu skupinu."
      );
      return;
    }

    setSpremanje(true);

    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    if (!session) {
      setGreska(
        "Vaša prijava je istekla. Prijavite se ponovno."
      );

      setSpremanje(false);
      return;
    }

    try {
      const odgovor =
        await fetch(
          "/api/admin/polaznici",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify(
              {
                ime_prezime:
                  imePrezime.trim(),

                email:
                  email.trim(),

                lozinka,

                skupina_id:
                  skupinaId,
              }
            ),
          }
        );

      const rezultat =
        await odgovor.json();

      if (!odgovor.ok) {
        setGreska(
          rezultat.error ??
            "Polaznika nije moguće dodati."
        );

        return;
      }

      setImePrezime("");
      setEmail("");
      setLozinka("");
      setSkupinaId("");

      setUspjeh(
        "Polaznik je uspješno dodan."
      );

      await ucitajPodatke();
    } catch (error) {
      console.error(
        "Greška dodavanja polaznika:",
        error
      );

      setGreska(
        "Polaznika trenutačno nije moguće dodati."
      );
    } finally {
      setSpremanje(false);
    }
  }

  function aktivnaClanstvaPolaznika(
    korisnikId: string
  ) {
    return clanstva.filter(
      (clanstvo) =>
        clanstvo.korisnik_id ===
          korisnikId &&
        clanstvo.status ===
          "aktivan"
    );
  }

  function nazivSkupine(
    trazenaSkupinaId: string
  ) {
    return (
      skupine.find(
        (skupina) =>
          skupina.id ===
          trazenaSkupinaId
      )?.naziv ??
      "Nepoznata skupina"
    );
  }

  function danasnjiDatum() {
    const danas =
      new Date();

    const godina =
      danas.getFullYear();

    const mjesec =
      String(
        danas.getMonth() +
          1
      ).padStart(
        2,
        "0"
      );

    const dan =
      String(
        danas.getDate()
      ).padStart(
        2,
        "0"
      );

    return `${godina}-${mjesec}-${dan}`;
  }

  async function makniIzSkupine(
    polaznik: Polaznik,
    clanstvo: Clanstvo
  ) {
    if (akcijaUTijeku) {
      return;
    }

    setGreska("");
    setUspjeh("");

    const naziv =
      nazivSkupine(
        clanstvo.skupina_id
      );

    const potvrda =
      window.confirm(
        `Želite li maknuti polaznika "${polaznik.ime_prezime || polaznik.email || "Polaznik"}" iz skupine "${naziv}"?\n\nPolaznik neće biti obrisan. Članstvo će biti arhivirano.`
      );

    if (!potvrda) {
      return;
    }

    const akcijaId =
      `clanstvo-${clanstvo.id}`;

    setAkcijaUTijeku(
      akcijaId
    );

    const {
      error,
    } = await supabase
      .from(
        "clanstva_skupina"
      )
      .update({
        status:
          "arhiviran",

        datum_zavrsetka:
          danasnjiDatum(),
      })
      .eq(
        "id",
        clanstvo.id
      );

    if (error) {
      setGreska(
        "Polaznika nije moguće maknuti iz obrazovne skupine."
      );

      setAkcijaUTijeku(
        null
      );

      return;
    }

    setUspjeh(
      `Polaznik je maknut iz skupine "${naziv}".`
    );

    await ucitajPodatke();

    setAkcijaUTijeku(
      null
    );
  }

  async function dodajUSkupinu(
    polaznik: Polaznik
  ) {
    if (akcijaUTijeku) {
      return;
    }

    setGreska("");
    setUspjeh("");

    const novaSkupinaId =
      odabranaSkupina[
        polaznik.id
      ];

    if (!novaSkupinaId) {
      setGreska(
        "Odaberite skupinu u koju želite dodati polaznika."
      );
      return;
    }

    const novaSkupinaNaziv =
      nazivSkupine(
        novaSkupinaId
      );

    const prikazImena =
      polaznik.ime_prezime ||
      polaznik.email ||
      "Polaznik";

    const potvrda =
      window.confirm(
        `Želite li dodati polaznika "${prikazImena}" u skupinu "${novaSkupinaNaziv}"?`
      );

    if (!potvrda) {
      return;
    }

    const akcijaId =
      `dodaj-${polaznik.id}`;

    setAkcijaUTijeku(
      akcijaId
    );

    const postojeceClanstvo =
      clanstva.find(
        (clanstvo) =>
          clanstvo.korisnik_id ===
            polaznik.id &&
          clanstvo.skupina_id ===
            novaSkupinaId
      );

    if (
      postojeceClanstvo
    ) {
      const {
        error,
      } = await supabase
        .from(
          "clanstva_skupina"
        )
        .update({
          status:
            "aktivan",

          datum_zavrsetka:
            null,
        })
        .eq(
          "id",
          postojeceClanstvo.id
        );

      if (error) {
        setGreska(
          "Polaznika nije moguće vratiti u obrazovnu skupinu."
        );

        setAkcijaUTijeku(
          null
        );

        return;
      }
    } else {
      const {
        error,
      } = await supabase
        .from(
          "clanstva_skupina"
        )
        .insert({
          korisnik_id:
            polaznik.id,

          skupina_id:
            novaSkupinaId,

          status:
            "aktivan",

          datum_upisa:
            danasnjiDatum(),

          datum_zavrsetka:
            null,
        });

      if (error) {
        setGreska(
          "Polaznika nije moguće dodati u obrazovnu skupinu."
        );

        setAkcijaUTijeku(
          null
        );

        return;
      }
    }

    setOdabranaSkupina(
      (prethodno) => ({
        ...prethodno,
        [polaznik.id]: "",
      })
    );

    setUspjeh(
      `Polaznik "${prikazImena}" dodan je u skupinu "${novaSkupinaNaziv}".`
    );

    await ucitajPodatke();

    setAkcijaUTijeku(
      null
    );
  }

  async function obrisiPolaznika(
    polaznik: Polaznik
  ) {
    if (akcijaUTijeku) {
      return;
    }

    setGreska("");
    setUspjeh("");

    const prikazImena =
      polaznik.ime_prezime ||
      polaznik.email ||
      "Polaznik";

    const potvrda =
      window.confirm(
        `Želite li TRAJNO obrisati polaznika "${prikazImena}"?\n\nBit će obrisan njegov korisnički račun i članstva u obrazovnim skupinama.\n\nOvu radnju nije moguće poništiti.`
      );

    if (!potvrda) {
      return;
    }

    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    if (!session) {
      setGreska(
        "Vaša prijava je istekla. Prijavite se ponovno."
      );
      return;
    }

    const akcijaId =
      `polaznik-${polaznik.id}`;

    setAkcijaUTijeku(
      akcijaId
    );

    try {
      const odgovor =
        await fetch(
          "/api/admin/polaznici/obrisi",
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify(
              {
                korisnik_id:
                  polaznik.id,
              }
            ),
          }
        );

      const rezultat =
        await odgovor.json();

      if (!odgovor.ok) {
        setGreska(
          rezultat.error ??
            "Polaznika nije moguće obrisati."
        );

        return;
      }

      setUspjeh(
        `Polaznik "${prikazImena}" je trajno obrisan.`
      );

      await ucitajPodatke();
    } catch (error) {
      console.error(
        "Greška brisanja polaznika:",
        error
      );

      setGreska(
        "Polaznika trenutačno nije moguće obrisati."
      );
    } finally {
      setAkcijaUTijeku(
        null
      );
    }
  }

  const skupineZaUpis =
    skupine.filter(
      (skupina) =>
        skupina.status ===
          "aktivna" ||
        skupina.status ===
          "u_pripremi"
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
              Polaznici
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 md:px-8 md:py-9">
        <section className="max-w-3xl">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#17324d] text-white sm:flex">
              <Users
                size={23}
              />
            </div>

            <div>
              <h2 className="text-[28px] font-extrabold tracking-[-0.025em] text-[#17202a] md:text-[32px]">
                Upravljanje polaznicima
              </h2>

              <p className="mt-2 text-[15px] leading-6 text-[#66717d]">
                Dodajte polaznike, rasporedite ih u
                obrazovne skupine ili upravljajte
                njihovim postojećim članstvima.
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                <UserPlus
                  size={20}
                />
              </div>

              <div>
                <h2 className="text-[19px] font-bold text-[#17202a]">
                  Novi polaznik
                </h2>

                <p className="mt-0.5 text-[13px] text-[#7a8590]">
                  Kreirajte korisnički račun i
                  odaberite skupinu.
                </p>
              </div>
            </div>

            <form
              onSubmit={
                dodajPolaznika
              }
              className="mt-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="ime-prezime"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Ime i prezime
                  <span className="ml-1 text-[#c9252d]">
                    *
                  </span>
                </label>

                <input
                  id="ime-prezime"
                  value={
                    imePrezime
                  }
                  onChange={(
                    e
                  ) =>
                    setImePrezime(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="npr. Ivan Horvat"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  E-mail
                  <span className="ml-1 text-[#c9252d]">
                    *
                  </span>
                </label>

                <input
                  id="email"
                  type="email"
                  value={
                    email
                  }
                  onChange={(
                    e
                  ) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="ivan@email.hr"
                />
              </div>

              <div>
                <label
                  htmlFor="lozinka"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Privremena lozinka
                  <span className="ml-1 text-[#c9252d]">
                    *
                  </span>
                </label>

                <input
                  id="lozinka"
                  type="password"
                  value={
                    lozinka
                  }
                  onChange={(
                    e
                  ) =>
                    setLozinka(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="Najmanje 8 znakova"
                />

                <p className="mt-2 text-[12px] leading-5 text-[#7a8590]">
                  Privremenu lozinku dostavite
                  polazniku sigurnim putem.
                </p>
              </div>

              <div>
                <label
                  htmlFor="skupina"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Obrazovna skupina
                  <span className="ml-1 text-[#c9252d]">
                    *
                  </span>
                </label>

                <select
                  id="skupina"
                  value={
                    skupinaId
                  }
                  onChange={(
                    e
                  ) =>
                    setSkupinaId(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                >
                  <option value="">
                    Odaberite skupinu
                  </option>

                  {skupineZaUpis.map(
                    (
                      skupina
                    ) => (
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
              </div>

              <button
                type="submit"
                disabled={
                  spremanje ||
                  akcijaUTijeku !==
                    null
                }
                className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#17324d] px-5 text-[15px] font-bold text-white transition hover:bg-[#102437] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {spremanje ? (
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                ) : (
                  <Plus
                    size={19}
                  />
                )}

                {spremanje
                  ? "Dodavanje..."
                  : "Dodaj polaznika"}
              </button>
            </form>
          </section>

          <section className="min-w-0">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.09em] text-[#c9252d]">
                  Evidencija
                </p>

                <h2 className="mt-1 text-[22px] font-extrabold text-[#17202a]">
                  Popis polaznika
                </h2>
              </div>

              <div className="shrink-0 rounded-xl border border-[#dfe5ea] bg-white px-3 py-2 text-[13px] font-semibold text-[#66717d]">
                Ukupno:{" "}
                <span className="font-bold text-[#17202a]">
                  {
                    polaznici.length
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
                    Učitavanje polaznika...
                  </p>
                </div>
              </div>
            ) : polaznici.length ===
              0 ? (
              <div className="mt-4 rounded-[22px] border border-[#dfe5ea] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <Users
                    size={21}
                  />
                </div>

                <h3 className="mt-4 text-[19px] font-bold text-[#17202a]">
                  Još nema polaznika
                </h3>

                <p className="mt-2 text-[14px] leading-6 text-[#66717d]">
                  Prvog polaznika možete dodati
                  pomoću obrasca.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {polaznici.map(
                  (
                    polaznik
                  ) => {
                    const aktivnaClanstva =
                      aktivnaClanstvaPolaznika(
                        polaznik.id
                      );

                    const aktivneSkupineIds =
                      aktivnaClanstva.map(
                        (
                          clanstvo
                        ) =>
                          clanstvo.skupina_id
                      );

                    const dostupneSkupine =
                      skupineZaUpis.filter(
                        (
                          skupina
                        ) =>
                          !aktivneSkupineIds.includes(
                            skupina.id
                          )
                      );

                    const brisanjeId =
                      `polaznik-${polaznik.id}`;

                    const dodavanjeId =
                      `dodaj-${polaznik.id}`;

                    return (
                      <article
                        key={
                          polaznik.id
                        }
                        className="rounded-[22px] border border-[#dfe5ea] bg-white p-5 shadow-[0_5px_18px_rgba(23,50,77,0.035)]"
                      >
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef3f7] text-[#17324d]">
                                <UserRound
                                  size={21}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-[18px] font-bold leading-6 text-[#17202a]">
                                    {polaznik.ime_prezime ||
                                      "Bez imena"}
                                  </h3>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                      polaznik.aktivan
                                        ? "bg-[#edf7f0] text-[#277442]"
                                        : "bg-[#f0f2f4] text-[#69737c]"
                                    }`}
                                  >
                                    {polaznik.aktivan
                                      ? "Aktivan"
                                      : "Neaktivan"}
                                  </span>
                                </div>

                                {polaznik.email && (
                                  <a
                                    href={`mailto:${polaznik.email}`}
                                    className="mt-2 flex items-start gap-2 text-[14px] text-[#66717d] transition hover:text-[#c9252d]"
                                  >
                                    <Mail
                                      size={16}
                                      className="mt-0.5 shrink-0"
                                    />

                                    <span className="break-all">
                                      {
                                        polaznik.email
                                      }
                                    </span>
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 border-t border-[#edf0f2] pt-4">
                              <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                                Aktivne obrazovne skupine
                              </p>

                              {aktivnaClanstva.length ===
                              0 ? (
                                <p className="mt-2 text-[14px] italic text-[#929ba4]">
                                  Polaznik trenutačno nije
                                  raspoređen u aktivnu
                                  skupinu.
                                </p>
                              ) : (
                                <div className="mt-2 space-y-2">
                                  {aktivnaClanstva.map(
                                    (
                                      clanstvo
                                    ) => {
                                      const akcijaId =
                                        `clanstvo-${clanstvo.id}`;

                                      return (
                                        <div
                                          key={
                                            clanstvo.id
                                          }
                                          className="flex flex-col gap-2 rounded-xl bg-[#f7f9fa] px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                          <div className="flex min-w-0 items-center gap-2">
                                            <Users
                                              size={17}
                                              className="shrink-0 text-[#17324d]"
                                            />

                                            <span className="text-[14px] font-semibold text-[#384550]">
                                              {nazivSkupine(
                                                clanstvo.skupina_id
                                              )}
                                            </span>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              void makniIzSkupine(
                                                polaznik,
                                                clanstvo
                                              )
                                            }
                                            disabled={
                                              akcijaUTijeku !==
                                              null
                                            }
                                            className="flex min-h-[38px] shrink-0 items-center justify-center gap-2 rounded-lg border border-[#d6dde3] bg-white px-3 text-[12px] font-bold text-[#52606d] transition hover:bg-[#f0f3f5] disabled:cursor-not-allowed disabled:opacity-60"
                                          >
                                            {akcijaUTijeku ===
                                            akcijaId ? (
                                              <LoaderCircle
                                                size={15}
                                                className="animate-spin"
                                              />
                                            ) : (
                                              <UserMinus
                                                size={15}
                                              />
                                            )}

                                            {akcijaUTijeku ===
                                            akcijaId
                                              ? "Micanje..."
                                              : "Makni iz skupine"}
                                          </button>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="mt-4 border-t border-[#edf0f2] pt-4">
                              <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#8b949e]">
                                Dodaj u skupinu
                              </p>

                              {dostupneSkupine.length ===
                              0 ? (
                                <p className="mt-2 text-[14px] italic text-[#929ba4]">
                                  Nema drugih aktivnih skupina
                                  za dodavanje.
                                </p>
                              ) : (
                                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                  <select
                                    value={
                                      odabranaSkupina[
                                        polaznik.id
                                      ] ?? ""
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      setOdabranaSkupina(
                                        (
                                          prethodno
                                        ) => ({
                                          ...prethodno,

                                          [polaznik.id]:
                                            e.target.value,
                                        })
                                      )
                                    }
                                    className="min-h-[42px] min-w-0 flex-1 rounded-xl border border-[#d6dde3] bg-white px-3 text-[14px] text-[#17202a] outline-none focus:border-[#17324d]"
                                  >
                                    <option value="">
                                      Odaberite skupinu
                                    </option>

                                    {dostupneSkupine.map(
                                      (
                                        skupina
                                      ) => (
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

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void dodajUSkupinu(
                                        polaznik
                                      )
                                    }
                                    disabled={
                                      akcijaUTijeku !==
                                        null ||
                                      !odabranaSkupina[
                                        polaznik.id
                                      ]
                                    }
                                    className="flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#17324d] px-4 text-[13px] font-bold text-white transition hover:bg-[#102437] disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {akcijaUTijeku ===
                                    dodavanjeId ? (
                                      <LoaderCircle
                                        size={16}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <UserPlus
                                        size={16}
                                      />
                                    )}

                                    {akcijaUTijeku ===
                                    dodavanjeId
                                      ? "Dodavanje..."
                                      : "Dodaj u skupinu"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 border-t border-[#edf0f2] pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                            <button
                              type="button"
                              onClick={() =>
                                void obrisiPolaznika(
                                  polaznik
                                )
                              }
                              disabled={
                                akcijaUTijeku !==
                                  null ||
                                spremanje
                              }
                              className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-[#efc8cb] bg-white px-3.5 text-[13px] font-bold text-[#b52027] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-60 xl:w-auto"
                            >
                              {akcijaUTijeku ===
                              brisanjeId ? (
                                <LoaderCircle
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={16}
                                />
                              )}

                              {akcijaUTijeku ===
                              brisanjeId
                                ? "Brisanje..."
                                : "Obriši polaznika"}
                            </button>
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