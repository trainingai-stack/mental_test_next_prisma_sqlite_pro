import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取单个响应详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const response = await prisma.response.findUnique({
      where: { id },
      include: {
        test: true,
        answers: {
          include: {
            question: true,
            option: true,
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
    return NextResponse.json(
      { error: 'Failed to fetch response' },
      { status: 500 }
    )
  }
}
