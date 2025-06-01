import { NextResponse } from "next/server";
import { StorageService } from "@/lib/storage-service";

export async function GET() {
  console.log("Starting storage recalculation job");

  try {
    await StorageService.recalculateAllStorageUsage();

    return NextResponse.json({
      success: true,
      message: "Storage usage recalculated for all organizations",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in storage recalculation job:", error);
    return NextResponse.json(
      {
        error: "Error in storage recalculation job",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
