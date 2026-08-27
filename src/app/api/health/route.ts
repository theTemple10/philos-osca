import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "oss-contributor",
    timestamp: new Date().toISOString(),
  });
}
