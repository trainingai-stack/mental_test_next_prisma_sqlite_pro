import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function matchResultType(
  answers: { questionId: string; optionId: string }[],
  resultTypes: {
    id: string
    conditions: { questionId: string; optionIds: string }[]
  }[]
): string | null {
  const answerMap = new Map<string, string>()
  answers.forEach((a) => {
    answerMap.set(a.questionId, a.optionId)
  })

  for (const resultType of resultTypes) {
    if (resultType.conditions.length === 0) {
      continue
    }

    let allConditionsMet = true
    for (const condition of resultType.conditions) {
      const selectedOptionId = answerMap.get(condition.questionId)
      if (!selectedOptionId) {
        allConditionsMet = false
        break
      }

      const allowedOptionIds = condition.optionIds.split(',').filter(Boolean)
      if (!allowedOptionIds.includes(selectedOptionId)) {
        allConditionsMet = false
        break
      }
    }

    if (allConditionsMet) {
      return resultType.id
    }
  }

  const defaultResultType = resultTypes.find((rt) => rt.conditions.length === 0)
  if (defaultResultType) {
    return defaultResultType.id
  }

  if (resultTypes.length > 0) {
    return resultTypes[0].id
  }

  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { answers } = body

    const test = await prisma.test.findUnique({
      where: { id },
      include: {
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

    if (test.status !== 'published') {
      return NextResponse.json(
        { error: 'Test is not available' },
        { status: 400 }
      )
    }

    const matchedResultTypeId = matchResultType(answers, test.resultTypes)

    const response = await prisma.response.create({
      data: {
        testId: id,
        resultTypeId: matchedResultTypeId,
        answers: {
          create: answers.map((answer: { questionId: string; optionId: string }) => ({
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
        resultType: true,
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
