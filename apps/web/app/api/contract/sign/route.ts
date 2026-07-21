import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@frameforge/database';
import { z } from 'zod';

const signContractSchema = z.object({
  contractId: z.string().uuid(),
  signatureSvg: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = signContractSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid signature parameters', details: result.error.format() }, { status: 400 });
    }

    const { contractId, signatureSvg } = result.data;

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    if (contract.signedAt) {
      return NextResponse.json({ error: 'Contract has already been signed' }, { status: 409 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        signatureSvg,
        ipAddress: clientIp,
        signedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contract signed successfully',
      signedAt: updatedContract.signedAt,
      ipAddress: updatedContract.ipAddress,
    });
  } catch (error: any) {
    console.error('Error signing contract:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
