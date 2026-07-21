import { NextRequest, NextResponse } from 'next/server';
import { prisma, ProjectStatus } from '@frameforge/database';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

const updateStatusSchema = z.object({
  projectId: z.string().uuid(),
  status: z.nativeEnum(ProjectStatus),
});

// POST /api/projects/kanban - Drag-and-drop workspace update
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const userEmail = session?.user?.email;

    const body = await req.json();
    const result = updateStatusSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: result.error.format() }, { status: 400 });
    }

    const { projectId, status } = result.data;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: { include: { members: { include: { user: true } } } } },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (userEmail) {
      const isMember = project.workspace.members.some(m => m.user.email === userEmail);
      if (!isMember) {
        return NextResponse.json({ error: 'Unauthorized workspace access' }, { status: 403 });
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { status },
    });

    return NextResponse.json({ success: true, project: updatedProject });
  } catch (error: any) {
    console.error('Error updating project status:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// GET /api/projects/kanban - Retrieve pipeline boards organized by column
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId parameter is required' }, { status: 400 });
    }

    const projects = await prisma.project.findMany({
      where: { workspaceId: workspaceId },
      orderBy: { dueDate: 'asc' },
    });

    const boards: Record<ProjectStatus, typeof projects> = {
      INTAKE: [],
      SCHEDULED: [],
      SHOOTING: [],
      POST_PROCESSING: [],
      CLIENT_REVIEW: [],
      COMPLETED: [],
    };

    projects.forEach(p => {
      if (boards[p.status]) {
        boards[p.status].push(p);
      }
    });

    return NextResponse.json({ boards });
  } catch (error: any) {
    console.error('Error fetching kanban boards:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
