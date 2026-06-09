import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// 根据答案匹配结果类型
function matchResultType(
  answers: { questionId: string; optionId: string; option: { score: number } }[],
  resultTypes: any[]
) {
  // 计算总分
  const totalScore = answers.reduce((sum, a) => sum + a.option.score, 0)
  
  // 构建答案映射
  const answerMap = new Map<string, string>()
  answers.forEach((a) => {
    answerMap.set(a.questionId, a.optionId)
  })
  
  // 遍历所有结果类型，找到匹配的
  for (const resultType of resultTypes) {
    for (const rule of resultType.rules) {
      const conditions = JSON.parse(rule.conditions)
      
      if (rule.matchType === 'score') {
        // 分数匹配模式
        if (rule.scoreThreshold && totalScore >= rule.scoreThreshold) {
          return { resultType, totalScore }
        }
      } else if (rule.matchType === 'all') {
        // 必须满足所有条件
        let allMatched = true
        for (const [questionId, allowedOptionIds] of Object.entries(conditions)) {
          const userOptionId = answerMap.get(questionId)
          if (!userOptionId || !(allowedOptionIds as string[]).includes(userOptionId)) {
            allMatched = false
            break
          }
        }
        if (allMatched) {
          return { resultType, totalScore }
        }
      } else if (rule.matchType === 'any') {
        // 满足任意一个条件即可
        for (const [questionId, allowedOptionIds] of Object.entries(conditions)) {
          const userOptionId = answerMap.get(questionId)
          if (userOptionId && (allowedOptionIds as string[]).includes(userOptionId)) {
            return { resultType, totalScore }
          }
        }
      }
    }
  }
  
  // 如果没有匹配的规则，返回第一个结果类型作为默认
  return { resultType: resultTypes[0] || null, totalScore }
}

// 生成分享token
function generateShareToken() {
  return crypto.randomBytes(16).toString('hex')
}

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

    // 如果配置了结果类型，计算并创建测试结果
    let testResult = null
    if (test.resultTypes.length > 0) {
      const { resultType, totalScore } = matchResultType(
        response.answers as any,
        test.resultTypes
      )
      
      if (resultType) {
        testResult = await prisma.testResult.create({
          data: {
            responseId: response.id,
            resultTypeId: resultType.id,
            totalScore,
            shareToken: generateShareToken(),
          },
          include: {
            resultType: true,
          },
        })
      }
    }

    return NextResponse.json({ response, testResult }, { status: 201 })
  } catch (error: any) {
    console.error('Submit test error:', error)
    console.error('Error details:', error?.message, error?.stack)
    return NextResponse.json(
      { error: 'Failed to submit test: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}
