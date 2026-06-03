'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ResultType {
  id: string
  name: string
  title: string
  description: string
  explanation: string | null
  suggestion: string | null
  color: string
  icon: string | null
}

interface Test {
  id: string
  title: string
  description: string | null
}

interface Response {
  id: string
  createdAt: string
  test: Test
  resultType: ResultType | null
}

interface ResultPageClientProps {
  response: Response
}

export default function ResultPageClient({ response }: ResultPageClientProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareUrl = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${response.test.title} - 我的测试结果`,
          text: response.resultType?.title || '测试完成',
          url: shareUrl,
        })
      } catch {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="text-indigo-600 hover:text-indigo-900">
            ← 返回首页
          </Link>
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {response.resultType && (
            <div
              className="h-3"
              style={{ backgroundColor: response.resultType.color }}
            />
          )}

          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {response.test.title}
              </h1>
              <p className="text-sm text-gray-500">
                完成时间：{new Date(response.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>

            {response.resultType ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4"
                    style={{ 
                      backgroundColor: `${response.resultType.color}20`
                    }}
                  >
                    <svg
                      className="w-12 h-12"
                      style={{ color: response.resultType.color }}
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

                  <div
                    className="inline-block px-6 py-3 rounded-full text-xl font-bold mb-4"
                    style={{ 
                      backgroundColor: `${response.resultType.color}15`,
                      color: response.resultType.color
                    }}
                  >
                    {response.resultType.title}
                  </div>

                  <p className="text-lg text-gray-600 max-w-md mx-auto">
                    {response.resultType.description}
                  </p>
                </div>

                {response.resultType.explanation && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      结果解读
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {response.resultType.explanation}
                    </p>
                  </div>
                )}

                {response.resultType.suggestion && (
                  <div className="bg-indigo-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      建议
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {response.resultType.suggestion}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500">测试已完成</p>
              </div>
            )}

            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={handleShare}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {copied ? '已复制链接' : '分享结果'}
              </button>
              <Link
                href={`/tests/${response.test.id}`}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                再测一次
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>心理测试结果仅供参考，不构成专业诊断</p>
        </div>
      </div>
    </div>
  )
}
