import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (
      !supabaseUrl ||
      !supabasePublishableKey ||
      !supabaseSecretKey
    ) {
      return NextResponse.json(
        {
          error:
            "Nedostaju serverske postavke.",
        },
        {
          status: 500,
        }
      );
    }

    const authorization =
      request.headers.get("authorization");

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        {
          error: "Niste prijavljeni.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authorization.replace("Bearer ", "");

    /*
      Provjera trenutno prijavljenog korisnika
    */
    const supabaseAuth = createClient(
      supabaseUrl,
      supabasePublishableKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(
      accessToken
    );

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "Prijava je istekla. Prijavite se ponovno.",
        },
        {
          status: 401,
        }
      );
    }

    /*
      Serverski administratorski klijent
    */
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    /*
      Provjera je li prijavljeni korisnik administrator
    */
    const {
      data: adminProfil,
      error: adminProfilError,
    } = await supabaseAdmin
      .from("profili")
      .select("id, uloga, aktivan")
      .eq("id", user.id)
      .single();

    if (
      adminProfilError ||
      !adminProfil ||
      adminProfil.uloga !== "administrator" ||
      adminProfil.aktivan !== true
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

    /*
      Podaci iz obrasca
    */
    const body = await request.json();

    const profesorId =
      typeof body.profesor_id === "string"
        ? body.profesor_id.trim()
        : "";

    const novaLozinka =
      typeof body.nova_lozinka === "string"
        ? body.nova_lozinka
        : "";

    if (!profesorId) {
      return NextResponse.json(
        {
          error:
            "Profesor nije odabran.",
        },
        {
          status: 400,
        }
      );
    }

    if (novaLozinka.length < 8) {
      return NextResponse.json(
        {
          error:
            "Nova lozinka mora imati najmanje 8 znakova.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Provjeri mijenjamo li zaista profesora,
      a ne nekog drugog korisnika.
    */
    const {
      data: profesorProfil,
      error: profesorProfilError,
    } = await supabaseAdmin
      .from("profili")
      .select("id, ime_prezime, uloga")
      .eq("id", profesorId)
      .single();

    if (
      profesorProfilError ||
      !profesorProfil
    ) {
      return NextResponse.json(
        {
          error:
            "Profesor nije pronađen.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      profesorProfil.uloga !== "profesor"
    ) {
      return NextResponse.json(
        {
          error:
            "Odabrani korisnik nije profesor.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Promjena lozinke u Supabase Auth
    */
    const {
      error: passwordError,
    } =
      await supabaseAdmin.auth.admin.updateUserById(
        profesorId,
        {
          password: novaLozinka,
        }
      );

    if (passwordError) {
      console.error(
        "Greška promjene lozinke:",
        passwordError
      );

      return NextResponse.json(
        {
          error:
            "Lozinku nije moguće promijeniti: " +
            passwordError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Nova lozinka je uspješno postavljena.",
    });
  } catch (error) {
    console.error(
      "API greška promjene lozinke:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Došlo je do greške kod promjene lozinke.",
      },
      {
        status: 500,
      }
    );
  }
}