import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 预览测试结果
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { answers } = body

    // 获取测试信息和结果类型
    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        resultTypes: {
          include: {
            rules: true,
          },
        },
        questions: {
          include: {
            options: true,
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

    if (test.resultTypes.length === 0) {
      return NextResponse.json(
        { error: 'No result types configured' },
        { status: 400 }
      )
    }

    // 构建完整的答案对象（包含选项信息）
    const answerWithOptions = answers.map((answer: any) => {
      const question = test.questions.find(q => q.id === answer.questionId)
      const option = question?.options.find(o => o.id === answer.optionId)
      return {
        questionId: answer.questionId,
        optionId: answer.optionId,
        option: option || { score: 0 },
      }
    })

    // 匹配结果类型
    const totalScore = answerWithOptions.reduce((sum: number, a: any) => sum + a.option.score, 0)
    const answerMap = new Map<string, string>()
    answerWithOptions.forEach((a: any) => {
      answerMap.set(a.questionId, a.optionId)
    })

    let matchedResultType = test.resultTypes[0] // 默认第一个

    for (const resultType of test.resultTypes) {
      for (const rule of resultType.rules) {
        const conditions = JSON.parse(rule.conditions)
        
        if (rule.matchType === 'score') {
          if (rule.scoreThreshold && totalScore >= rule.scoreThreshold) {
            matchedResultType = resultType
            break
          }
        } else if (rule.matchType === 'all') {
          let allMatched = true
          for (const [questionId, allowedOptionIds] of Object.entries(conditions)) {
            const userOptionId = answerMap.get(questionId)
            if (!userOptionId || !(allowedOptionIds as string[]).includes(userOptionId)) {
              allMatched = false
              break
            }
          }
          if (allMatched) {
            matchedResultType = resultType
            break
          }
        } else if (rule.matchType === 'any') {
          for (const [questionId, allowedOptionIds] of Object.entries(conditions)) {
            const userOptionId = answerMap.get(questionId)
            if (userOptionId && (allowedOptionIds as string[]).includes(userOptionId)) {
              matchedResultType = resultType
              break
            }
          }
        }
      }
    }

    return NextResponse.json({
      resultType: matchedResultType,
      totalScore,
    })
  } catch (error) {
    console.error('Preview result error:', error)
    return NextResponse.json(
      { error: 'Failed to preview result' },
      { status: 500 }
    )
  }
}
