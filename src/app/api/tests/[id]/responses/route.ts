import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取测试的所有响应
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const responses = await prisma.response.findMany({
      where: { testId: id },
      include: {
        answers: {
          include: {
            question: true,
            option: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(responses)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    )
  }
}
