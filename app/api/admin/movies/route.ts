import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAllAdminMoviesAsync,
  getAdminMoviesByAuthor,
  createAdminMovie,
  updateAdminMovie,
  deleteAdminMovie,
  checkSupabaseMoviesStatus,
} from "@/lib/admin-movies";

export const dynamic = "force-dynamic";

async function getAdminUser() {
  const cookieStore = await cookies();
  const devSession = cookieStore.get("brutal_dev_session")?.value;
  const devRole = cookieStore.get("brutal_user_role")?.value;
  const devEmail = cookieStore.get("brutal_user_email")?.value;

  if (devSession !== "authenticated" || !devEmail) {
    return null;
  }

  const cleanEmail = devEmail.toLowerCase().trim();
  const adminEmail = (process.env.ADMIN_EMAIL || "adminflix123@gmail.com").toLowerCase().trim();
  const isAdmin =
    cleanEmail === "rajibjugi02@gmail.com" ||
    cleanEmail === adminEmail;

  if (isAdmin) {
    return {
      authenticated: true,
      email: devEmail,
      role: "admin",
    };
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const author = searchParams.get("author");
  const includeAll = searchParams.get("all") === "true";

  const dbStatus = await checkSupabaseMoviesStatus();

  if (author) {
    const movies = await getAdminMoviesByAuthor(author);
    return NextResponse.json({ success: true, movies, dbStatus });
  }

  const movies = await getAllAdminMoviesAsync();
  if (includeAll) {
    const { LEGAL_FALLBACK_MOVIES } = await import("@/lib/tmdb");
    return NextResponse.json({ success: true, movies: [...movies, ...LEGAL_FALLBACK_MOVIES], dbStatus });
  }

  return NextResponse.json({ success: true, movies, dbStatus });
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized: Admin privileges required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    if (!body.title || !body.overview) {
      return NextResponse.json(
        { error: "Title and Overview are required fields." },
        { status: 400 }
      );
    }

    const newMovie = await createAdminMovie(
      {
        title: body.title,
        tagline: body.tagline,
        overview: body.overview,
        poster_path: body.poster_path || "",
        backdrop_path: body.backdrop_path,
        release_date: body.release_date,
        vote_average: Number(body.vote_average) || 7.5,
        vote_count: Number(body.vote_count) || 1,
        category: body.category || "popular",
        genres: body.genres,
        runtime: Number(body.runtime) || 120,
        youtube_video_id: body.youtube_video_id,
      },
      admin.email
    );

    return NextResponse.json({ success: true, movie: newMovie });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create movie." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized: Admin privileges required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json(
        { error: "Movie ID is required for editing." },
        { status: 400 }
      );
    }

    const result = await updateAdminMovie(body.id, body, admin.email);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, movie: result.movie });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update movie." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized: Admin privileges required." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Movie ID parameter is required for deletion." },
      { status: 400 }
    );
  }

  const result = await deleteAdminMovie(id, admin.email);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, deletedId: id });
}
