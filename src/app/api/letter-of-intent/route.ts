import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { join } from "path";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "docs", "BETA-LETTER-OF-INTENT.md");
    const content = readFileSync(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load Letter of Intent" },
      { status: 500 }
    );
  }
}
