import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;

const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const secretKey =
  process.env.SUPABASE_SECRET_KEY!;

function dohvatiRedirectUrl(
  request: NextRequest
) {
  const hostname =
    request.nextUrl.hostname;

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  ) {
    return `${request.nextUrl.origin}/postavi-lozinku`;
  }

  return "https://app.uciliste-maestro.hr/postavi-lozinku";
}

export async function POST(
  request: NextRequest
) {
  try {
    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      !authorization?.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Niste prijavljeni.",
        },
        {
          status: 401,
        }
      );
    }

    const token =
      authorization.replace(
        "Bearer ",
        ""
      );

    const supabaseUser =
      createClient(
        supabaseUrl,
        publishableKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken:
              false,
            detectSessionInUrl:
              false,
          },
        }
      );

    const {
      data: {
        user,
      },
      error: userError,
    } =
      await supabaseUser.auth.getUser(
        token
      );

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "Neispravna prijava.",
        },
        {
          status: 401,
        }
      );
    }

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        secretKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken:
              false,
            detectSessionInUrl:
              false,
          },
        }
      );

    const {
      data:
        adminProfil,
      error:
        adminProfilError,
    } =
      await supabaseAdmin
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
      adminProfilError ||
      !adminProfil ||
      adminProfil.uloga !==
        "administrator" ||
      adminProfil.aktivan !==
        true
    ) {
      return NextResponse.json(
        {
          error:
            "Nemate administratorske ovlasti.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await request.json();

    const imePrezime =
      String(
        body.ime_prezime ??
          ""
      ).trim();

    const email =
      String(
        body.email ?? ""
      )
        .trim()
        .toLowerCase();

    const skupinaId =
      String(
        body.skupina_id ??
          ""
      ).trim();

    if (
      !imePrezime ||
      !email ||
      !skupinaId
    ) {
      return NextResponse.json(
        {
          error:
            "Ime i prezime, e-mail i obrazovna skupina su obavezni.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data:
        odabranaSkupina,
      error:
        skupinaError,
    } =
      await supabaseAdmin
        .from(
          "obrazovne_skupine"
        )
        .select(
          "id, naziv, status"
        )
        .eq(
          "id",
          skupinaId
        )
        .single();

    if (
      skupinaError ||
      !odabranaSkupina
    ) {
      return NextResponse.json(
        {
          error:
            "Odabrana obrazovna skupina ne postoji.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      odabranaSkupina.status !==
        "aktivna" &&
      odabranaSkupina.status !==
        "u_pripremi"
    ) {
      return NextResponse.json(
        {
          error:
            "Polaznika je moguće upisati samo u aktivnu skupinu ili skupinu u pripremi.",
        },
        {
          status: 400,
        }
      );
    }

    const redirectTo =
      dohvatiRedirectUrl(
        request
      );

    const {
      data:
        pozivnicaData,
      error:
        pozivnicaError,
    } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo,

          data: {
            ime_prezime:
              imePrezime,

            uloga:
              "polaznik",
          },
        }
      );

    if (
      pozivnicaError ||
      !pozivnicaData.user
    ) {
      console.error(
        "Greška slanja pozivnice polazniku:",
        pozivnicaError
      );

      let poruka =
        pozivnicaError?.message ??
        "Nije moguće napraviti korisnika i poslati pozivnicu.";

      if (
        poruka
          .toLowerCase()
          .includes(
            "already"
          )
      ) {
        poruka =
          "Korisnik s ovom e-mail adresom već postoji.";
      }

      if (
        poruka
          .toLowerCase()
          .includes(
            "rate limit"
          )
      ) {
        poruka =
          "Dosegnut je trenutačni limit slanja e-mailova. Pokušajte ponovno kasnije.";
      }

      return NextResponse.json(
        {
          error:
            poruka,
        },
        {
          status: 400,
        }
      );
    }

    const korisnikId =
      pozivnicaData.user.id;

    const {
      error:
        profilError,
    } =
      await supabaseAdmin
        .from("profili")
        .update({
          ime_prezime:
            imePrezime,

          email,

          uloga:
            "polaznik",

          aktivan:
            true,
        })
        .eq(
          "id",
          korisnikId
        );

    if (profilError) {
      console.error(
        "Greška spremanja profila polaznika:",
        profilError
      );

      await supabaseAdmin.auth.admin.deleteUser(
        korisnikId
      );

      return NextResponse.json(
        {
          error:
            "Pozivnica je pokrenuta, ali profil polaznika nije moguće napraviti.",
        },
        {
          status: 500,
        }
      );
    }

    const {
      error:
        clanstvoError,
    } =
      await supabaseAdmin
        .from(
          "clanstva_skupina"
        )
        .insert({
          korisnik_id:
            korisnikId,

          skupina_id:
            skupinaId,

          status:
            "aktivan",

          datum_upisa:
            new Date()
              .toISOString()
              .slice(
                0,
                10
              ),
        });

    if (
      clanstvoError
    ) {
      console.error(
        "Greška upisa polaznika u skupinu:",
        clanstvoError
      );

      await supabaseAdmin.auth.admin.deleteUser(
        korisnikId
      );

      return NextResponse.json(
        {
          error:
            "Korisnički račun je napravljen, ali polaznika nije moguće dodati u obrazovnu skupinu.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        korisnik_id:
          korisnikId,

        pozivnica_poslana:
          true,

        message:
          "Polaznik je dodan i pozivnica za postavljanje lozinke je poslana na njegovu e-mail adresu.",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Neočekivana greška kod dodavanja polaznika:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Dogodila se neočekivana greška.",
      },
      {
        status: 500,
      }
    );
  }
}