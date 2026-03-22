import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RuleInput {
  conditions: Record<string, string[]>
  priority?: number
}

interface ResultInput {
  name: string
  code: string
  description: string
  explanation: string
  advice: string
  imageUrl?: string
  rules?: RuleInput[]
}

// 获取测试单的所有结果类型
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const results = await prisma.testResult.findMany({
      where: { testId: id },
      include: {
        rules: true,
      },
      orderBy: {
        order: 'asc',
      },
    })
    return NextResponse.json(results)
  } catch (error) {
    console.error('Fetch results error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    )
  }
}

// 创建结果类型
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, code, description, explanation, advice, imageUrl, order, rules } = body

    // 验证测试单是否存在
    const test = await prisma.test.findUnique({
      where: { id },
    })

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    // 创建结果类型及其规则
    const result = await prisma.testResult.create({
      data: {
        testId: id,
        name,
        code,
        description,
        explanation,
        advice,
        imageUrl,
        order: order || 0,
        rules: {
          create: rules?.map((rule: RuleInput) => ({
            conditions: JSON.stringify(rule.conditions),
            priority: rule.priority || 0,
          })) || [],
        },
      },
      include: {
        rules: true,
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Create result error:', error)
    return NextResponse.json(
      { error: 'Failed to create result' },
      { status: 500 }
    )
  }
}

// 批量更新结果类型（用于编辑页面）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { results } = body as { results: ResultInput[] }

    // 验证测试单是否存在
    const test = await prisma.test.findUnique({
      where: { id },
    })

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    // 删除该测试单下的所有结果类型（包括规则）
    await prisma.resultRule.deleteMany({
      where: {
        result: {
          testId: id,
        },
      },
    })
    await prisma.testResult.deleteMany({
      where: { testId: id },
    })

    // 重新创建结果类型
    const createdResults = await Promise.all(
      results.map(async (result: ResultInput, index: number) => {
        return prisma.testResult.create({
          data: {
            testId: id,
            name: result.name,
            code: result.code,
            description: result.description,
            explanation: result.explanation,
            advice: result.advice,
            imageUrl: result.imageUrl,
            order: index,
            rules: {
              create: result.rules?.map((rule: RuleInput) => ({
                conditions: JSON.stringify(rule.conditions),
                priority: rule.priority || 0,
              })) || [],
            },
          },
          include: {
            rules: true,
          },
        })
      })
    )

    return NextResponse.json(createdResults)
  } catch (error) {
    console.error('Update results error:', error)
    return NextResponse.json(
      { error: 'Failed to update results' },
      { status: 500 }
    )
  }
}
