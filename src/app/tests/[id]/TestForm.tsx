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

interface ResultType {
  id: string
  name: string
  displayName: string
  color: string
  description: string
  explanation: string
  advice: string
}

interface Test {
  id: string
  title: string
  questions: Question[]
}

interface TestFormProps {
  test: Test
}

interface TestResult {
  resultType: ResultType
  totalScore: number
  shareToken?: string
}

export default function TestForm({ test }: TestFormProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleOptionChange = (questionId: string, optionId: string) => {
    setAnswers({
      ...answers,
      [questionId]: optionId,
    })
  }

  const copyShareLink = async (shareToken: string) => {
    const shareUrl = `${window.location.origin}/results/${shareToken}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy share link error:', error)
      alert('复制链接失败，请手动复制')
    }
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
        
        if (data.testResult) {
          // 有配置结果类型，显示类型结果
          setResult({
            resultType: data.testResult.resultType,
            totalScore: data.testResult.totalScore,
            shareToken: data.testResult.shareToken,
          })
        } else {
          // 没有配置结果类型，只显示分数
          let totalScore = 0
          test.questions.forEach((q) => {
            const selectedOption = q.options.find((o) => o.id === answers[q.id])
            if (selectedOption) {
              totalScore += selectedOption.score
            }
          })
          setResult({
            resultType: {} as ResultType,
            totalScore,
          })
        }
        
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
    // 如果有结果类型，显示美观的结果页面
    if (result.resultType && result.resultType.name) {
      return (
        <div className="min-h-screen" style={{ backgroundColor: result.resultType.color + '15' }}>
          <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
              {/* 头部 */}
              <div 
                className="p-8 text-white text-center"
                style={{ backgroundColor: result.resultType.color }}
              >
                <div className="text-6xl font-bold mb-2">{result.resultType.name}</div>
                <div className="text-2xl opacity-90">{result.resultType.displayName}</div>
              </div>
              
              {/* 内容 */}
              <div className="p-8 space-y-8">
                {/* 描述 */}
                <section>
                  <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                    <span className="w-1 h-6 mr-3 rounded" style={{ backgroundColor: result.resultType.color }}></span>
                    类型描述
                  </h3>
                  <p className="text-gray-600 leading-relaxed pl-4">
                    {result.resultType.description}
                  </p>
                </section>
                
                {/* 解释 */}
                <section>
                  <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                    <span className="w-1 h-6 mr-3 rounded" style={{ backgroundColor: result.resultType.color }}></span>
                    详细解析
                  </h3>
                  <p className="text-gray-600 leading-relaxed pl-4">
                    {result.resultType.explanation}
                  </p>
                </section>
                
                {/* 建议 */}
                <section>
                  <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                    <span className="w-1 h-6 mr-3 rounded" style={{ backgroundColor: result.resultType.color }}></span>
                    发展建议
                  </h3>
                  <div className="pl-4">
                    <p className="text-gray-600 leading-relaxed">
                      {result.resultType.advice}
                    </p>
                  </div>
                </section>
                
                {/* 分享 */}
                {result.shareToken && (
                  <section className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">分享你的结果</h3>
                    <div className="flex gap-3">
                      <button
                        onClick={() => copyShareLink(result.shareToken!)}
                        className="flex-1 py-3 px-4 rounded-lg text-white font-medium transition-all hover:opacity-90"
                        style={{ backgroundColor: result.resultType.color }}
                      >
                        {copied ? '✓ 已复制' : '复制分享链接'}
                      </button>
                      <button
                        onClick={() => router.push(`/results/${result.shareToken}`)}
                        className="py-3 px-4 rounded-lg border-2 font-medium transition-all hover:bg-gray-50"
                        style={{ borderColor: result.resultType.color, color: result.resultType.color }}
                      >
                        查看结果页
                      </button>
                    </div>
                  </section>
                )}
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center text-gray-600 hover:text-gray-800"
              >
                ← 返回首页
              </button>
            </div>
          </div>
        </div>
      )
    }
    
    // 没有结果类型时显示简单的分数页面
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
