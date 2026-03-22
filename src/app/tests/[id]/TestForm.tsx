'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Option {
  id: string
  content: string
  score: number
}

interface Question {
  id: string
  content: string
  options: Option[]
}

interface TestResult {
  id: string
  name: string
  code: string
  description: string
  explanation: string
  advice: string
  imageUrl?: string
}

interface Test {
  id: string
  title: string
  questions: Question[]
}

interface TestFormProps {
  test: Test
}

export default function TestForm({ test }: TestFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [responseId, setResponseId] = useState<string | null>(null)
  const [result, setResult] = useState<TestResult | null>(null)
  const [score, setScore] = useState<{ total: number; max: number } | null>(null)

  const handleOptionChange = (questionId: string, optionId: string) => {
    setAnswers({
      ...answers,
      [questionId]: optionId,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证是否回答了所有问题
    const unansweredQuestions = test.questions.filter((q) => !answers[q.id])
    if (unansweredQuestions.length > 0) {
      alert(`还有 ${unansweredQuestions.length} 道题目未回答，请完成所有题目`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/tests/${test.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, optionId]) => ({
            questionId,
            optionId,
          })),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setResponseId(data.response.id)
        setResult(data.result)
        setScore(data.score)
        setSubmitted(true)
      } else {
        alert('提交失败，请重试')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleShare = () => {
    if (responseId) {
      const shareUrl = `${window.location.origin}/results/${responseId}`
      navigator.clipboard.writeText(shareUrl)
      alert('分享链接已复制到剪贴板！')
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        {/* 结果展示卡片 */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-white/10 backdrop-blur-sm p-8 text-white">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-white/20 mb-4">
                <svg
                  className="h-10 w-10 text-white"
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
              <p className="text-white/80">感谢您完成测试</p>
            </div>

            {score && (
              <div className="bg-white/20 rounded-xl p-6 mb-6 text-center">
                <p className="text-white/80 mb-2">您的得分</p>
                <p className="text-5xl font-bold">
                  {score.total}
                  <span className="text-2xl text-white/60"> / {score.max}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 测试结果详情 */}
        {result ? (
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
              <div className="text-center">
                <p className="text-indigo-100 text-sm uppercase tracking-wider mb-2">
                  您的测试结果
                </p>
                <h3 className="text-4xl font-bold text-white mb-2">{result.name}</h3>
                <p className="text-2xl text-indigo-200 font-mono">{result.code}</p>
              </div>
            </div>

            <div className="p-8 space-y-8">
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
          </div>
        ) : (
          <div className="bg-yellow-50 rounded-xl p-8 text-center border border-yellow-200">
            <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-semibold text-yellow-900 mb-2">未匹配到结果类型</h3>
            <p className="text-yellow-700">您的答案没有匹配到预设的结果类型，但您的回答已被记录。</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={handleShare}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            分享结果
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {test.questions.map((question, index) => (
        <div key={question.id} className="bg-white shadow sm:rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              <span className="text-indigo-600 mr-2">{index + 1}.</span>
              {question.content}
            </h3>
          </div>
          <div className="space-y-3">
            {question.options.map((option) => (
              <label
                key={option.id}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  answers[question.id] === option.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={answers[question.id] === option.id}
                  onChange={() => handleOptionChange(question.id, option.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-3 text-gray-700">{option.content}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-center pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {submitting ? '提交中...' : '提交答案'}
        </button>
      </div>
    </form>
  )
}
