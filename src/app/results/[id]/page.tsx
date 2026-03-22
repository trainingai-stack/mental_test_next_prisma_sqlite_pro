import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ResultPageClient from './ResultPageClient'

interface ResultPageProps {
  params: Promise<{ id: string }>
}

async function getResponse(id: string) {
  const response = await prisma.response.findUnique({
    where: { id },
    include: {
      test: true,
      resultType: true,
    },
  })
  return response
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params
  const response = await getResponse(id)

  if (!response) {
    notFound()
  }

  return <ResultPageClient response={JSON.parse(JSON.stringify(response))} />
}

export async function generateMetadata({ params }: ResultPageProps) {
  const { id } = await params
  const response = await getResponse(id)

  if (!response) {
    return {
      title: '结果未找到',
    }
  }

  return {
    title: `${response.test.title} - ${response.resultType?.title || '测试结果'}`,
    description: response.resultType?.description || response.test.description,
  }
}
