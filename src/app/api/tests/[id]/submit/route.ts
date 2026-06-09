import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface AnswerInput {
  questionId: string
  optionId: string
}

// 提交测试答案
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { answers } = body as { answers: AnswerInput[] }

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
          create: answers.map((answer: AnswerInput) => ({
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

    // 将答案转换为便于匹配的格式
    const answerMap: Record<string, string> = {}
    answers.forEach((answer: AnswerInput) => {
      answerMap[answer.questionId] = answer.optionId
    })

    // 获取测试单的所有结果类型和规则
    const results = await prisma.testResult.findMany({
      where: { testId: id },
      include: {
        rules: true,
      },
    })

    // 匹配结果
    let bestResult: typeof results[0] | null = null
    let highestPriority = -1

    for (const result of results) {
      for (const rule of result.rules) {
        const conditions = JSON.parse(rule.conditions)
        // 检查所有条件是否满足
        const isMatch = Object.entries(conditions).every(([questionId, optionIds]) => {
          const selectedOptionId = answerMap[questionId]
          if (!selectedOptionId) return false
          return (optionIds as string[]).includes(selectedOptionId)
        })

        if (isMatch && rule.priority > highestPriority) {
          highestPriority = rule.priority
          bestResult = result
        }
      }
    }

    // 如果匹配到结果，创建关联
    if (bestResult) {
      await prisma.responseResult.create({
        data: {
          responseId: response.id,
          resultId: bestResult.id,
        },
      })
    }

    // 计算得分
    let totalScore = 0
    let maxScore = 0
    const testWithQuestions = await prisma.test.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    })

    if (testWithQuestions) {
      testWithQuestions.questions.forEach((q) => {
        const selectedOption = q.options.find((o) => answerMap[q.id] === o.id)
        const maxOptionScore = Math.max(...q.options.map((o) => o.score))
        if (selectedOption) {
          totalScore += selectedOption.score
        }
        maxScore += maxOptionScore
      })
    }

    return NextResponse.json({
      response,
      result: bestResult,
      score: {
        total: totalScore,
        max: maxScore,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Submit test error:', error)
    return NextResponse.json(
      { error: 'Failed to submit test' },
      { status: 500 }
    )
  }
}
