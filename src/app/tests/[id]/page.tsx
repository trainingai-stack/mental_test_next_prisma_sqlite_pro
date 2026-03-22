import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TestForm from './TestForm'

interface TestPageProps {
  params: Promise<{ id: string }>
}

async function getTest(id: string) {
  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      questions: {
        include: {
          options: {
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  })
  return test
}

export default async function TestPage({ params }: TestPageProps) {
  const { id } = await params
  const test = await getTest(id)

  if (!test || test.status !== 'published') {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 测试单标题 */}
        <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
          {test.description && (
            <p className="mt-2 text-gray-600">{test.description}</p>
          )}
          <div className="mt-4 text-sm text-gray-500">
            共 {test.questions.length} 道题目
          </div>
        </div>

        {/* 测试表单 */}
        <TestForm test={test} />
      </div>
    </div>
  )
}
