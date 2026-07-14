import { NextResponse } from "next/server";
import { SAMPLE_CURRICULA } from "@/lib/demo";

/** Sample curricula for the "Try a sample" flow, with a suggested role to search. */
const SUGGESTED_ROLE: Record<string, string> = {
  "fullstack-bootcamp": "Full-Stack Developer",
  "data-science-bootcamp": "Data Scientist",
  "university-cs": "Backend Developer",
};

export async function GET() {
  const samples = SAMPLE_CURRICULA.map((c) => ({
    id: c.id,
    name: c.name,
    track: c.track,
    blurb: c.blurb,
    text: c.text,
    suggestedRole: SUGGESTED_ROLE[c.id] ?? "Software Developer",
  }));
  return NextResponse.json({ samples });
}
