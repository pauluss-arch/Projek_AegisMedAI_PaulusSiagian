import { NextResponse, type NextRequest } from 'next/server';

export async function readJsonBody(
  request: NextRequest,
): Promise<{ success: true; data: unknown } | { success: false; response: NextResponse }> {
  try {
    return { success: true, data: await request.json() };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, message: 'Request body must contain valid JSON.' },
          { status: 400 },
        ),
      };
    }
    throw error;
  }
}
