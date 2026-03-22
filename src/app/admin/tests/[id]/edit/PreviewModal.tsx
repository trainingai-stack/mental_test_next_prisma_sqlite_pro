'use client'

import { useState } from 'react'

interface Question {
  id: string
  content: string
  options: {
    id: string
    content: string
  }[]
}

interface ResultType {
  id?: string
  name: string
  title: string
  description: string
  explanation: string
  suggestion: string
  color: string
  conditions: {
    questionId: string
    optionIds: string
  }[]
}

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  questions: Question[]
  resultTypes: ResultType[]
  testTitle: string
}

function matchResultType(
  answers: Record<string, string>,
  resultTypes: ResultType[]
): ResultType | null {
  for (const resultType of resultTypes) {
    if (resultType.conditions.length === 0) {
      continue
    }

    let allConditionsMet = true
    for (const condition of resultType.conditions) {
      const selectedOptionId = answers[condition.questionId]
      if (!selectedOptionId) {
        allConditionsMet = false
        break
      }

      const allowedOptionIds = condition.optionIds.split(',').filter(Boolean)
      if (!allowedOptionIds.includes(selectedOptionId)) {
        allConditionsMet = false
        break
      }
    }

    if (allConditionsMet) {
      return resultType
    }
  }

  const defaultResultType = resultTypes.find((rt) => rt.conditions.length === 0)
  if (defaultResultType) {
    return defaultResultType
  }

  if (resultTypes.length > 0) {
    return resultTypes[0]
  }

  return null
}

export default function PreviewModal({
  isOpen,
  onClose,
  questions,
  resultTypes,
  testTitle,
}: PreviewModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResult, setShowResult] = useState(false)

  const resetState = () => {
    setAnswers({})
    setShowResult(false)
  }

  if (!isOpen) return null

  const handleOptionChange = (questionId: string, optionId: string) => {
    setAnswers({
      ...answers,
      [questionId]: optionId,
    })
  }

  const handleSubmit = () => {
    const unansweredQuestions = questions.filter((q) => !answers[q.id])
    if (unansweredQuestions.length > 0) {
      alert(`还有 ${unansweredQuestions.length} 道题目未回答`)
      return
    }
    setShowResult(true)
  }

  const matchedResult = showResult ? matchResultType(answers, resultTypes) : null

  const handleClose = () => {
    resetState()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              预览测试 - {testTitle}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            {!showResult ? (
              <>
                <p className="text-sm text-gray-500 mb-6">
                  选择不同的答案组合，预览会得到什么结果
                </p>

                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-md font-medium text-gray-900 mb-3">
                        <span className="text-indigo-600 mr-2">{index + 1}.</span>
                        {question.content}
                      </h3>
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <label
                            key={option.id}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                              answers[question.id] === option.id
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`preview-question-${question.id}`}
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
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    关闭
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    查看结果
                  </button>
                </div>
              </>
            ) : (
              <>
                {matchedResult ? (
                  <div className="text-center">
                    <div
                      className="h-2 rounded-full mb-6"
                      style={{ backgroundColor: matchedResult.color }}
                    />

                    <div
                      className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                      style={{ backgroundColor: `${matchedResult.color}20` }}
                    >
                      <svg
                        className="w-10 h-10"
                        style={{ color: matchedResult.color }}
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
                      className="inline-block px-4 py-2 rounded-full text-lg font-semibold mb-4"
                      style={{
                        backgroundColor: `${matchedResult.color}15`,
                        color: matchedResult.color,
                      }}
                    >
                      {matchedResult.title}
                    </div>

                    <p className="text-gray-600 mb-6">{matchedResult.description}</p>

                    {matchedResult.explanation && (
                      <div className="bg-gray-50 rounded-lg p-4 text-left mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">结果解读</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{matchedResult.explanation}</p>
                      </div>
                    )}

                    {matchedResult.suggestion && (
                      <div className="bg-indigo-50 rounded-lg p-4 text-left">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">建议</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{matchedResult.suggestion}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">未配置结果类型</p>
                  </div>
                )}

                <div className="mt-6 flex justify-center space-x-3">
                  <button
                    onClick={() => setShowResult(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    重新选择
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    关闭预览
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
