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

interface TestCreateBody {
  title: string
  description?: string
  questions: QuestionInput[]
}

// 获取所有测试单
export async function GET() {
  try {
    const tests = await prisma.test.findMany({
      include: {
        _count: {
          select: {
            questions: true,
            responses: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(tests)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    )
  }
}

// 创建测试单
export async function POST(request: NextRequest) {
  try {
    const body: TestCreateBody = await request.json()
    const { title, description, questions } = body

    const test = await prisma.test.create({
      data: {
        title,
        description,
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

    return NextResponse.json(test, { status: 201 })
  } catch (error) {
    console.error('Create test error:', error)
    return NextResponse.json(
      { error: 'Failed to create test' },
      { status: 500 }
    )
  }
}
