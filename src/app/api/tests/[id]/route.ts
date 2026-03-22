import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface OptionInput {
  content: string
  score?: number
}

interface QuestionInput {
  content: string
  options: OptionInput[]
}

interface TestUpdateBody {
  title: string
  description?: string
  status: string
  questions?: QuestionInput[]
}

// 获取单个测试单
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: {
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        resultTypes: {
          include: {
            conditions: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(test)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch test' },
      { status: 500 }
    )
  }
}

// 更新测试单
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: TestUpdateBody = await request.json()
    const { title, description, status, questions } = body

    // 如果没有提供 questions，则只更新基本信息
    if (!questions || questions.length === 0) {
      const test = await prisma.test.update({
        where: { id },
        data: {
          title,
          description,
          status,
        },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      })
      return NextResponse.json(test)
    }

    // 先删除原有问题和选项
    await prisma.option.deleteMany({
      where: {
        question: {
          testId: id,
        },
      },
    })
    await prisma.question.deleteMany({
      where: {
        testId: id,
      },
    })

    // 更新测试单并创建新问题和选项
    const test = await prisma.test.update({
      where: { id },
      data: {
        title,
        description,
        status,
        questions: {
          create: questions.map((q: QuestionInput, index: number) => ({
            content: q.content,
            order: index,
            options: {
              create: q.options.map((opt: OptionInput, optIndex: number) => ({
                content: opt.content,
                score: opt.score || 0,
                order: optIndex,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    })

    return NextResponse.json(test)
  } catch (error) {
    console.error('Update test error:', error)
    return NextResponse.json(
      { error: 'Failed to update test' },
      { status: 500 }
    )
  }
}

// 删除测试单
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.test.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Test deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete test' },
      { status: 500 }
    )
  }
}
