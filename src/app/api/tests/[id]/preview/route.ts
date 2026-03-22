import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 预览结果 - 根据选择的答案返回匹配的结果
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { answers } = body // { questionId: optionId }

    // 获取测试单的所有结果类型和规则
    const results = await prisma.testResult.findMany({
      where: { testId: id },
      include: {
        rules: true,
      },
    })

    // 匹配结果
    const matchedResults = results.filter((result) => {
      // 如果没有规则，则不匹配
      if (result.rules.length === 0) return false

      // 检查是否满足任一规则
      return result.rules.some((rule) => {
        const conditions = JSON.parse(rule.conditions)
        // 检查所有条件是否满足
        return Object.entries(conditions).every(([questionId, optionIds]) => {
          const selectedOptionId = answers[questionId]
          if (!selectedOptionId) return false
          return (optionIds as string[]).includes(selectedOptionId)
        })
      })
    })

    // 按优先级排序，返回最高优先级的结果
    if (matchedResults.length > 0) {
      // 找到优先级最高的规则对应的结果
      let bestResult = matchedResults[0]
      let highestPriority = -1

      for (const result of matchedResults) {
        for (const rule of result.rules) {
          const conditions = JSON.parse(rule.conditions)
          const isMatch = Object.entries(conditions).every(([questionId, optionIds]) => {
            const selectedOptionId = answers[questionId]
            if (!selectedOptionId) return false
            return (optionIds as string[]).includes(selectedOptionId)
          })
          if (isMatch && rule.priority > highestPriority) {
            highestPriority = rule.priority
            bestResult = result
          }
        }
      }

      return NextResponse.json({
        matched: true,
        result: bestResult,
      })
    }

    return NextResponse.json({
      matched: false,
      result: null,
    })
  } catch (error) {
    console.error('Preview result error:', error)
    return NextResponse.json(
      { error: 'Failed to preview result' },
      { status: 500 }
    )
  }
}
