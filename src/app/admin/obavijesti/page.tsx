"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCircle2,
  ExternalLink,
  Link as LinkIcon,
  LoaderCircle,
  Megaphone,
  MessageSquareText,
  Power,
  Send,
  Trash2,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Skupina = {
  id: string;
  naziv: string;
  status: string;
};

type Obavijest = {
  id: string;
  naslov: string;
  poruka: string;
  link: string | null;
  cilj: string;
  skupina_id: string | null;
  korisnik_id: string | null;
  aktivna: boolean;
  datum_objave: string;
};

type PushOdgovor = {
  success?: boolean;
  poslano?: boolean;
  brojKorisnika?: number;
  pushId?: string | null;
  message?: string;
  error?: string;
};

const PRODUKCIJSKA_DOMENA =
  "app.uciliste-maestro.hr";

export default function ObavijestiPage() {
  const router = useRouter();

  const [skupine, setSkupine] =
    useState<Skupina[]>([]);

  const [obavijesti, setObavijesti] =
    useState<Obavijest[]>([]);

  const [naslov, setNaslov] =
    useState("");

  const [poruka, setPoruka] =
    useState("");

  const [link, setLink] =
    useState("");

  const [cilj, setCilj] =
    useState("svi");

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
    upozorenje,
    setUpozorenje,
  ] = useState("");

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

    await ucitajPodatke();
  }

  async function ucitajPodatke() {
    setUcitavanje(true);

    const [
      skupineRez,
      obavijestiRez,
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
          .from("obavijesti")
          .select(
            "id, naslov, poruka, link, cilj, skupina_id, korisnik_id, aktivna, datum_objave"
          )
          .order(
            "datum_objave",
            {
              ascending: false,
            }
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
      obavijestiRez.error
    ) {
      setGreska(
        "Nije moguće učitati obavijesti."
      );
    }

    setSkupine(
      skupineRez.data ??
        []
    );

    setObavijesti(
      obavijestiRez.data ??
        []
    );

    setUcitavanje(false);
  }

  async function procitajPushOdgovor(
    odgovor: Response
  ): Promise<PushOdgovor> {
    const tekst =
      await odgovor.text();

    if (!tekst) {
      return {};
    }

    try {
      return JSON.parse(
        tekst
      ) as PushOdgovor;
    } catch {
      return {
        error:
          "Poslužitelj je vratio neočekivan odgovor.",
      };
    }
  }

  async function posaljiObavijest(
    e: FormEvent
  ) {
    e.preventDefault();

    setGreska("");
    setUspjeh("");
    setUpozorenje("");

    const cistiNaslov =
      naslov.trim();

    const cistaPoruka =
      poruka.trim();

    const cistiLink =
      link.trim();

    if (
      !cistiNaslov ||
      !cistaPoruka
    ) {
      setGreska(
        "Naslov i poruka su obavezni."
      );
      return;
    }

    if (
      cilj === "skupina" &&
      !skupinaId
    ) {
      setGreska(
        "Odaberite obrazovnu skupinu."
      );
      return;
    }

    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    if (
      !session?.user ||
      !session.access_token
    ) {
      setGreska(
        "Prijava je istekla. Prijavite se ponovno."
      );
      return;
    }

    setSpremanje(true);

    try {
      const {
        error:
          spremanjeError,
      } = await supabase
        .from("obavijesti")
        .insert({
          naslov:
            cistiNaslov,

          poruka:
            cistaPoruka,

          link:
            cistiLink ||
            null,

          cilj,

          skupina_id:
            cilj ===
            "skupina"
              ? skupinaId
              : null,

          korisnik_id:
            null,

          created_by:
            session.user.id,
        });

      if (
        spremanjeError
      ) {
        setGreska(
          "Obavijest nije moguće spremiti: " +
            spremanjeError.message
        );

        return;
      }

      try {
        const pushResponse =
          await fetch(
            "/api/admin/push",
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
                  naslov:
                    cistiNaslov,

                  poruka:
                    cistaPoruka,

                  link:
                    cistiLink ||
                    null,

                  cilj,

                  skupina_id:
                    cilj ===
                    "skupina"
                      ? skupinaId
                      : null,
                }
              ),
            }
          );

        const pushData =
          await procitajPushOdgovor(
            pushResponse
          );

        if (
          !pushResponse.ok
        ) {
          setUpozorenje(
            "Obavijest je spremljena u aplikaciju, ali push nije poslan. " +
              (pushData.error ??
                "")
          );
        } else if (
          pushData.poslano ===
          false
        ) {
          setUpozorenje(
            pushData.message ??
              "Obavijest je spremljena, ali nema korisnika kojima se push može poslati."
          );
        } else {
          const broj =
            pushData.brojKorisnika ??
            0;

          setUspjeh(
            `Obavijest je spremljena i push je poslan za ${broj} ${
              broj === 1
                ? "korisnika"
                : "korisnika"
            }.`
          );
        }
      } catch (
        pushError
      ) {
        console.error(
          "Push greška:",
          pushError
        );

        setUpozorenje(
          "Obavijest je spremljena u aplikaciju, ali push trenutačno nije bilo moguće poslati."
        );
      }

      setNaslov("");
      setPoruka("");
      setLink("");
      setCilj("svi");
      setSkupinaId("");

      await ucitajPodatke();
    } catch (error) {
      console.error(
        "Greška slanja obavijesti:",
        error
      );

      setGreska(
        "Došlo je do neočekivane greške kod slanja obavijesti."
      );
    } finally {
      setSpremanje(false);
    }
  }

  async function promijeniStatus(
    obavijest: Obavijest
  ) {
    if (
      statusUTijeku ||
      brisanjeUTijeku
    ) {
      return;
    }

    setGreska("");
    setUspjeh("");
    setUpozorenje("");

    setStatusUTijeku(
      obavijest.id
    );

    const {
      error,
    } = await supabase
      .from("obavijesti")
      .update({
        aktivna:
          !obavijest.aktivna,
      })
      .eq(
        "id",
        obavijest.id
      );

    if (error) {
      setGreska(
        "Status obavijesti nije moguće promijeniti."
      );

      setStatusUTijeku(
        null
      );

      return;
    }

    setUspjeh(
      obavijest.aktivna
        ? "Obavijest je deaktivirana."
        : "Obavijest je ponovno aktivirana."
    );

    await ucitajPodatke();

    setStatusUTijeku(
      null
    );
  }

  async function obrisiObavijest(
    obavijest: Obavijest
  ) {
    if (
      brisanjeUTijeku ||
      statusUTijeku
    ) {
      return;
    }

    setGreska("");
    setUspjeh("");
    setUpozorenje("");

    const potvrda =
      window.confirm(
        `Želite li trajno obrisati obavijest "${obavijest.naslov}"?\n\nObavijest će nestati iz aplikacije korisnika.\n\nVeć poslanu push obavijest nije moguće povući s uređaja.\n\nOvu radnju nije moguće poništiti.`
      );

    if (!potvrda) {
      return;
    }

    setBrisanjeUTijeku(
      obavijest.id
    );

    const {
      error,
    } = await supabase
      .from("obavijesti")
      .delete()
      .eq(
        "id",
        obavijest.id
      );

    if (error) {
      setGreska(
        "Obavijest nije moguće obrisati."
      );

      setBrisanjeUTijeku(
        null
      );

      return;
    }

    setUspjeh(
      "Obavijest je trajno obrisana iz aplikacije."
    );

    await ucitajPodatke();

    setBrisanjeUTijeku(
      null
    );
  }

  function nazivCilja(
    obavijest: Obavijest
  ) {
    if (
      obavijest.cilj ===
      "svi"
    ) {
      return "Svi korisnici";
    }

    if (
      obavijest.cilj ===
      "polaznici"
    ) {
      return "Svi polaznici";
    }

    if (
      obavijest.cilj ===
      "profesori"
    ) {
      return "Svi profesori";
    }

    if (
      obavijest.cilj ===
      "skupina"
    ) {
      const skupina =
        skupine.find(
          (s) =>
            s.id ===
            obavijest.skupina_id
        );

      return (
        skupina?.naziv ??
        "Obrazovna skupina"
      );
    }

    if (
      obavijest.cilj ===
      "korisnik"
    ) {
      return "Pojedinačni korisnik";
    }

    return "Obavijest";
  }

  function dohvatiInternuPutanju(
    vrijednost: string
  ): string | null {
    if (
      vrijednost.startsWith(
        "/"
      )
    ) {
      return vrijednost;
    }

    try {
      const url =
        new URL(
          vrijednost
        );

      if (
        url.hostname ===
        PRODUKCIJSKA_DOMENA
      ) {
        return (
          url.pathname +
          url.search +
          url.hash
        );
      }

      return null;
    } catch {
      return null;
    }
  }

  function otvoriPoveznicu(
    vrijednost: string
  ) {
    const internaPutanja =
      dohvatiInternuPutanju(
        vrijednost
      );

    if (
      internaPutanja
    ) {
      router.push(
        internaPutanja
      );
      return;
    }

    window.open(
      vrijednost,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function formatDatum(
    datum: string
  ) {
    return new Date(
      datum
    ).toLocaleString(
      "hr-HR",
      {
        dateStyle:
          "medium",
        timeStyle:
          "short",
      }
    );
  }

  const aktivneSkupine =
    skupine.filter(
      (skupina) =>
        skupina.status ===
        "aktivna"
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
              Obavijesti
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 md:px-8 md:py-9">
        <section className="max-w-3xl">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#17324d] text-white sm:flex">
              <Bell
                size={23}
              />
            </div>

            <div>
              <h2 className="text-[28px] font-extrabold tracking-[-0.025em] text-[#17202a] md:text-[32px]">
                Poruke i push obavijesti
              </h2>

              <p className="mt-2 text-[15px] leading-6 text-[#66717d]">
                Pošaljite obavijesti svim korisnicima,
                polaznicima, profesorima ili odabranoj
                obrazovnoj skupini.
              </p>
            </div>
          </div>
        </section>

        {greska && (
          <div className="mt-6 rounded-[18px] border border-[#f2c7ca] bg-[#fff5f5] px-4 py-4 text-[14px] leading-6 text-[#a71d24]">
            {greska}
          </div>
        )}

        {upozorenje && (
          <div className="mt-6 rounded-[18px] border border-[#ecdca9] bg-[#fff9e9] px-4 py-4 text-[14px] leading-6 text-[#87661b]">
            {upozorenje}
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
                <Megaphone
                  size={20}
                />
              </div>

              <div>
                <h2 className="text-[19px] font-bold text-[#17202a]">
                  Nova obavijest
                </h2>

                <p className="mt-0.5 text-[13px] text-[#7a8590]">
                  Poruka će se spremiti u aplikaciju i
                  poslati kao push.
                </p>
              </div>
            </div>

            <form
              onSubmit={
                posaljiObavijest
              }
              className="mt-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="naslov"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Naslov
                  <span className="ml-1 text-[#c9252d]">
                    *
                  </span>
                </label>

                <input
                  id="naslov"
                  value={
                    naslov
                  }
                  onChange={(
                    e
                  ) =>
                    setNaslov(
                      e.target.value
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="npr. Promjena termina predavanja"
                />
              </div>

              <div>
                <label
                  htmlFor="poruka"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Poruka
                  <span className="ml-1 text-[#c9252d]">
                    *
                  </span>
                </label>

                <textarea
                  id="poruka"
                  value={
                    poruka
                  }
                  onChange={(
                    e
                  ) =>
                    setPoruka(
                      e.target.value
                    )
                  }
                  rows={5}
                  className="w-full resize-none rounded-xl border border-[#d6dde3] bg-white px-4 py-3 text-[15px] leading-6 text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                  placeholder="Upišite obavijest..."
                />
              </div>

              <div>
                <label
                  htmlFor="cilj"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Kome poslati?
                  <span className="ml-1 text-[#c9252d]">
                    *
                  </span>
                </label>

                <select
                  id="cilj"
                  value={
                    cilj
                  }
                  onChange={(
                    e
                  ) => {
                    setCilj(
                      e.target.value
                    );

                    if (
                      e.target
                        .value !==
                      "skupina"
                    ) {
                      setSkupinaId(
                        ""
                      );
                    }
                  }}
                  className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white px-4 text-[15px] text-[#17202a] outline-none transition focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
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

              {cilj ===
                "skupina" && (
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

                    {aktivneSkupine.map(
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

                  {aktivneSkupine.length ===
                    0 && (
                    <p className="mt-2 text-[12px] leading-5 text-[#8b949e]">
                      Trenutačno nema aktivnih obrazovnih
                      skupina.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="link"
                  className="mb-2 block text-[13px] font-bold text-[#384550]"
                >
                  Poveznica
                </label>

                <div className="relative">
                  <LinkIcon
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b949e]"
                  />

                  <input
                    id="link"
                    type="text"
                    value={
                      link
                    }
                    onChange={(
                      e
                    ) =>
                      setLink(
                        e.target.value
                      )
                    }
                    className="min-h-[48px] w-full rounded-xl border border-[#d6dde3] bg-white pl-11 pr-4 text-[15px] text-[#17202a] outline-none transition placeholder:text-[#a0a8b0] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10"
                    placeholder="/polaznik/raspored ili https://..."
                  />
                </div>

                <p className="mt-2 text-[12px] leading-5 text-[#7a8590]">
                  Možete upisati poveznicu unutar Maestro
                  aplikacije ili vanjsku web poveznicu.
                </p>
              </div>

              <div className="rounded-[16px] border border-[#dde5eb] bg-[#f7f9fb] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#17324d] shadow-sm">
                    <Bell
                      size={18}
                    />
                  </div>

                  <div>
                    <p className="text-[13px] font-bold text-[#17202a]">
                      Push obavijest
                    </p>

                    <p className="mt-1 text-[12px] leading-5 text-[#66717d]">
                      Klikom na Pošalji obavijest poruka
                      se sprema u Maestro aplikaciju i šalje
                      korisnicima koji su omogućili push
                      obavijesti.
                    </p>
                  </div>
                </div>
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
                ) : (
                  <Send
                    size={18}
                  />
                )}

                {spremanje
                  ? "Slanje..."
                  : "Pošalji obavijest"}
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
                  Poslane obavijesti
                </h2>
              </div>

              <div className="shrink-0 rounded-xl border border-[#dfe5ea] bg-white px-3 py-2 text-[13px] font-semibold text-[#66717d]">
                Ukupno:{" "}
                <span className="font-bold text-[#17202a]">
                  {
                    obavijesti.length
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
                    Učitavanje obavijesti...
                  </p>
                </div>
              </div>
            ) : obavijesti.length ===
              0 ? (
              <div className="mt-4 rounded-[22px] border border-[#dfe5ea] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f7] text-[#17324d]">
                  <MessageSquareText
                    size={21}
                  />
                </div>

                <h3 className="mt-4 text-[19px] font-bold text-[#17202a]">
                  Još nema obavijesti
                </h3>

                <p className="mt-2 text-[14px] leading-6 text-[#66717d]">
                  Prvu obavijest možete poslati pomoću
                  obrasca.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {obavijesti.map(
                  (
                    obavijest
                  ) => (
                    <article
                      key={
                        obavijest.id
                      }
                      className="rounded-[22px] border border-[#dfe5ea] bg-white p-5 shadow-[0_5px_18px_rgba(23,50,77,0.035)]"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="text-[18px] font-bold leading-6 text-[#17202a]">
                              {
                                obavijest.naslov
                              }
                            </h3>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                obavijest.aktivna
                                  ? "bg-[#edf7f0] text-[#277442]"
                                  : "bg-[#f0f2f4] text-[#69737c]"
                              }`}
                            >
                              {obavijest.aktivna ? (
                                <CheckCircle2
                                  size={12}
                                />
                              ) : (
                                <BellOff
                                  size={12}
                                />
                              )}

                              {obavijest.aktivna
                                ? "Aktivna"
                                : "Neaktivna"}
                            </span>
                          </div>

                          <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#fff2f2] px-2.5 py-1.5 text-[12px] font-bold text-[#b52027]">
                            <Users
                              size={14}
                            />

                            {nazivCilja(
                              obavijest
                            )}
                          </div>

                          <p className="mt-4 whitespace-pre-line text-[14px] leading-6 text-[#52606d]">
                            {
                              obavijest.poruka
                            }
                          </p>

                          {obavijest.link && (
                            <button
                              type="button"
                              onClick={() =>
                                otvoriPoveznicu(
                                  obavijest.link!
                                )
                              }
                              className="mt-4 inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-[#d6dde3] bg-white px-3 text-[12px] font-bold text-[#17324d] transition hover:bg-[#f4f6f8]"
                            >
                              <ExternalLink
                                size={15}
                              />

                              Otvori poveznicu
                            </button>
                          )}

                          <p className="mt-4 text-[12px] font-medium text-[#929ba4]">
                            {formatDatum(
                              obavijest.datum_objave
                            )}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2 border-t border-[#edf0f2] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                          <button
                            type="button"
                            onClick={() =>
                              void promijeniStatus(
                                obavijest
                              )
                            }
                            disabled={
                              statusUTijeku !==
                                null ||
                              brisanjeUTijeku !==
                                null
                            }
                            className={`flex min-h-[42px] items-center gap-2 rounded-xl border px-3.5 text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              obavijest.aktivna
                                ? "border-[#d6dde3] bg-white text-[#52606d] hover:bg-[#f4f6f8]"
                                : "border-[#cce4d3] bg-white text-[#277442] hover:bg-[#f4fbf6]"
                            }`}
                          >
                            {statusUTijeku ===
                            obavijest.id ? (
                              <LoaderCircle
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Power
                                size={16}
                              />
                            )}

                            {statusUTijeku ===
                            obavijest.id
                              ? "Spremanje..."
                              : obavijest.aktivna
                              ? "Deaktiviraj"
                              : "Aktiviraj"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void obrisiObavijest(
                                obavijest
                              )
                            }
                            disabled={
                              brisanjeUTijeku !==
                                null ||
                              statusUTijeku !==
                                null
                            }
                            className="flex min-h-[42px] items-center gap-2 rounded-xl border border-[#efc8cb] bg-white px-3.5 text-[13px] font-bold text-[#b52027] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {brisanjeUTijeku ===
                            obavijest.id ? (
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
                            obavijest.id
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