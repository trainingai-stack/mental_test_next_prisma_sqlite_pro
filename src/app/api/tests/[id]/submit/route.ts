import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 提交测试答案
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { answers } = body

    // 验证测试是否存在且已发布
    const test = await prisma.test.findUnique({
      where: { id },
    })

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    if (test.status !== 'published') {
      return NextResponse.json(
        { error: 'Test is not available' },
        { status: 400 }
      )
    }

    // 创建响应记录
    const response = await prisma.response.create({
      data: {
        testId: id,
        answers: {
          create: answers.map((answer: any) => ({
            questionId: answer.questionId,
            optionId: answer.optionId,
          })),
        },
      },
      include: {
        answers: {
          include: {
            question: true,
            option: true,
          },
        },
      },
    })

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Submit test error:', error)
    return NextResponse.json(
      { error: 'Failed to submit test' },
      { status: 500 }
    )
  }
}
