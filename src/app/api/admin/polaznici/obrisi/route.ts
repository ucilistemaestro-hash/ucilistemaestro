import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(request: NextRequest) {
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
            "Nedostaje konfiguracija Supabase poslužitelja.",
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

    const supabaseKorisnik =
      createClient(
        supabaseUrl,
        supabasePublishableKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        supabaseSecretKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

    const {
      data: { user },
      error: userError,
    } =
      await supabaseKorisnik.auth.getUser(
        accessToken
      );

    if (userError || !user) {
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
      data: administrator,
      error: administratorError,
    } = await supabaseAdmin
      .from("profili")
      .select("uloga, aktivan")
      .eq("id", user.id)
      .single();

    if (
      administratorError ||
      !administrator ||
      administrator.uloga !== "administrator" ||
      administrator.aktivan !== true
    ) {
      return NextResponse.json(
        {
          error:
            "Nemate pravo obrisati polaznika.",
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
      body = await request.json();
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

    const korisnikId =
      body.korisnik_id;

    if (!korisnikId) {
      return NextResponse.json(
        {
          error:
            "Nije odabran polaznik za brisanje.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: polaznik,
      error: polaznikError,
    } = await supabaseAdmin
      .from("profili")
      .select(
        "id, ime_prezime, email, uloga"
      )
      .eq("id", korisnikId)
      .single();

    if (
      polaznikError ||
      !polaznik
    ) {
      return NextResponse.json(
        {
          error:
            "Polaznik nije pronađen.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      polaznik.uloga !== "polaznik"
    ) {
      return NextResponse.json(
        {
          error:
            "Odabrani korisnik nije polaznik.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      error: clanstvaError,
    } = await supabaseAdmin
      .from("clanstva_skupina")
      .delete()
      .eq(
        "korisnik_id",
        korisnikId
      );

    if (clanstvaError) {
      console.error(
        "Greška brisanja članstava:",
        clanstvaError
      );

      return NextResponse.json(
        {
          error:
            "Nije moguće obrisati članstva polaznika.",
        },
        {
          status: 500,
        }
      );
    }

    const {
      error: obavijestiError,
    } = await supabaseAdmin
      .from("obavijesti")
      .delete()
      .eq(
        "korisnik_id",
        korisnikId
      );

    if (obavijestiError) {
      console.error(
        "Greška brisanja osobnih obavijesti:",
        obavijestiError
      );

      return NextResponse.json(
        {
          error:
            "Nije moguće obrisati osobne obavijesti polaznika.",
        },
        {
          status: 500,
        }
      );
    }

    const {
      error: deleteUserError,
    } =
      await supabaseAdmin.auth.admin.deleteUser(
        korisnikId
      );

    if (deleteUserError) {
      console.error(
        "Greška brisanja Auth korisnika:",
        deleteUserError
      );

      return NextResponse.json(
        {
          error:
            "Nije moguće obrisati korisnički račun polaznika.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Polaznik je uspješno obrisan.",
    });
  } catch (error) {
    console.error(
      "Neočekivana greška pri brisanju polaznika:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Došlo je do neočekivane greške pri brisanju polaznika.",
      },
      {
        status: 500,
      }
    );
  }
}