import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const resultTypes = await prisma.resultType.findMany({
      where: { testId: id },
      include: {
        conditions: true,
      },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(resultTypes)
  } catch (error) {
    console.error('Fetch result types error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch result types' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, title, description, explanation, suggestion, color, icon, conditions, order } = body

    const existingCount = await prisma.resultType.count({
      where: { testId: id },
    })

    const resultType = await prisma.resultType.create({
      data: {
        name: name || `结果类型${existingCount + 1}`,
        title: title || '新结果类型',
        description: description || '',
        explanation: explanation || '',
        suggestion: suggestion || '',
        color: color || '#6366f1',
        icon: icon || '',
        testId: id,
        order: order ?? existingCount,
        conditions: conditions
          ? {
              create: conditions.map((c: { questionId: string; optionIds: string }) => ({
                questionId: c.questionId,
                optionIds: c.optionIds,
              })),
            }
          : undefined,
      },
      include: {
        conditions: true,
      },
    })

    return NextResponse.json(resultType, { status: 201 })
  } catch (error) {
    console.error('Create result type error:', error)
    return NextResponse.json(
      { error: 'Failed to create result type' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { resultTypes } = body

    if (!Array.isArray(resultTypes)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      )
    }

    await prisma.resultCondition.deleteMany({
      where: {
        resultType: { testId: id },
      },
    })

    const existingResultTypes = await prisma.resultType.findMany({
      where: { testId: id },
      select: { id: true },
    })
    const existingIds = existingResultTypes.map((rt) => rt.id)
    const updatedIds = resultTypes.filter((rt) => rt.id).map((rt) => rt.id)

    const idsToDelete = existingIds.filter((id) => !updatedIds.includes(id))
    if (idsToDelete.length > 0) {
      await prisma.resultType.deleteMany({
        where: { id: { in: idsToDelete } },
      })
    }

    for (let i = 0; i < resultTypes.length; i++) {
      const rt = resultTypes[i]
      if (rt.id) {
        await prisma.resultType.update({
          where: { id: rt.id },
          data: {
            name: rt.name,
            title: rt.title,
            description: rt.description,
            explanation: rt.explanation,
            suggestion: rt.suggestion,
            color: rt.color,
            icon: rt.icon,
            order: i,
            conditions: {
              create: (rt.conditions || []).map((c: { questionId: string; optionIds: string }) => ({
                questionId: c.questionId,
                optionIds: c.optionIds,
              })),
            },
          },
        })
      } else {
        await prisma.resultType.create({
          data: {
            name: rt.name,
            title: rt.title,
            description: rt.description,
            explanation: rt.explanation,
            suggestion: rt.suggestion,
            color: rt.color,
            icon: rt.icon,
            testId: id,
            order: i,
            conditions: {
              create: (rt.conditions || []).map((c: { questionId: string; optionIds: string }) => ({
                questionId: c.questionId,
                optionIds: c.optionIds,
              })),
            },
          },
        })
      }
    }

    const updatedResultTypes = await prisma.resultType.findMany({
      where: { testId: id },
      include: { conditions: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(updatedResultTypes)
  } catch (error) {
    console.error('Update result types error:', error)
    return NextResponse.json(
      { error: 'Failed to update result types' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const resultTypeId = searchParams.get('resultTypeId')

    if (!resultTypeId) {
      return NextResponse.json(
        { error: 'Result type ID is required' },
        { status: 400 }
      )
    }

    await prisma.resultType.delete({
      where: { id: resultTypeId },
    })

    return NextResponse.json({ message: 'Result type deleted successfully' })
  } catch (error) {
    console.error('Delete result type error:', error)
    return NextResponse.json(
      { error: 'Failed to delete result type' },
      { status: 500 }
    )
  }
}
