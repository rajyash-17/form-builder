import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyJWT } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { CaseModel } from '@/server/models/Case';
import { TestimonyModel } from '@/server/models/Testimony';

/**
 * Sanitizes CSV cell to prevent CSV Formula Injection in Excel/Sheets.
 * Prefixes cells starting with '=', '+', '-', or '@' with a single quote.
 */
function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  
  let strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);

  // Prevent CSV Formula Injection
  if (/^[=+\-@]/.test(strVal)) {
    strVal = `'${strVal}`;
  }

  // Escape quotes and wrap in double quotes
  const escaped = strVal.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = params.id;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') === 'json' ? 'json' : 'csv';

    // 1. Verify Detective Authentication
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Access Denied: Detective authorization required.' },
        { status: 401 }
      );
    }

    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Access Denied: Invalid detective badge credentials.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // 2. Verify Case Ownership Strictly
    const caseDoc = await CaseModel.findOne({
      _id: caseId,
      userId: user.userId,
    }).lean();

    if (!caseDoc) {
      return NextResponse.json(
        { error: 'Access Denied: Case file not found or permission denied.' },
        { status: 403 }
      );
    }

    // 3. Fetch Testimonies
    const testimonies = await TestimonyModel.find({ caseId: caseDoc._id })
      .sort({ submittedAt: 1 })
      .lean();

    const clues = caseDoc.clues || [];

    // JSON Format Export
    if (format === 'json') {
      const jsonOutput = testimonies.map((t) => {
        const rowData: Record<string, unknown> = {
          submittedAt: t.submittedAt.toISOString(),
        };
        clues.forEach((clue) => {
          if (clue.type !== 'statement') {
            rowData[clue.label] = (t.answers as Record<string, unknown>)[clue.id] ?? '';
          }
        });
        return rowData;
      });

      return new NextResponse(JSON.stringify(jsonOutput, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="case-report-${caseDoc.shareId}.json"`,
        },
      });
    }

    // CSV Format Export
    const inputClues = clues.filter((c) => c.type !== 'statement');
    const headerRow = ['Submitted At', ...inputClues.map((c) => c.label)].map(sanitizeCsvCell).join(',');

    const csvRows = testimonies.map((t) => {
      const answersObj = (t.answers as Record<string, unknown>) || {};
      const dateCell = sanitizeCsvCell(t.submittedAt.toISOString());
      const clueCells = inputClues.map((c) => sanitizeCsvCell(answersObj[c.id]));
      return [dateCell, ...clueCells].join(',');
    });

    const csvContent = [headerRow, ...csvRows].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="case-report-${caseDoc.shareId}.csv"`,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to generate case report.' },
      { status: 500 }
    );
  }
}
