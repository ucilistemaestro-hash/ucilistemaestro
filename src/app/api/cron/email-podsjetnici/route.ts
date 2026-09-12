import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

type PredavanjeZaPodsjetnik = {
  predavanje_id: string;
  skupina_id: string;
  profesor_id: string | null;
  naziv_predavanja: string;
  naziv_skupine: string;
  naziv_programa: string;
  datum: string;
  vrijeme_pocetka: string;
  vrijeme_zavrsetka: string;
  ucionica_naziv: string | null;
  ucionica_lokacija: string | null;
  termin_predavanja: string;
};

type Primatelj = {
  id: string;
  ime_prezime: string | null;
  email: string | null;
  uloga: string;
  aktivan: boolean;
};

function escapeHtml(value: string | null | undefined) {
  return (value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatirajDatum(datum: string) {
  const dijelovi = datum.split("-");

  if (dijelovi.length !== 3) {
    return datum;
  }

  const [godina, mjesec, dan] = dijelovi;

  return `${dan}.${mjesec}.${godina}.`;
}

function napraviHtml(
  predavanje: PredavanjeZaPodsjetnik,
  primatelj: Primatelj
) {
  const ime = primatelj.ime_prezime?.trim();

  const pozdrav = ime
    ? `Poštovani ${escapeHtml(ime)},`
    : "Poštovani,";

  const ucionica = predavanje.ucionica_naziv
    ? escapeHtml(predavanje.ucionica_naziv)
    : "Nije navedena";

  const lokacija = predavanje.ucionica_lokacija
    ? escapeHtml(predavanje.ucionica_lokacija)
    : null;

  return `
<!doctype html>
<html lang="hr">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    />
    <title>Podsjetnik na nastavu – Učilište Maestro</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: Arial, Helvetica, sans-serif;
      color: #17202a;
    "
  >
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        background-color: #f4f6f8;
        padding: 32px 16px;
      "
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              max-width: 600px;
              background-color: #ffffff;
              border: 1px solid #e2e7ec;
              border-radius: 16px;
              overflow: hidden;
            "
          >
            <tr>
              <td
                style="
                  background-color: #17324d;
                  padding: 24px 32px;
                  text-align: center;
                "
              >
                <div
                  style="
                    color: #ffffff;
                    font-size: 22px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                  "
                >
                  UČILIŠTE MAESTRO
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding: 32px;">
                <h1
                  style="
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    line-height: 1.3;
                    color: #102437;
                  "
                >
                  Podsjetnik na nastavu
                </h1>

                <p
                  style="
                    margin: 0 0 16px 0;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #4f5b66;
                  "
                >
                  ${pozdrav}
                </p>

                <p
                  style="
                    margin: 0 0 24px 0;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #4f5b66;
                  "
                >
                  podsjećamo vas da nastava počinje za približno
                  <strong>1 sat</strong>.
                </p>

                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    margin: 0 0 24px 0;
                    background-color: #f4f6f8;
                    border-radius: 12px;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding: 20px;
                        font-size: 15px;
                        line-height: 1.7;
                        color: #4f5b66;
                      "
                    >
                      <strong style="color: #17324d;">
                        Program:
                      </strong>
                      ${escapeHtml(predavanje.naziv_programa)}
                      <br />

                      <strong style="color: #17324d;">
                        Skupina:
                      </strong>
                      ${escapeHtml(predavanje.naziv_skupine)}
                      <br />

                      <strong style="color: #17324d;">
                        Predavanje:
                      </strong>
                      ${escapeHtml(predavanje.naziv_predavanja)}
                      <br />

                      <strong style="color: #17324d;">
                        Datum:
                      </strong>
                      ${escapeHtml(
                        formatirajDatum(predavanje.datum)
                      )}
                      <br />

                      <strong style="color: #17324d;">
                        Vrijeme:
                      </strong>
                      ${escapeHtml(predavanje.vrijeme_pocetka)}
                      –
                      ${escapeHtml(predavanje.vrijeme_zavrsetka)}
                      <br />

                      <strong style="color: #17324d;">
                        Učionica:
                      </strong>
                      ${ucionica}

                      ${
                        lokacija
                          ? `
                            <br />
                            <strong style="color: #17324d;">
                              Lokacija:
                            </strong>
                            ${lokacija}
                          `
                          : ""
                      }
                    </td>
                  </tr>
                </table>

                <p
                  style="
                    margin: 0;
                    font-size: 15px;
                    line-height: 1.6;
                    color: #4f5b66;
                  "
                >
                  Srdačan pozdrav,<br />
                  <strong>Učilište Maestro</strong>
                </p>
              </td>
            </tr>

            <tr>
              <td
                style="
                  border-top: 1px solid #e2e7ec;
                  padding: 18px 32px;
                  text-align: center;
                  font-size: 12px;
                  line-height: 1.5;
                  color: #89939d;
                "
              >
                Ovo je automatski podsjetnik Učilišta Maestro.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

function napraviTekst(
  predavanje: PredavanjeZaPodsjetnik,
  primatelj: Primatelj
) {
  const ime = primatelj.ime_prezime?.trim();

  const pozdrav = ime
    ? `Poštovani ${ime},`
    : "Poštovani,";

  const ucionica =
    predavanje.ucionica_naziv ?? "Nije navedena";

  const lokacija = predavanje.ucionica_lokacija
    ? `\nLokacija: ${predavanje.ucionica_lokacija}`
    : "";

  return `${pozdrav}

podsjećamo vas da nastava počinje za približno 1 sat.

Program: ${predavanje.naziv_programa}
Skupina: ${predavanje.naziv_skupine}
Predavanje: ${predavanje.naziv_predavanja}
Datum: ${formatirajDatum(predavanje.datum)}
Vrijeme: ${predavanje.vrijeme_pocetka} – ${predavanje.vrijeme_zavrsetka}
Učionica: ${ucionica}${lokacija}

Srdačan pozdrav,
Učilište Maestro`;
}

export async function POST(request: NextRequest) {
  try {
    const cronSecret =
      process.env.EMAIL_REMINDER_CRON_SECRET;

    if (!cronSecret) {
      console.error(
        "EMAIL_REMINDER_CRON_SECRET nije postavljen."
      );

      return NextResponse.json(
        {
          error:
            "Serverska konfiguracija za podsjetnike nije potpuna.",
        },
        {
          status: 500,
        }
      );
    }

    const poslaniSecret =
      request.headers.get("x-cron-secret");

    if (
      !poslaniSecret ||
      poslaniSecret !== cronSecret
    ) {
      return NextResponse.json(
        {
          error: "Nedopušten pristup.",
        },
        {
          status: 401,
        }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    const smtpHost =
      process.env.SMTP_HOST ??
      "mail.uciliste-maestro.hr";

    const smtpPort = Number(
      process.env.SMTP_PORT ?? "465"
    );

    const smtpUser =
      process.env.SMTP_USER;

    const smtpPassword =
      process.env.SMTP_PASSWORD;

    const smtpFromEmail =
      process.env.SMTP_FROM_EMAIL ??
      smtpUser;

    const smtpFromName =
      process.env.SMTP_FROM_NAME ??
      "Učilište Maestro";

    if (
      !supabaseUrl ||
      !supabaseSecretKey ||
      !smtpUser ||
      !smtpPassword ||
      !smtpFromEmail ||
      !Number.isFinite(smtpPort)
    ) {
      console.error(
        "Nedostaje jedna ili više serverskih varijabli za e-mail podsjetnike."
      );

      return NextResponse.json(
        {
          error:
            "Serverska konfiguracija za e-mail nije potpuna.",
        },
        {
          status: 500,
        }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const transporter =
      nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

    const {
      data: predavanjaData,
      error: predavanjaError,
    } = await supabaseAdmin.rpc(
      "predavanja_za_email_podsjetnik"
    );

    if (predavanjaError) {
      console.error(
        "Greška pri dohvaćanju predavanja za podsjetnik:",
        predavanjaError
      );

      return NextResponse.json(
        {
          error:
            "Nije moguće dohvatiti predavanja za podsjetnike.",
        },
        {
          status: 500,
        }
      );
    }

    const predavanja =
      (predavanjaData ??
        []) as PredavanjeZaPodsjetnik[];

    if (predavanja.length === 0) {
      return NextResponse.json({
        success: true,
        predavanja: 0,
        poslano: 0,
        preskoceno: 0,
        greske: 0,
        message:
          "Trenutačno nema predavanja za koja treba poslati podsjetnik.",
      });
    }

    let brojPoslanih = 0;
    let brojPreskocenih = 0;
    let brojGresaka = 0;

    for (const predavanje of predavanja) {
      const {
        data: clanstva,
        error: clanstvaError,
      } = await supabaseAdmin
        .from("clanstva_skupina")
        .select("korisnik_id")
        .eq(
          "skupina_id",
          predavanje.skupina_id
        )
        .eq("status", "aktivan");

      if (clanstvaError) {
        console.error(
          `Greška članstava za predavanje ${predavanje.predavanje_id}:`,
          clanstvaError
        );

        brojGresaka += 1;
        continue;
      }

      const polaznikIds = new Set(
        (clanstva ?? []).map(
          (clanstvo) =>
            clanstvo.korisnik_id as string
        )
      );

      const sviIds = new Set<string>(
        polaznikIds
      );

      if (predavanje.profesor_id) {
        sviIds.add(
          predavanje.profesor_id
        );
      }

      if (sviIds.size === 0) {
        continue;
      }

      const {
        data: profiliData,
        error: profiliError,
      } = await supabaseAdmin
        .from("profili")
        .select(
          "id, ime_prezime, email, uloga, aktivan"
        )
        .in("id", Array.from(sviIds))
        .eq("aktivan", true);

      if (profiliError) {
        console.error(
          `Greška profila za predavanje ${predavanje.predavanje_id}:`,
          profiliError
        );

        brojGresaka += 1;
        continue;
      }

      const profili =
        (profiliData ??
          []) as Primatelj[];

      const primatelji =
        profili.filter((profil) => {
          if (!profil.email) {
            return false;
          }

          const jePolaznik =
            polaznikIds.has(profil.id) &&
            profil.uloga === "polaznik";

          const jeProfesor =
            profil.id ===
              predavanje.profesor_id &&
            profil.uloga === "profesor";

          return jePolaznik || jeProfesor;
        });

      for (const primatelj of primatelji) {
        const {
          error: rezervacijaError,
        } = await supabaseAdmin
          .from("podsjetnici_predavanja")
          .insert({
            predavanje_id:
              predavanje.predavanje_id,
            korisnik_id:
              primatelj.id,
            vrsta: "1h",
            termin_predavanja:
              predavanje.termin_predavanja,
          });

        if (rezervacijaError) {
          if (
            rezervacijaError.code ===
            "23505"
          ) {
            brojPreskocenih += 1;
            continue;
          }

          console.error(
            `Greška evidencije podsjetnika za korisnika ${primatelj.id}:`,
            rezervacijaError
          );

          brojGresaka += 1;
          continue;
        }

        try {
          await transporter.sendMail({
            from: {
              name: smtpFromName,
              address: smtpFromEmail,
            },
            to: primatelj.email!,
            subject:
              "Podsjetnik na nastavu – Učilište Maestro",
            text: napraviTekst(
              predavanje,
              primatelj
            ),
            html: napraviHtml(
              predavanje,
              primatelj
            ),
          });

          brojPoslanih += 1;
        } catch (emailError) {
          console.error(
            `Greška slanja e-maila korisniku ${primatelj.id}:`,
            emailError
          );

          brojGresaka += 1;

          const {
            error: brisanjeRezervacijeError,
          } = await supabaseAdmin
            .from(
              "podsjetnici_predavanja"
            )
            .delete()
            .eq(
              "predavanje_id",
              predavanje.predavanje_id
            )
            .eq(
              "korisnik_id",
              primatelj.id
            )
            .eq("vrsta", "1h")
            .eq(
              "termin_predavanja",
              predavanje.termin_predavanja
            );

          if (
            brisanjeRezervacijeError
          ) {
            console.error(
              "Nije moguće ukloniti neuspjelu evidenciju podsjetnika:",
              brisanjeRezervacijeError
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      predavanja: predavanja.length,
      poslano: brojPoslanih,
      preskoceno: brojPreskocenih,
      greske: brojGresaka,
      message:
        "Provjera e-mail podsjetnika je završena.",
    });
  } catch (error) {
    console.error(
      "Neočekivana greška e-mail podsjetnika:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Dogodila se neočekivana greška pri obradi e-mail podsjetnika.",
      },
      {
        status: 500,
      }
    );
  }
}