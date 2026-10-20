import { prisma } from "./prisma";

/**
 * Concurrency-safe atomic generation of readable issue identifiers.
 * Format: ISS-{YEAR}-{0001} (e.g. ISS-2026-0001)
 *
 * Utilizes an atomic sequence transaction on the IssueSequence table to guarantee
 * unique sequential numbers even under heavy concurrent loads.
 */
export async function generateNextIssueNumber(tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]): Promise<string> {
  const client = tx || prisma;
  const currentYear = new Date().getFullYear();

  // Find the highest existing issue number for this year to prevent collision with seeded or imported issues
  const latestIssue = await client.issue.findFirst({
    where: {
      issueNumber: {
        startsWith: `ISS-${currentYear}-`,
      },
    },
    orderBy: {
      issueNumber: "desc",
    },
    select: {
      issueNumber: true,
    },
  });

  let maxExisting = 0;
  if (latestIssue?.issueNumber) {
    const parts = latestIssue.issueNumber.split("-");
    const num = parseInt(parts[2], 10);
    if (!isNaN(num)) {
      maxExisting = num;
    }
  }

  // Atomically increment or initialize the sequence for the current year
  const currentSeq = await client.issueSequence.findUnique({
    where: { year: currentYear },
  });

  let nextValue = (currentSeq?.lastValue ?? 0) + 1;
  if (nextValue <= maxExisting) {
    nextValue = maxExisting + 1;
  }

  await client.issueSequence.upsert({
    where: { year: currentYear },
    update: {
      lastValue: nextValue,
    },
    create: {
      year: currentYear,
      lastValue: nextValue,
    },
  });

  const paddedNumber = String(nextValue).padStart(4, "0");
  return `ISS-${currentYear}-${paddedNumber}`;
}
