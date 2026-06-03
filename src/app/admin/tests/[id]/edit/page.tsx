'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PreviewModal from './PreviewModal'

interface Option {
  id?: string
  content: string
  score: number
}

interface Question {
  id?: string
  content: string
  options: Option[]
}

interface ResultCondition {
  id?: string
  questionId: string
  optionIds: string
}

interface ResultType {
  id?: string
  name: string
  title: string
  description: string
  explanation: string
  suggestion: string
  color: string
  icon: string
  conditions: ResultCondition[]
}

interface Test {
  id: string
  title: string
  description: string | null
  status: string
  questions: {
    id: string
    content: string
    order: number
    options: {
      id: string
      content: string
      score: number
      order: number
    }[]
  }[]
  resultTypes?: {
    id: string
    name: string
    title: string
    description: string
    explanation: string | null
    suggestion: string | null
    color: string
    icon: string | null
    conditions: {
      id: string
      questionId: string
      optionIds: string
    }[]
    order: number
  }[]
}

interface SavedTest {
  questions: {
    id: string
    content: string
    options: {
      id: string
      content: string
    }[]
  }[]
}

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
]

export default function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [testId, setTestId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('draft')
  const [questions, setQuestions] = useState<Question[]>([
    { content: '', options: [{ content: '', score: 0 }, { content: '', score: 0 }] },
  ])
  const [savedQuestions, setSavedQuestions] = useState<{ id: string; content: string; options: { id: string; content: string }[] }[]>([])
  const [resultTypes, setResultTypes] = useState<ResultType[]>([])
  const [activeTab, setActiveTab] = useState<'questions' | 'results'>('questions')
  const [showPreview, setShowPreview] = useState(false)

  const fetchTest = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/tests/${id}`)
      if (res.ok) {
        const test: Test = await res.json()
        setTitle(test.title)
        setDescription(test.description || '')
        setStatus(test.status)
        setQuestions(
          test.questions.map((q) => ({
            id: q.id,
            content: q.content,
            options: q.options.map((o) => ({
              id: o.id,
              content: o.content,
              score: o.score,
            })),
          }))
        )
        setSavedQuestions(
          test.questions.map((q) => ({
            id: q.id,
            content: q.content,
            options: q.options.map((o) => ({
              id: o.id,
              content: o.content,
            })),
          }))
        )
        setResultTypes(
          (test.resultTypes || []).map((rt) => ({
            id: rt.id,
            name: rt.name,
            title: rt.title,
            description: rt.description,
            explanation: rt.explanation || '',
            suggestion: rt.suggestion || '',
            color: rt.color,
            icon: rt.icon || '',
            conditions: rt.conditions.map((c) => ({
              id: c.id,
              questionId: c.questionId,
              optionIds: c.optionIds,
            })),
          }))
        )
      } else {
        alert('获取测试单失败')
        router.push('/')
      }
    } catch (error) {
      console.error('Fetch test error:', error)
      alert('获取测试单失败')
      router.push('/')
    } finally {
      setFetching(false)
    }
  }, [router])

  useEffect(() => {
    params.then(({ id }) => {
      setTestId(id)
      fetchTest(id)
    })
  }, [params, fetchTest])

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { content: '', options: [{ content: '', score: 0 }, { content: '', score: 0 }] },
    ])
  }

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert('至少需要保留一道题目')
      return
    }
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, content: string) => {
    const newQuestions = [...questions]
    newQuestions[index].content = content
    setQuestions(newQuestions)
  }

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options.push({ content: '', score: 0 })
    setQuestions(newQuestions)
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions]
    if (newQuestions[questionIndex].options.length <= 2) {
      alert('每道题至少需要两个选项')
      return
    }
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter(
      (_, i) => i !== optionIndex
    )
    setQuestions(newQuestions)
  }

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    field: keyof Option,
    value: string | number
  ) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options[optionIndex][field] = value as never
    setQuestions(newQuestions)
  }

  const addResultType = () => {
    setResultTypes([
      ...resultTypes,
      {
        name: `结果类型${resultTypes.length + 1}`,
        title: '新结果类型',
        description: '',
        explanation: '',
        suggestion: '',
        color: PRESET_COLORS[resultTypes.length % PRESET_COLORS.length],
        icon: '',
        conditions: [],
      },
    ])
  }

  const removeResultType = (index: number) => {
    setResultTypes(resultTypes.filter((_, i) => i !== index))
  }

  const updateResultType = (index: number, field: keyof ResultType, value: string) => {
    const newResultTypes = [...resultTypes]
    newResultTypes[index] = { ...newResultTypes[index], [field]: value }
    setResultTypes(newResultTypes)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!testId) return

    if (!title.trim()) {
      alert('请输入测试单标题')
      return
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].content.trim()) {
        alert(`第 ${i + 1} 题的题干不能为空`)
        return
      }
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j].content.trim()) {
          alert(`第 ${i + 1} 题的第 ${j + 1} 个选项不能为空`)
          return
        }
      }
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          status,
          questions,
        }),
      })

      if (res.ok) {
        const savedTest: SavedTest = await res.json()
        setSavedQuestions(
          savedTest.questions.map((q) => ({
            id: q.id,
            content: q.content,
            options: q.options.map((o) => ({
              id: o.id,
              content: o.content,
            })),
          }))
        )

        const resultTypesRes = await fetch(`/api/tests/${testId}/result-types`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resultTypes }),
        })

        if (resultTypesRes.ok) {
          router.push('/')
        } else {
          alert('结果类型保存失败，请重试')
        }
      } else {
        alert('更新失败，请重试')
      }
    } catch (error) {
      console.error('Update test error:', error)
      alert('更新失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-900">
            ← 返回列表
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">编辑测试单</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">基本信息</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  测试单标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="请输入测试单标题"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  测试单描述
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="请输入测试单描述（可选）"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  状态
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                  <option value="archived">已归档</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                type="button"
                onClick={() => setActiveTab('questions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'questions'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                题目设置
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('results')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'results'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                结果类型设置
              </button>
            </nav>
          </div>

          {activeTab === 'questions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">题目设置</h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  + 添加题目
                </button>
              </div>

              {questions.map((question, qIndex) => (
                <div key={qIndex} className="bg-white shadow sm:rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-md font-medium text-gray-900">第 {qIndex + 1} 题</h3>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      删除题目
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        题干 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={question.content}
                        onChange={(e) => updateQuestion(qIndex, e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="请输入题干"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          选项 <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => addOption(qIndex)}
                          className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          + 添加选项
                        </button>
                      </div>
                      <div className="space-y-2">
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 w-8">
                              {String.fromCharCode(65 + oIndex)}.
                            </span>
                            <input
                              type="text"
                              value={option.content}
                              onChange={(e) => updateOption(qIndex, oIndex, 'content', e.target.value)}
                              className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder={`选项 ${String.fromCharCode(65 + oIndex)}`}
                            />
                            <input
                              type="number"
                              value={option.score}
                              onChange={(e) =>
                                updateOption(qIndex, oIndex, 'score', parseInt(e.target.value) || 0)
                              }
                              className="w-20 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="分值"
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="text-red-600 hover:text-red-900"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">结果类型设置</h2>
                <button
                  type="button"
                  onClick={addResultType}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  + 添加结果类型
                </button>
              </div>

              {savedQuestions.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-yellow-700">请先保存题目设置，然后再配置结果类型</p>
                </div>
              )}

              {resultTypes.map((resultType, rtIndex) => (
                <div key={rtIndex} className="bg-white shadow sm:rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: resultType.color }}
                      />
                      <h3 className="text-md font-medium text-gray-900">{resultType.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeResultType(rtIndex)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      删除
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">名称</label>
                        <input
                          type="text"
                          value={resultType.name}
                          onChange={(e) => updateResultType(rtIndex, 'name', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="内部名称"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">标题</label>
                        <input
                          type="text"
                          value={resultType.title}
                          onChange={(e) => updateResultType(rtIndex, 'title', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="显示标题"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">简短描述</label>
                      <input
                        type="text"
                        value={resultType.description}
                        onChange={(e) => updateResultType(rtIndex, 'description', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="简短描述"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">详细解释</label>
                      <textarea
                        value={resultType.explanation}
                        onChange={(e) => updateResultType(rtIndex, 'explanation', e.target.value)}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="详细解释这个结果的含义"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">建议</label>
                      <textarea
                        value={resultType.suggestion}
                        onChange={(e) => updateResultType(rtIndex, 'suggestion', e.target.value)}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="给用户的建议"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">主题颜色</label>
                      <div className="flex space-x-2">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => updateResultType(rtIndex, 'color', color)}
                            className={`w-8 h-8 rounded-full border-2 ${
                              resultType.color === color ? 'border-gray-900' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        匹配条件（选择哪些选项组合会得到此结果）
                      </label>

                      {resultType.conditions.length === 0 && (
                        <p className="text-sm text-gray-500 italic mb-4">
                          未设置条件。此结果将作为默认结果。
                        </p>
                      )}

                      {savedQuestions.length === 0 && (
                        <p className="text-sm text-gray-500 italic">
                          请先保存题目设置后再配置条件
                        </p>
                      )}

                      {savedQuestions.length > 0 && (
                        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                          {savedQuestions.map((question, qIdx) => {
                            const existingCondition = resultType.conditions.find(
                              (c) => c.questionId === question.id
                            )
                            const selectedOptionIds = existingCondition
                              ? existingCondition.optionIds.split(',').filter(Boolean)
                              : []

                            const handleOptionToggle = (optionId: string) => {
                              const newSelected = selectedOptionIds.includes(optionId)
                                ? selectedOptionIds.filter((id) => id !== optionId)
                                : [...selectedOptionIds, optionId]

                              if (newSelected.length === 0) {
                                const newConditions = resultType.conditions.filter(
                                  (c) => c.questionId !== question.id
                                )
                                const newResultTypes = [...resultTypes]
                                newResultTypes[rtIndex].conditions = newConditions
                                setResultTypes(newResultTypes)
                              } else {
                                const newCondition = {
                                  questionId: question.id,
                                  optionIds: newSelected.join(','),
                                }
                                const existingIndex = resultType.conditions.findIndex(
                                  (c) => c.questionId === question.id
                                )
                                const newConditions = [...resultType.conditions]
                                if (existingIndex >= 0) {
                                  newConditions[existingIndex] = newCondition
                                } else {
                                  newConditions.push(newCondition)
                                }
                                const newResultTypes = [...resultTypes]
                                newResultTypes[rtIndex].conditions = newConditions
                                setResultTypes(newResultTypes)
                              }
                            }

                            return (
                              <div key={question.id} className="p-4">
                                <div className="flex items-start">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium mr-3 mt-0.5">
                                    {qIdx + 1}
                                  </span>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 mb-2">
                                      {question.content}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {question.options.map((option, oIdx) => {
                                        const isSelected = selectedOptionIds.includes(option.id)
                                        return (
                                          <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => handleOptionToggle(option.id)}
                                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm transition-colors ${
                                              isSelected
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                          >
                                            <span className="mr-1.5 font-medium">
                                              {String.fromCharCode(65 + oIdx)}
                                            </span>
                                            {option.content}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-2">
                        提示：选择多个选项表示「或」关系，即选择其中任一选项即可匹配
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {resultTypes.length === 0 && (
                <div className="bg-white shadow sm:rounded-lg p-8 text-center">
                  <p className="text-gray-500">暂无结果类型，点击上方按钮添加</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              取消
            </Link>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              disabled={savedQuestions.length === 0}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              预览
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>

        <PreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          questions={savedQuestions}
          resultTypes={resultTypes}
          testTitle={title}
        />
      </div>
    </div>
  )
}
