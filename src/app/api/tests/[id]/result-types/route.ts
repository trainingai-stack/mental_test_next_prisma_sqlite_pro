import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取测试的所有结果类型
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const resultTypes = await prisma.resultType.findMany({
      where: { testId: id },
      include: {
        rules: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
    
    return NextResponse.json(resultTypes)
  } catch (error) {
    console.error('Get result types error:', error)
    return NextResponse.json(
      { error: 'Failed to get result types' },
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
    const { name, displayName, color, description, explanation, advice, rules } = body
    
    console.log('Creating result type with:', JSON.stringify(body, null, 2))
    
    // 验证必填字段
    if (!name || !displayName || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, displayName, description' },
        { status: 400 }
      )
    }
    
    const resultType = await prisma.resultType.create({
      data: {
        testId: id,
        name,
        displayName,
        color: color || '#6366f1',
        description,
        explanation: explanation || '',
        advice: advice || '',
        rules: rules && rules.length > 0 ? {
          create: rules.map((rule: any) => ({
            conditions: JSON.stringify(rule.conditions || {}),
            matchType: rule.matchType || 'all',
            scoreThreshold: rule.scoreThreshold || null,
          })),
        } : undefined,
      },
      include: {
        rules: true,
      },
    })
    
    console.log('Created result type:', resultType)
    return NextResponse.json(resultType, { status: 201 })
  } catch (error: any) {
    console.error('Create result type error:', error)
    console.error('Error details:', error?.message, error?.stack)
    return NextResponse.json(
      { error: 'Failed to create result type: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}
