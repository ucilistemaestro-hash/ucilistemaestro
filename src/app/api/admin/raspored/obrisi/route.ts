import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY!;

export async function POST(
  request: NextRequest
) {
  try {
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
      authorization.replace(
        "Bearer ",
        ""
      );

    const supabaseAuth =
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

    const {
      data: { user },
      error: userError,
    } =
      await supabaseAuth.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "Prijava nije valjana ili je istekla.",
        },
        {
          status: 401,
        }
      );
    }

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
      data: administrator,
      error:
        administratorError,
    } = await supabaseAdmin
      .from("profili")
      .select(
        "id, uloga, aktivan"
      )
      .eq("id", user.id)
      .maybeSingle();

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
            "Nemate administratorske ovlasti.",
        },
        {
          status: 403,
        }
      );
    }

    let body: {
      predavanje_id?: string;
    };

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Neispravni podaci zahtjeva.",
        },
        {
          status: 400,
        }
      );
    }

    const predavanjeId =
      body.predavanje_id?.trim();

    if (!predavanjeId) {
      return NextResponse.json(
        {
          error:
            "Nije odabrano predavanje za brisanje.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: predavanje,
      error: predavanjeError,
    } = await supabaseAdmin
      .from("predavanja")
      .select(
        "id, naziv, status"
      )
      .eq(
        "id",
        predavanjeId
      )
      .maybeSingle();

    if (predavanjeError) {
      return NextResponse.json(
        {
          error:
            "Nije moguće provjeriti predavanje.",
        },
        {
          status: 500,
        }
      );
    }

    if (!predavanje) {
      return NextResponse.json(
        {
          error:
            "Predavanje nije pronađeno.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      predavanje.status ===
      "odrzano"
    ) {
      return NextResponse.json(
        {
          error:
            "Održano predavanje nije moguće trajno obrisati. Ono ostaje u rasporedu radi očuvanja povijesti.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      error: deleteError,
    } = await supabaseAdmin
      .from("predavanja")
      .delete()
      .eq(
        "id",
        predavanjeId
      );

    if (deleteError) {
      console.error(
        "Greška brisanja predavanja:",
        deleteError
      );

      return NextResponse.json(
        {
          error:
            "Predavanje nije moguće obrisati.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Predavanje je trajno obrisano.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Neočekivana greška pri brisanju predavanja:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Dogodila se neočekivana greška pri brisanju predavanja.",
      },
      {
        status: 500,
      }
    );
  }
}
