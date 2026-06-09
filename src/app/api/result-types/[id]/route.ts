import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 更新结果类型
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, displayName, color, description, explanation, advice, rules } = body
    
    console.log('Updating result type with:', JSON.stringify(body, null, 2))
    
    // 验证必填字段
    if (!name || !displayName || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, displayName, description' },
        { status: 400 }
      )
    }
    
    // 先删除旧的规则，再创建新的
    await prisma.resultRule.deleteMany({
      where: { resultTypeId: id },
    })
    
    const resultType = await prisma.resultType.update({
      where: { id },
      data: {
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
    
    console.log('Updated result type:', resultType)
    return NextResponse.json(resultType)
  } catch (error: any) {
    console.error('Update result type error:', error)
    console.error('Error details:', error?.message, error?.stack)
    return NextResponse.json(
      { error: 'Failed to update result type: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}

// 删除结果类型
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.resultType.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete result type error:', error)
    return NextResponse.json(
      { error: 'Failed to delete result type' },
      { status: 500 }
    )
  }
}
