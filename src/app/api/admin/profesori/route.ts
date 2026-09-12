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

    const telefon =
      String(
        body.telefon ?? ""
      ).trim();

    if (
      !imePrezime ||
      !email
    ) {
      return NextResponse.json(
        {
          error:
            "Ime i prezime te e-mail su obavezni.",
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
              "profesor",
          },
        }
      );

    if (
      pozivnicaError ||
      !pozivnicaData.user
    ) {
      console.error(
        "Greška slanja pozivnice profesoru:",
        pozivnicaError
      );

      let poruka =
        pozivnicaError?.message ??
        "Nije moguće napraviti profesora i poslati pozivnicu.";

      const malaPoruka =
        poruka.toLowerCase();

      if (
        malaPoruka.includes(
          "already"
        ) ||
        malaPoruka.includes(
          "registered"
        ) ||
        malaPoruka.includes(
          "exists"
        )
      ) {
        poruka =
          "Korisnik s ovom e-mail adresom već postoji.";
      }

      if (
        malaPoruka.includes(
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

    const profesorId =
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

          telefon:
            telefon ||
            null,

          uloga:
            "profesor",

          aktivan:
            true,
        })
        .eq(
          "id",
          profesorId
        );

    if (
      profilError
    ) {
      console.error(
        "Greška spremanja profila profesora:",
        profilError
      );

      await supabaseAdmin.auth.admin.deleteUser(
        profesorId
      );

      return NextResponse.json(
        {
          error:
            "Pozivnica je pokrenuta, ali profil profesora nije moguće napraviti.",
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
          profesorId,

        pozivnica_poslana:
          true,

        message:
          "Profesor je dodan i pozivnica za postavljanje lozinke poslana je na njegovu e-mail adresu.",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Neočekivana greška kod dodavanja profesora:",
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