import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

function porukaZaAuthGresku(message: string) {
  const tekst = message.toLowerCase();

  if (
    tekst.includes("already") ||
    tekst.includes("registered") ||
    tekst.includes("exists") ||
    tekst.includes("duplicate")
  ) {
    return "Korisnik s ovom e-mail adresom već postoji.";
  }

  if (
    tekst.includes("rate limit") ||
    tekst.includes("email rate")
  ) {
    return "Dosegnuto je ograničenje slanja e-mailova. Pokušajte ponovno malo kasnije.";
  }

  return message;
}

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
      data: administrator,
      error: administratorError,
    } = await supabaseAdmin
      .from("profili")
      .select("id, uloga, aktivan")
      .eq("id", user.id)
      .maybeSingle();

    if (
      administratorError ||
      !administrator ||
      administrator.uloga !== "administrator" ||
      administrator.aktivan !== true
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
      ime_prezime?: string;
      email?: string;
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

    const imePrezime = body.ime_prezime?.trim();
    const email = body.email
      ?.trim()
      .toLowerCase();

    if (!imePrezime) {
      return NextResponse.json(
        {
          error: "Unesite ime i prezime administratora.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error: "Unesite e-mail administratora.",
        },
        {
          status: 400,
        }
      );
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: "Unesite ispravnu e-mail adresu.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: postojeciProfil,
      error: postojeciProfilError,
    } = await supabaseAdmin
      .from("profili")
      .select("id, email, uloga")
      .ilike("email", email)
      .maybeSingle();

    if (postojeciProfilError) {
      return NextResponse.json(
        {
          error:
            "Nije moguće provjeriti postoji li korisnik s ovom e-mail adresom.",
        },
        {
          status: 500,
        }
      );
    }

    if (postojeciProfil) {
      return NextResponse.json(
        {
          error:
            "Korisnik s ovom e-mail adresom već postoji.",
        },
        {
          status: 409,
        }
      );
    }

    const origin = request.nextUrl.origin;

    const redirectTo =
      origin.includes("localhost") ||
      origin.includes("127.0.0.1")
        ? `${origin}/postavi-lozinku`
        : "https://app.uciliste-maestro.hr/postavi-lozinku";

    const {
      data: inviteData,
      error: inviteError,
    } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo,
          data: {
            ime_prezime: imePrezime,
            uloga: "administrator",
          },
        }
      );

    if (inviteError) {
      return NextResponse.json(
        {
          error: porukaZaAuthGresku(
            inviteError.message
          ),
        },
        {
          status: 400,
        }
      );
    }

    const noviKorisnik = inviteData.user;

    if (!noviKorisnik) {
      return NextResponse.json(
        {
          error:
            "Pozivnica je poslana, ali korisnički račun nije pravilno kreiran.",
        },
        {
          status: 500,
        }
      );
    }

    const {
      error: profilUpdateError,
    } = await supabaseAdmin
      .from("profili")
      .update({
        ime_prezime: imePrezime,
        email,
        uloga: "administrator",
        aktivan: true,
      })
      .eq("id", noviKorisnik.id);

    if (profilUpdateError) {
      await supabaseAdmin.auth.admin.deleteUser(
        noviKorisnik.id
      );

      return NextResponse.json(
        {
          error:
            "Korisnički račun nije moguće pravilno postaviti kao administratora.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        pozivnica_poslana: true,
        message:
          "Administrator je dodan i pozivnica za postavljanje lozinke je poslana na njegov e-mail.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Greška pri dodavanju administratora:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Dogodila se neočekivana greška pri dodavanju administratora.",
      },
      {
        status: 500,
      }
    );
  }
}