"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Send,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Uloga =
  | "administrator"
  | "profesor"
  | "polaznik";

type NacinPrikaza =
  | "prijava"
  | "zaboravljena-lozinka";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [lozinka, setLozinka] =
    useState("");

  const [
    prikaziLozinku,
    setPrikaziLozinku,
  ] = useState(false);

  const [
    nacinPrikaza,
    setNacinPrikaza,
  ] =
    useState<NacinPrikaza>(
      "prijava"
    );

  const [greska, setGreska] =
    useState("");

  const [uspjeh, setUspjeh] =
    useState("");

  const [
    ucitavanje,
    setUcitavanje,
  ] = useState(false);

  const [
    provjeraSesije,
    setProvjeraSesije,
  ] = useState(true);

  function preusmjeriKorisnika(
    uloga: Uloga
  ) {
    if (
      uloga ===
      "administrator"
    ) {
      router.replace("/admin");
      return;
    }

    if (
      uloga ===
      "profesor"
    ) {
      router.replace(
        "/profesor"
      );
      return;
    }

    router.replace(
      "/polaznik"
    );
  }

  useEffect(() => {
    let aktivno = true;

    async function provjeriSesiju() {
      try {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (!aktivno) {
          return;
        }

        if (
          !session?.user
        ) {
          setProvjeraSesije(
            false
          );
          return;
        }

        const {
          data: profil,
          error:
            profilError,
        } = await supabase
          .from("profili")
          .select(
            "uloga, aktivan"
          )
          .eq(
            "id",
            session.user.id
          )
          .single();

        if (!aktivno) {
          return;
        }

        if (
          profilError ||
          !profil ||
          !profil.aktivan
        ) {
          await supabase.auth.signOut();

          if (aktivno) {
            setProvjeraSesije(
              false
            );
          }

          return;
        }

        preusmjeriKorisnika(
          profil.uloga as Uloga
        );
      } catch (error) {
        console.error(
          "Greška provjere postojeće prijave:",
          error
        );

        if (aktivno) {
          setProvjeraSesije(
            false
          );
        }
      }
    }

    void provjeriSesiju();

    return () => {
      aktivno = false;
    };
  }, []);

  async function prijava(
    e: FormEvent
  ) {
    e.preventDefault();

    if (ucitavanje) {
      return;
    }

    setGreska("");
    setUspjeh("");
    setUcitavanje(true);

    try {
      const emailZaPrijavu =
        email
          .trim()
          .toLowerCase();

      if (!emailZaPrijavu) {
        setGreska(
          "Upišite e-mail adresu."
        );
        return;
      }

      if (!lozinka) {
        setGreska(
          "Upišite lozinku."
        );
        return;
      }

      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              emailZaPrijavu,

            password:
              lozinka,
          }
        );

      if (
        error ||
        !data.user
      ) {
        setGreska(
          "E-mail ili lozinka nisu ispravni."
        );
        return;
      }

      const {
        data: profil,
        error:
          profilError,
      } = await supabase
        .from("profili")
        .select(
          "uloga, aktivan"
        )
        .eq(
          "id",
          data.user.id
        )
        .single();

      if (
        profilError ||
        !profil
      ) {
        await supabase.auth.signOut();

        setGreska(
          "Nije moguće učitati korisnički profil."
        );
        return;
      }

      if (
        !profil.aktivan
      ) {
        await supabase.auth.signOut();

        setGreska(
          "Ovaj korisnički račun nije aktivan."
        );
        return;
      }

      preusmjeriKorisnika(
        profil.uloga as Uloga
      );
    } catch (error) {
      console.error(
        "Greška prijave:",
        error
      );

      setGreska(
        "Prijava trenutačno nije moguća. Pokušajte ponovno."
      );
    } finally {
      setUcitavanje(
        false
      );
    }
  }

  async function posaljiPoveznicuZaLozinku(
    e: FormEvent
  ) {
    e.preventDefault();

    if (ucitavanje) {
      return;
    }

    setGreska("");
    setUspjeh("");

    const emailZaReset =
      email
        .trim()
        .toLowerCase();

    if (!emailZaReset) {
      setGreska(
        "Upišite e-mail adresu."
      );
      return;
    }

    setUcitavanje(true);

    try {
      const redirectTo =
        `${window.location.origin}/postavi-lozinku`;

      const {
        error,
      } =
        await supabase.auth.resetPasswordForEmail(
          emailZaReset,
          {
            redirectTo,
          }
        );

      if (error) {
        console.error(
          "Greška slanja poveznice:",
          error
        );

        setGreska(
          "Poveznicu za postavljanje nove lozinke trenutačno nije moguće poslati."
        );

        return;
      }

      setUspjeh(
        "Ako za navedenu e-mail adresu postoji korisnički račun, poslana je poveznica za postavljanje nove lozinke. Provjerite i mapu neželjene pošte."
      );
    } catch (error) {
      console.error(
        "Greška slanja poveznice za lozinku:",
        error
      );

      setGreska(
        "Poveznicu trenutačno nije moguće poslati. Pokušajte ponovno."
      );
    } finally {
      setUcitavanje(
        false
      );
    }
  }

  function otvoriZaboravljenuLozinku() {
    setNacinPrikaza(
      "zaboravljena-lozinka"
    );

    setLozinka("");
    setGreska("");
    setUspjeh("");
  }

  function vratiNaPrijavu() {
    setNacinPrikaza(
      "prijava"
    );

    setLozinka("");
    setGreska("");
    setUspjeh("");
  }

  if (
    provjeraSesije
  ) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f4f6f8] px-4">
        <div className="flex flex-col items-center gap-3 text-[#66717d]">
          <LoaderCircle
            size={28}
            className="animate-spin text-[#c9252d]"
          />

          <p className="text-sm font-medium">
            Provjera prijave...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f4f6f8]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] items-center px-4 py-8">
        <div className="w-full overflow-hidden rounded-[28px] border border-[#e2e7ec] bg-white shadow-[0_18px_50px_rgba(16,36,55,0.10)]">
          <div className="h-1.5 w-full bg-[#c9252d]" />

          <div className="px-6 pb-7 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
            <div className="mb-8 flex flex-col items-center text-center">
              <Image
                src="/icon-512.png"
                alt="Učilište Maestro"
                width={170}
                height={170}
                priority
                className="mb-3 h-auto w-[150px] object-contain sm:w-[170px]"
              />

              <div className="flex flex-col items-center">
                <p className="text-3xl font-extrabold tracking-tight text-[#17324d]">
                  UČILIŠTE
                </p>

                <p className="text-3xl font-extrabold tracking-tight text-[#17324d]">
                  MAESTRO
                </p>
              </div>

              {nacinPrikaza ===
              "prijava" ? (
                <p className="mt-4 max-w-[300px] text-sm leading-6 text-[#66717d]">
                  Prijavite se za pristup rasporedu,
                  obavijestima i svom korisničkom
                  profilu.
                </p>
              ) : (
                <p className="mt-4 max-w-[320px] text-sm leading-6 text-[#66717d]">
                  Upišite svoju e-mail adresu i poslat
                  ćemo vam poveznicu za postavljanje
                  nove lozinke.
                </p>
              )}
            </div>

            {nacinPrikaza ===
            "prijava" ? (
              <form
                onSubmit={
                  prijava
                }
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-[#17202a]"
                  >
                    E-mail adresa
                  </label>

                  <div className="relative">
                    <Mail
                      size={19}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#66717d]"
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
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
                      disabled={
                        ucitavanje
                      }
                      placeholder="ime@primjer.hr"
                      className="w-full rounded-xl border border-[#d7dee5] bg-white py-3.5 pl-11 pr-4 text-[16px] text-[#17202a] outline-none transition placeholder:text-[#9aa4ae] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10 disabled:cursor-not-allowed disabled:bg-[#f4f6f8]"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label
                      htmlFor="lozinka"
                      className="text-sm font-semibold text-[#17202a]"
                    >
                      Lozinka
                    </label>

                    <button
                      type="button"
                      onClick={
                        otvoriZaboravljenuLozinku
                      }
                      disabled={
                        ucitavanje
                      }
                      className="text-[13px] font-bold text-[#c9252d] transition hover:text-[#ad2027] disabled:opacity-50"
                    >
                      Zaboravili ste lozinku?
                    </button>
                  </div>

                  <div className="relative">
                    <LockKeyhole
                      size={19}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#66717d]"
                    />

                    <input
                      id="lozinka"
                      name="lozinka"
                      type={
                        prikaziLozinku
                          ? "text"
                          : "password"
                      }
                      required
                      autoComplete="current-password"
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
                      disabled={
                        ucitavanje
                      }
                      placeholder="Unesite lozinku"
                      className="w-full rounded-xl border border-[#d7dee5] bg-white py-3.5 pl-11 pr-12 text-[16px] text-[#17202a] outline-none transition placeholder:text-[#9aa4ae] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10 disabled:cursor-not-allowed disabled:bg-[#f4f6f8]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setPrikaziLozinku(
                          (
                            trenutno
                          ) =>
                            !trenutno
                        )
                      }
                      disabled={
                        ucitavanje
                      }
                      aria-label={
                        prikaziLozinku
                          ? "Sakrij lozinku"
                          : "Prikaži lozinku"
                      }
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#66717d] transition hover:bg-[#f4f6f8] hover:text-[#17324d] disabled:cursor-not-allowed"
                    >
                      {prikaziLozinku ? (
                        <EyeOff
                          size={19}
                        />
                      ) : (
                        <Eye
                          size={19}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {greska && (
                  <div
                    role="alert"
                    className="rounded-xl border border-[#f2c7ca] bg-[#fff5f5] px-4 py-3 text-sm leading-5 text-[#a71d24]"
                  >
                    {greska}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    ucitavanje
                  }
                  className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#c9252d] px-5 py-3.5 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#ad2027] focus:outline-none focus:ring-2 focus:ring-[#c9252d]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ucitavanje && (
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                  )}

                  {ucitavanje
                    ? "Prijava..."
                    : "Prijavi se"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={
                  posaljiPoveznicuZaLozinku
                }
                className="space-y-5"
              >
                <div className="flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3f7] text-[#17324d]">
                    <KeyRound
                      size={23}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reset-email"
                    className="mb-2 block text-sm font-semibold text-[#17202a]"
                  >
                    E-mail adresa
                  </label>

                  <div className="relative">
                    <Mail
                      size={19}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#66717d]"
                    />

                    <input
                      id="reset-email"
                      type="email"
                      required
                      autoComplete="email"
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
                      disabled={
                        ucitavanje
                      }
                      placeholder="ime@primjer.hr"
                      className="w-full rounded-xl border border-[#d7dee5] bg-white py-3.5 pl-11 pr-4 text-[16px] text-[#17202a] outline-none transition placeholder:text-[#9aa4ae] focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]/10 disabled:cursor-not-allowed disabled:bg-[#f4f6f8]"
                    />
                  </div>
                </div>

                {greska && (
                  <div
                    role="alert"
                    className="rounded-xl border border-[#f2c7ca] bg-[#fff5f5] px-4 py-3 text-sm leading-5 text-[#a71d24]"
                  >
                    {greska}
                  </div>
                )}

                {uspjeh && (
                  <div className="rounded-xl border border-[#cde5d4] bg-[#f2faf4] px-4 py-3 text-sm leading-5 text-[#277442]">
                    {uspjeh}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    ucitavanje
                  }
                  className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#17324d] px-5 py-3.5 text-[15px] font-bold text-white transition hover:bg-[#102437] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ucitavanje ? (
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                  ) : (
                    <Send
                      size={18}
                    />
                  )}

                  {ucitavanje
                    ? "Slanje..."
                    : "Pošalji poveznicu"}
                </button>

                <button
                  type="button"
                  onClick={
                    vratiNaPrijavu
                  }
                  disabled={
                    ucitavanje
                  }
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-[#d7dee5] bg-white px-5 text-[14px] font-bold text-[#17324d] transition hover:bg-[#f4f6f8] disabled:opacity-50"
                >
                  <ArrowLeft
                    size={17}
                  />

                  Natrag na prijavu
                </button>
              </form>
            )}

            <div className="mt-7 border-t border-[#e8ecef] pt-5 text-center">
              <p className="text-xs leading-5 text-[#7a8590]">
                Pristup aplikaciji namijenjen je
                polaznicima, profesorima i
                administratorima Učilišta Maestro.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}