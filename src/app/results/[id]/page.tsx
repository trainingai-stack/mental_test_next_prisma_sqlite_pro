import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

interface ResultPageProps {
  params: Promise<{ id: string }>
}

async function getResponse(id: string) {
  const response = await prisma.response.findUnique({
    where: { id },
    include: {
      test: {
        select: {
          id: true,
          title: true,
          description: true,
        },
      },
      answers: {
        include: {
          question: {
            select: {
              id: true,
              content: true,
            },
          },
          option: {
            select: {
              id: true,
              content: true,
              score: true,
            },
          },
        },
      },
      results: {
        include: {
          result: true,
        },
      },
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

  const result = response.results[0]?.result
  const score = response.answers.reduce((sum, a) => sum + a.option.score, 0)
  const maxScore = response.answers.length > 0 
    ? response.answers.length * 10 
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 头部导航 */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回首页
          </Link>
        </div>

        {/* 测试信息 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">{response.test.title}</h1>
            {response.test.description && (
              <p className="text-indigo-100 mt-2">{response.test.description}</p>
            )}
          </div>
        </div>

        {/* 结果展示 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* 结果头部 */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white text-center">
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-white/20 mb-6">
              <svg
                className="h-12 w-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-2">测试完成！</h2>
            <p className="text-white/80">以下是测试结果分享</p>
            
            {/* 得分 */}
            <div className="mt-6 bg-white/20 rounded-xl p-4 inline-block">
              <p className="text-white/80 text-sm mb-1">得分</p>
              <p className="text-4xl font-bold">
                {score}
                <span className="text-xl text-white/60"> / {maxScore}</span>
              </p>
            </div>
          </div>

          {/* 结果详情 */}
          <div className="p-8">
            {result ? (
              <div className="space-y-8">
                {/* 结果类型 */}
                <div className="text-center pb-8 border-b border-gray-100">
                  <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                    测试结果
                  </p>
                  <h3 className="text-4xl font-bold text-indigo-900 mb-2">{result.name}</h3>
                  <p className="text-2xl text-indigo-600 font-mono">{result.code}</p>
                </div>

                {/* 描述 */}
                <div className="bg-indigo-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    类型描述
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{result.description}</p>
                </div>

                {/* 详细解释 */}
                {result.explanation && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                      详细解读
                    </h4>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{result.explanation}</p>
                  </div>
                )}

                {/* 建议 */}
                {result.advice && (
                  <div className="bg-green-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      专属建议
                    </h4>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{result.advice}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-xl font-semibold text-yellow-900 mb-2">未匹配到结果类型</h3>
                <p className="text-yellow-700">该回答没有匹配到预设的结果类型。</p>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 mb-4">想知道自己是什么类型？快来测试吧！</p>
          <Link
            href={`/tests/${response.test.id}`}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            我也来测一测
          </Link>
        </div>
      </div>
    </div>
  )
}
