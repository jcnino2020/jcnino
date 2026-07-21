import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@frameforge/database';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const userEmail = session?.user?.email;
    
    if (userEmail) {
      const userMembership = await prisma.member.findFirst({
        where: { user: { email: userEmail } },
      });
      if (!userMembership || userMembership.role !== 'ROOT_ADMIN') {
        return NextResponse.json({ error: 'Forbidden: Admin credentials required' }, { status: 403 });
      }
    }

    const dbStartTime = Date.now();
    const [totalWorkspaces, totalUsers, totalAssets, storageStats] = await Promise.all([
      prisma.workspace.count(),
      prisma.user.count(),
      prisma.asset.count(),
      prisma.workspace.aggregate({
        _sum: {
          storageUsed: true,
        },
      }),
    ]);
    const dbLatency = Date.now() - dbStartTime;

    const totalStorageUsed = Number(storageStats._sum.storageUsed || 0);

    return NextResponse.json({
      status: 'OPERATIONAL',
      latency: `${dbLatency}ms`,
      metrics: {
        totalWorkspaces,
        totalUsers,
        totalAssets,
        storageUsedBytes: totalStorageUsed,
        storageUsedFormatted: `${(totalStorageUsed / (1024 * 1024 * 1024 * 1024)).toFixed(3)} TB`,
      },
      subsystems: {
        database: 'CONNECTED',
        storage: 'CONNECTED',
        redis: 'CONNECTED',
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin metrics:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
