import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Niste prijavljeni." },
        { status: 401 }
      );
    }

    const token = authorization.replace("Bearer ", "");

    const supabaseUser = createClient(
      supabaseUrl,
      publishableKey,
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
    } = await supabaseUser.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Neispravna prijava." },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      secretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: adminProfil } = await supabaseAdmin
      .from("profili")
      .select("uloga, aktivan")
      .eq("id", user.id)
      .single();

    if (
      !adminProfil ||
      adminProfil.uloga !== "administrator" ||
      adminProfil.aktivan !== true
    ) {
      return NextResponse.json(
        { error: "Nemate administratorske ovlasti." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const imePrezime = String(
      body.ime_prezime ?? ""
    ).trim();

    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    const telefon = String(body.telefon ?? "").trim();
    const lozinka = String(body.lozinka ?? "");

    if (!imePrezime || !email || !lozinka) {
      return NextResponse.json(
        { error: "Ime, e-mail i lozinka su obavezni." },
        { status: 400 }
      );
    }

    if (lozinka.length < 8) {
      return NextResponse.json(
        { error: "Lozinka mora imati najmanje 8 znakova." },
        { status: 400 }
      );
    }

    const { data: novaOsoba, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: lozinka,
        email_confirm: true,
        user_metadata: {
          ime_prezime: imePrezime,
        },
      });

    if (createError || !novaOsoba.user) {
      return NextResponse.json(
        {
          error:
            createError?.message ??
            "Nije moguće napraviti profesora.",
        },
        { status: 400 }
      );
    }

    const korisnikId = novaOsoba.user.id;

    const { error: profilError } = await supabaseAdmin
      .from("profili")
      .update({
        ime_prezime: imePrezime,
        email,
        telefon: telefon || null,
        uloga: "profesor",
        aktivan: true,
      })
      .eq("id", korisnikId);

    if (profilError) {
      await supabaseAdmin.auth.admin.deleteUser(korisnikId);

      return NextResponse.json(
        { error: "Nije moguće napraviti profil profesora." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      korisnik_id: korisnikId,
    });
  } catch {
    return NextResponse.json(
      { error: "Dogodila se neočekivana greška." },
      { status: 500 }
    );
  }
}