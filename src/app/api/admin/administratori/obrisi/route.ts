import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

export async function POST(request: NextRequest) {
  try {
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

    const accessToken = authorization.replace(
      "Bearer ",
      ""
    );

    const supabaseAuth = createClient(
      supabaseUrl,
      supabasePublishableKey,
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
    } = await supabaseAuth.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Prijava nije valjana ili je istekla.",
        },
        {
          status: 401,
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

    const {
      data: prijavljeniAdministrator,
      error: administratorError,
    } = await supabaseAdmin
      .from("profili")
      .select("id, uloga, aktivan")
      .eq("id", user.id)
      .maybeSingle();

    if (
      administratorError ||
      !prijavljeniAdministrator ||
      prijavljeniAdministrator.uloga !== "administrator" ||
      prijavljeniAdministrator.aktivan !== true
    ) {
      return NextResponse.json(
        {
          error: "Nemate administratorske ovlasti.",
        },
        {
          status: 403,
        }
      );
    }

    let body: {
      administrator_id?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Neispravni podaci zahtjeva.",
        },
        {
          status: 400,
        }
      );
    }

    const administratorId =
      body.administrator_id?.trim();

    if (!administratorId) {
      return NextResponse.json(
        {
          error:
            "Nije odabran administrator za brisanje.",
        },
        {
          status: 400,
        }
      );
    }

    if (administratorId === user.id) {
      return NextResponse.json(
        {
          error:
            "Ne možete obrisati vlastiti administratorski račun.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      data: administratorZaBrisanje,
      error: targetError,
    } = await supabaseAdmin
      .from("profili")
      .select(
        "id, ime_prezime, email, uloga, aktivan"
      )
      .eq("id", administratorId)
      .maybeSingle();

    if (targetError) {
      return NextResponse.json(
        {
          error:
            "Nije moguće provjeriti administratorski račun.",
        },
        {
          status: 500,
        }
      );
    }

    if (!administratorZaBrisanje) {
      return NextResponse.json(
        {
          error: "Administrator nije pronađen.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      administratorZaBrisanje.uloga !==
      "administrator"
    ) {
      return NextResponse.json(
        {
          error:
            "Odabrani korisnik nije administrator.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      count: brojAktivnihAdministratora,
      error: countError,
    } = await supabaseAdmin
      .from("profili")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("uloga", "administrator")
      .eq("aktivan", true);

    if (countError) {
      return NextResponse.json(
        {
          error:
            "Nije moguće provjeriti broj aktivnih administratora.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      administratorZaBrisanje.aktivan === true &&
      (brojAktivnihAdministratora ?? 0) <= 1
    ) {
      return NextResponse.json(
        {
          error:
            "Nije moguće obrisati zadnjeg aktivnog administratora.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      count: brojPredavanja,
      error: predavanjaError,
    } = await supabaseAdmin
      .from("predavanja")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("profesor_id", administratorId);

    if (predavanjaError) {
      return NextResponse.json(
        {
          error:
            "Nije moguće provjeriti povezana predavanja.",
        },
        {
          status: 500,
        }
      );
    }

    if ((brojPredavanja ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "Administrator ima povezana predavanja iz ranijeg razdoblja. Radi očuvanja podataka deaktivirajte račun umjesto brisanja.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      count: brojClanstava,
      error: clanstvaError,
    } = await supabaseAdmin
      .from("clanstva_skupina")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("korisnik_id", administratorId);

    if (clanstvaError) {
      return NextResponse.json(
        {
          error:
            "Nije moguće provjeriti povezana članstva u skupinama.",
        },
        {
          status: 500,
        }
      );
    }

    if ((brojClanstava ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "Administrator ima povijest članstva u obrazovnoj skupini. Radi očuvanja podataka deaktivirajte račun umjesto brisanja.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      count: brojKreiranihObavijesti,
      error: kreiraneObavijestiError,
    } = await supabaseAdmin
      .from("obavijesti")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("created_by", administratorId);

    if (kreiraneObavijestiError) {
      return NextResponse.json(
        {
          error:
            "Nije moguće provjeriti obavijesti koje je administrator kreirao.",
        },
        {
          status: 500,
        }
      );
    }

    if ((brojKreiranihObavijesti ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "Administrator je autor postojećih obavijesti. Radi očuvanja povijesti deaktivirajte račun umjesto brisanja.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      error: osobneObavijestiError,
    } = await supabaseAdmin
      .from("obavijesti")
      .delete()
      .eq("korisnik_id", administratorId);

    if (osobneObavijestiError) {
      return NextResponse.json(
        {
          error:
            "Nije moguće ukloniti osobne obavijesti administratora.",
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
        administratorId
      );

    if (deleteUserError) {
      return NextResponse.json(
        {
          error:
            "Administratorski račun nije moguće obrisati.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Administrator je obrisan.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Greška pri brisanju administratora:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Dogodila se neočekivana greška pri brisanju administratora.",
      },
      {
        status: 500,
      }
    );
  }
}