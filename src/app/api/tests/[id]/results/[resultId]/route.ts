import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RuleInput {
  conditions: Record<string, string[]>
  priority?: number
}

// 更新结果类型
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resultId: string }> }
) {
  try {
    const { resultId } = await params
    const body = await request.json()
    const { name, code, description, explanation, advice, imageUrl, order, rules } = body

    // 先删除旧规则
    await prisma.resultRule.deleteMany({
      where: { resultId },
    })

    // 更新结果类型并创建新规则
    const result = await prisma.testResult.update({
      where: { id: resultId },
      data: {
        name,
        code,
        description,
        explanation,
        advice,
        imageUrl,
        order,
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

    return NextResponse.json(result)
  } catch (error) {
    console.error('Update result error:', error)
    return NextResponse.json(
      { error: 'Failed to update result' },
      { status: 500 }
    )
  }
}

// 删除结果类型
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resultId: string }> }
) {
  try {
    const { resultId } = await params

    await prisma.testResult.delete({
      where: { id: resultId },
    })

    return NextResponse.json({ message: 'Result deleted successfully' })
  } catch (error) {
    console.error('Delete result error:', error)
    return NextResponse.json(
      { error: 'Failed to delete result' },
      { status: 500 }
    )
  }
}
