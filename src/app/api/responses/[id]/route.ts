import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取单个响应（用于分享结果）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const response = await prisma.response.findUnique({
      where: { id },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                content: true,
              },
            },
            option: {
              select: {
                id: true,
                content: true,
                score: true,
              },
            },
          },
        },
        results: {
          include: {
            result: true,
          },
        },
      },
    })

    if (!response) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Fetch response error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch response' },
      { status: 500 }
    )
  }
}
