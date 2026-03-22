'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  questions: Question[]
  resultTypes?: ResultType[]
}

interface TestFormProps {
  test: Test
}

export default function TestForm({ test }: TestFormProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{
    responseId: string
    totalScore: number
    maxScore: number
    resultType: ResultType | null
  } | null>(null)

  const handleOptionChange = (questionId: string, optionId: string) => {
    setAnswers({
      ...answers,
      [questionId]: optionId,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
        
        let totalScore = 0
        let maxScore = 0
        test.questions.forEach((q) => {
          const selectedOption = q.options.find((o) => o.id === answers[q.id])
          const maxOptionScore = Math.max(...q.options.map((o) => o.score))
          if (selectedOption) {
            totalScore += selectedOption.score
          }
          maxScore += maxOptionScore
        })
        
        setResult({
          responseId: data.id,
          totalScore,
          maxScore,
          resultType: data.resultType,
        })
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

  const handleShare = async () => {
    if (!result) return
    
    const shareUrl = `${window.location.origin}/results/${result.responseId}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${test.title} - 我的测试结果`,
          text: result.resultType?.title || '测试完成',
          url: shareUrl,
        })
      } catch {
        await navigator.clipboard.writeText(shareUrl)
        alert('链接已复制到剪贴板')
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      alert('链接已复制到剪贴板')
    }
  }

  if (submitted && result) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow-xl sm:rounded-lg overflow-hidden">
          {result.resultType && (
            <div
              className="h-2"
              style={{ backgroundColor: result.resultType.color }}
            />
          )}
          
          <div className="p-8 text-center">
            <div className="mb-6">
              <div
                className="mx-auto flex items-center justify-center h-20 w-20 rounded-full"
                style={{ 
                  backgroundColor: result.resultType 
                    ? `${result.resultType.color}20` 
                    : '#6366f120'
                }}
              >
                <svg
                  className="h-10 w-10"
                  style={{ color: result.resultType?.color || '#6366f1' }}
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
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              测试完成！
            </h2>

            {result.resultType ? (
              <div className="space-y-4">
                <div
                  className="inline-block px-4 py-2 rounded-full text-lg font-semibold"
                  style={{ 
                    backgroundColor: `${result.resultType.color}15`,
                    color: result.resultType.color
                  }}
                >
                  {result.resultType.title}
                </div>

                <p className="text-gray-600 text-lg">
                  {result.resultType.description}
                </p>

                {result.resultType.explanation && (
                  <div className="bg-gray-50 rounded-lg p-6 text-left mt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      结果解读
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {result.resultType.explanation}
                    </p>
                  </div>
                )}

                {result.resultType.suggestion && (
                  <div className="bg-indigo-50 rounded-lg p-6 text-left mt-4">
                    <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      建议
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {result.resultType.suggestion}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <p className="text-lg text-gray-700">
                  您的得分：
                  <span className="text-3xl font-bold text-indigo-600 mx-2">
                    {result.totalScore}
                  </span>
                  / {result.maxScore}
                </p>
              </div>
            )}

            <div className="flex justify-center space-x-4 mt-8">
              <button
                onClick={handleShare}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                分享结果
              </button>
              <Link
                href={`/results/${result.responseId}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                查看详情页
              </Link>
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                返回首页
              </button>
            </div>
          </div>
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
