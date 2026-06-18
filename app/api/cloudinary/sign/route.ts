import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSignedUploadParams } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  // Only admins can get signed upload params
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const folder = body.folder ?? "kaiva/products";
  const params = generateSignedUploadParams(folder);

  return NextResponse.json(params, { status: 200 });
}
