import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const health = {
    status: "healthy",
    service: "oss-contributor",
    timestamp: new Date().toISOString(),
    database: "unknown" as string,
    databaseLatency: 0,
  };

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.database = "connected";
    health.databaseLatency = Date.now() - start;
  } catch (error) {
    health.status = "degraded";
    health.database = `error: ${error instanceof Error ? error.message : "unknown"}`;
    console.error("[Health] Database connection failed:", error);
  }

  return NextResponse.json(health, {
    status: health.status === "healthy" ? 200 : 503,
  });
}
