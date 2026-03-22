'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

interface Test {
  id: string
  title: string
  questions: Question[]
}

interface TestFormProps {
  test: Test
}

export default function TestForm({ test }: TestFormProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ totalScore: number; maxScore: number } | null>(null)

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
        
        // 计算得分
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
        
        setResult({ totalScore, maxScore })
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

  if (submitted && result) {
    return (
      <div className="bg-white shadow sm:rounded-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">测试完成！</h2>
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <p className="text-lg text-gray-700">
            您的得分：
            <span className="text-3xl font-bold text-indigo-600 mx-2">
              {result.totalScore}
            </span>
            / {result.maxScore}
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          返回首页
        </button>
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
