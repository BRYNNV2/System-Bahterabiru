import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Kantin Kampus POS API",
    version: "1.0.0",
    endpoints: {
      menu: "/api/menu",
      orders: "/api/orders",
    },
  });
}

