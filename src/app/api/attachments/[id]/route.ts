import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";

interface RouteProps {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const user = await getSession();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const attachment = await prisma.issueAttachment.findUnique({
    where: { id: params.id },
  });

  if (!attachment) {
    return new NextResponse("Attachment Not Found", { status: 404 });
  }

  try {
    const fileBuffer = await fs.readFile(attachment.storagePath);

    // Determine disposition (inline for images/pdf, attachment for logs/dumps)
    const isInline =
      attachment.mimeType.startsWith("image/") ||
      attachment.mimeType === "application/pdf" ||
      attachment.mimeType === "text/plain";

    const disposition = isInline ? "inline" : "attachment";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType || "application/octet-stream",
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(
          attachment.fileName
        )}"`,
        "Content-Length": attachment.fileSize.toString(),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Error serving attachment:", err);
    return new NextResponse("File Read Error", { status: 500 });
  }
}
