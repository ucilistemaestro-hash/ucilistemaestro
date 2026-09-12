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
      aktivan?: boolean;
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

    const aktivan = body.aktivan;

    if (!administratorId) {
      return NextResponse.json(
        {
          error:
            "Nije odabran administrator.",
        },
        {
          status: 400,
        }
      );
    }

    if (typeof aktivan !== "boolean") {
      return NextResponse.json(
        {
          error:
            "Nije zadano ispravno stanje administratora.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: administratorZaPromjenu,
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

    if (!administratorZaPromjenu) {
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
      administratorZaPromjenu.uloga !==
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

    if (
      administratorId === user.id &&
      aktivan === false
    ) {
      return NextResponse.json(
        {
          error:
            "Ne možete deaktivirati vlastiti administratorski račun.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      aktivan === false &&
      administratorZaPromjenu.aktivan === true
    ) {
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
        (brojAktivnihAdministratora ?? 0) <= 1
      ) {
        return NextResponse.json(
          {
            error:
              "Nije moguće deaktivirati zadnjeg aktivnog administratora.",
          },
          {
            status: 409,
          }
        );
      }
    }

    const {
      error: updateError,
    } = await supabaseAdmin
      .from("profili")
      .update({
        aktivan,
      })
      .eq("id", administratorId);

    if (updateError) {
      return NextResponse.json(
        {
          error:
            "Nije moguće promijeniti status administratora.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: aktivan
          ? "Administrator je aktiviran."
          : "Administrator je deaktiviran.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Greška pri promjeni statusa administratora:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Dogodila se neočekivana greška pri promjeni statusa administratora.",
      },
      {
        status: 500,
      }
    );
  }
}