import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export async function DELETE(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const publishableKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const secretKey =
      process.env
        .SUPABASE_SECRET_KEY;

    if (
      !supabaseUrl ||
      !publishableKey ||
      !secretKey
    ) {
      return NextResponse.json(
        {
          error:
            "Nedostaje konfiguracija poslužitelja.",
        },
        {
          status: 500,
        }
      );
    }

    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      !authorization ||
      !authorization.startsWith(
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

    const accessToken =
      authorization.substring(
        7
      );

    const supabaseKorisnik =
      createClient(
        supabaseUrl,
        publishableKey,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      );

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        secretKey,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      );

    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await supabaseKorisnik.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "Vaša prijava nije valjana ili je istekla.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data:
        administrator,
      error:
        administratorError,
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
      administratorError ||
      !administrator ||
      administrator.uloga !==
        "administrator" ||
      administrator.aktivan !==
        true
    ) {
      return NextResponse.json(
        {
          error:
            "Nemate pravo obrisati profesora.",
        },
        {
          status: 403,
        }
      );
    }

    let body: {
      korisnik_id?: string;
    };

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Podaci zahtjeva nisu ispravni.",
        },
        {
          status: 400,
        }
      );
    }

    const profesorId =
      body.korisnik_id;

    if (!profesorId) {
      return NextResponse.json(
        {
          error:
            "Nije odabran profesor za brisanje.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: profesor,
      error:
        profesorError,
    } =
      await supabaseAdmin
        .from("profili")
        .select(
          "id, ime_prezime, email, uloga"
        )
        .eq(
          "id",
          profesorId
        )
        .single();

    if (
      profesorError ||
      !profesor
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
      profesor.uloga !==
      "profesor"
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

    const {
      count:
        brojPredavanja,
      error:
        predavanjaError,
    } =
      await supabaseAdmin
        .from("predavanja")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "profesor_id",
          profesorId
        );

    if (
      predavanjaError
    ) {
      console.error(
        "Greška provjere predavanja:",
        predavanjaError
      );

      return NextResponse.json(
        {
          error:
            "Nije moguće provjeriti predavanja profesora.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      (brojPredavanja ??
        0) > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Profesora nije moguće obrisati jer je povezan s evidencijom predavanja. Umjesto brisanja deaktivirajte profesora.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      error:
        obavijestiError,
    } =
      await supabaseAdmin
        .from("obavijesti")
        .delete()
        .eq(
          "korisnik_id",
          profesorId
        );

    if (
      obavijestiError
    ) {
      console.error(
        "Greška brisanja osobnih obavijesti:",
        obavijestiError
      );

      return NextResponse.json(
        {
          error:
            "Nije moguće obrisati osobne obavijesti profesora.",
        },
        {
          status: 500,
        }
      );
    }

    const {
      error:
        deleteUserError,
    } =
      await supabaseAdmin
        .auth
        .admin
        .deleteUser(
          profesorId
        );

    if (
      deleteUserError
    ) {
      console.error(
        "Greška brisanja profesora:",
        deleteUserError
      );

      return NextResponse.json(
        {
          error:
            "Korisnički račun profesora nije moguće obrisati.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Profesor je uspješno obrisan.",
    });
  } catch (error) {
    console.error(
      "Neočekivana greška pri brisanju profesora:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Došlo je do neočekivane greške pri brisanju profesora.",
      },
      {
        status: 500,
      }
    );
  }
}