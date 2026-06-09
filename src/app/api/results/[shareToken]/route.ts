import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 通过分享token获取测试结果
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params
    
    const testResult = await prisma.testResult.findUnique({
      where: { shareToken },
      include: {
        resultType: true,
        response: {
          include: {
            test: {
              select: {
                title: true,
                description: true,
              },
            },
          },
        },
      },
    })
    
    if (!testResult) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(testResult)
  } catch (error) {
    console.error('Get result by token error:', error)
    return NextResponse.json(
      { error: 'Failed to get result' },
      { status: 500 }
    )
  }
}
