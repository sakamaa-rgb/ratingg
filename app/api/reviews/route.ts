import { NextResponse } from "next/server";
import {
  getAllReviews,
  getReviewsByMovieId,
  createReview,
  updateReviewStatus,
  deleteReview,
} from "@/lib/reviews";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const movieId = searchParams.get("movieId");

  if (movieId) {
    const reviews = await getReviewsByMovieId(movieId);
    return NextResponse.json({ success: true, reviews });
  }

  const reviews = await getAllReviews();
  return NextResponse.json({ success: true, reviews });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.movieId || !body.movieTitle || !body.comment) {
      return NextResponse.json(
        { error: "Movie ID, Title, and Review Comment are required." },
        { status: 400 }
      );
    }

    const newReview = await createReview({
      movieId: Number(body.movieId),
      movieTitle: body.movieTitle,
      moviePoster: body.moviePoster,
      author: body.author,
      rating: Number(body.rating) || 5,
      comment: body.comment,
      status: body.status || "approved",
    });

    return NextResponse.json({ success: true, review: newReview });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to save review." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id || !body.status) {
      return NextResponse.json(
        { error: "Review ID and status are required." },
        { status: 400 }
      );
    }

    const updated = await updateReviewStatus(body.id, body.status);
    if (!updated) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, review: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update review." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Review ID is required." },
      { status: 400 }
    );
  }

  const deleted = await deleteReview(id);
  if (!deleted) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, deletedId: id });
}
