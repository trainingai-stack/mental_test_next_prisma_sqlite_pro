'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
}

interface ResultRule {
  id?: string
  conditions: Record<string, string[]> // questionId -> optionIds[]
  priority: number
}

interface TestResult {
  id?: string
  name: string
  code: string
  description: string
  explanation: string
  advice: string
  imageUrl?: string
  order: number
  rules: ResultRule[]
}

type TabType = 'basic' | 'questions' | 'results' | 'preview'

export default function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [testId, setTestId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('basic')

  // 基本信息
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('draft')

  // 题目
  const [questions, setQuestions] = useState<Question[]>([
    { content: '', options: [{ content: '', score: 0 }, { content: '', score: 0 }] },
  ])

  // 结果类型
  const [results, setResults] = useState<TestResult[]>([])

  // 预览
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, string>>({})
  const [previewResult, setPreviewResult] = useState<TestResult | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    params.then(({ id }) => {
      setTestId(id)
      fetchTest(id)
      fetchResults(id)
    })
  }, [params])

  const fetchTest = async (id: string) => {
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
  }

  const fetchResults = async (id: string) => {
    try {
      const res = await fetch(`/api/tests/${id}/results`)
      if (res.ok) {
        const data = await res.json()
        // API 返回的 conditions 是 JSON 字符串，需要解析
        setResults(data.map((r: { rules: { conditions: string; priority: number; id?: string }[] } & Omit<TestResult, 'rules'>) => ({
          ...r,
          rules: r.rules.map(rule => ({
            id: rule.id,
            priority: rule.priority,
            conditions: JSON.parse(rule.conditions)
          }))
        })))
      }
    } catch (error) {
      console.error('Fetch results error:', error)
    }
  }

  // 题目相关操作
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

  // 结果类型相关操作
  const addResult = () => {
    setResults([
      ...results,
      {
        name: '',
        code: '',
        description: '',
        explanation: '',
        advice: '',
        order: results.length,
        rules: [],
      },
    ])
  }

  const removeResult = (index: number) => {
    setResults(results.filter((_, i) => i !== index))
  }

  const updateResult = (index: number, field: keyof TestResult, value: string | number) => {
    const newResults = [...results]
    newResults[index][field] = value as never
    setResults(newResults)
  }

  const addRule = (resultIndex: number) => {
    const newResults = [...results]
    newResults[resultIndex].rules.push({
      conditions: {},
      priority: 0,
    })
    setResults(newResults)
  }

  const removeRule = (resultIndex: number, ruleIndex: number) => {
    const newResults = [...results]
    newResults[resultIndex].rules = newResults[resultIndex].rules.filter((_, i) => i !== ruleIndex)
    setResults(newResults)
  }

  const updateRuleCondition = (
    resultIndex: number,
    ruleIndex: number,
    questionId: string,
    optionIds: string[]
  ) => {
    const newResults = [...results]
    newResults[resultIndex].rules[ruleIndex].conditions[questionId] = optionIds
    setResults(newResults)
  }

  const removeRuleCondition = (resultIndex: number, ruleIndex: number, questionId: string) => {
    const newResults = [...results]
    delete newResults[resultIndex].rules[ruleIndex].conditions[questionId]
    setResults(newResults)
  }

  const updateRulePriority = (resultIndex: number, ruleIndex: number, priority: number) => {
    const newResults = [...results]
    newResults[resultIndex].rules[ruleIndex].priority = priority
    setResults(newResults)
  }

  // 预览相关
  const handlePreviewAnswer = (questionId: string, optionId: string) => {
    setPreviewAnswers({
      ...previewAnswers,
      [questionId]: optionId,
    })
  }

  const runPreview = async () => {
    if (!testId) return
    setPreviewLoading(true)
    try {
      const res = await fetch(`/api/tests/${testId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: previewAnswers }),
      })
      if (res.ok) {
        const data = await res.json()
        setPreviewResult(data.result)
      }
    } catch (error) {
      console.error('Preview error:', error)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!testId) return

    // 验证表单
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
      // 先保存测试单基本信息和题目
      const testRes = await fetch(`/api/tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          status,
          questions,
        }),
      })

      if (!testRes.ok) {
        alert('保存测试单失败')
        setLoading(false)
        return
      }

      // 获取保存后的测试数据（包含新的题目ID）
      const savedTest = await testRes.json()
      
      // 构建旧ID到新ID的映射
      const questionIdMap: Record<string, string> = {}
      const optionIdMap: Record<string, string> = {}
      
      interface SavedQuestion {
        id: string
        content: string
        options: { id: string; content: string; score: number }[]
      }
      
      savedTest.questions.forEach((q: SavedQuestion, qIdx: number) => {
        const oldQuestionId = questions[qIdx]?.id
        if (oldQuestionId) {
          questionIdMap[oldQuestionId] = q.id
        }
        // 也映射临时ID（使用新的格式）
        questionIdMap[`temp-q-${qIdx}`] = q.id
        
        // 映射选项ID
        q.options.forEach((opt, oIdx: number) => {
          const oldOptionId = questions[qIdx]?.options[oIdx]?.id
          if (oldOptionId) {
            optionIdMap[oldOptionId] = opt.id
          }
          optionIdMap[`temp-o-${qIdx}-${oIdx}`] = opt.id
        })
      })

      // 转换结果规则中的ID
      // 确保新ID也在映射中
      savedTest.questions.forEach((q: SavedQuestion) => {
        q.options.forEach((opt) => {
          optionIdMap[opt.id] = opt.id // 确保新ID也在映射中
        })
      })
      
      const convertedResults = results.map(r => ({
        ...r,
        rules: r.rules.map(rule => {
          const newConditions: Record<string, string[]> = {}
          Object.entries(rule.conditions).forEach(([qId, optIds]) => {
            // 映射题目ID
            const newQId = questionIdMap[qId]
            if (!newQId) {
              // 如果找不到映射，跳过这个条件（旧ID）
              console.log('Skipping old question ID:', qId)
              return
            }
            // 映射选项ID，只保留有效的
            const newOptIds = optIds
              .map(oId => optionIdMap[oId])
              .filter((id): id is string => !!id && id !== 'undefined' && id !== '')
            
            if (newOptIds.length > 0) {
              newConditions[newQId] = newOptIds
            }
          })
          return {
            ...rule,
            conditions: newConditions,
          }
        }).filter(rule => Object.keys(rule.conditions).length > 0), // 过滤掉没有条件的规则
      }))

      // 保存结果类型
      const resultsRes = await fetch(`/api/tests/${testId}/results`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results: convertedResults,
        }),
      })

      if (resultsRes.ok) {
        // 更新本地状态，使用新的ID
        setQuestions(savedTest.questions.map((q: SavedQuestion) => ({
          id: q.id,
          content: q.content,
          options: q.options.map((o) => ({
            id: o.id,
            content: o.content,
            score: o.score,
          })),
        })))
        router.push('/')
      } else {
        alert('保存结果类型失败')
      }
    } catch (error) {
      console.error('Update test error:', error)
      alert('保存失败，请重试')
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

        {/* Tab 导航 */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'basic', label: '基本信息' },
              { key: 'questions', label: '题目设置' },
              { key: 'results', label: '结果类型' },
              { key: 'preview', label: '结果预览' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 基本信息 Tab */}
          {activeTab === 'basic' && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">基本信息</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700"
                  >
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
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
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
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700"
                  >
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
          )}

          {/* 题目设置 Tab */}
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
                <div
                  key={qIndex}
                  className="bg-white shadow sm:rounded-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-md font-medium text-gray-900">
                      第 {qIndex + 1} 题
                      {question.id && <span className="text-xs text-gray-400 ml-2">ID: {question.id}</span>}
                    </h3>
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
                              onChange={(e) =>
                                updateOption(qIndex, oIndex, 'content', e.target.value)
                              }
                              className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder={`选项 ${String.fromCharCode(65 + oIndex)}`}
                            />
                            <input
                              type="number"
                              value={option.score}
                              onChange={(e) =>
                                updateOption(
                                  qIndex,
                                  oIndex,
                                  'score',
                                  parseInt(e.target.value) || 0
                                )
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

          {/* 结果类型 Tab */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">结果类型配置</h2>
                <button
                  type="button"
                  onClick={addResult}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  + 添加结果类型
                </button>
              </div>

              {results.length === 0 && (
                <div className="text-center py-12 bg-white shadow sm:rounded-lg">
                  <p className="text-gray-500">还没有配置结果类型，点击上方按钮添加</p>
                </div>
              )}

              {results.map((result, rIndex) => (
                <div key={rIndex} className="bg-white shadow sm:rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-md font-medium text-gray-900">
                      结果类型 {rIndex + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeResult(rIndex)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      删除
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          结果名称 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={result.name}
                          onChange={(e) => updateResult(rIndex, 'name', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="如：INTJ-建筑师"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          结果代码 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={result.code}
                          onChange={(e) => updateResult(rIndex, 'code', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="如：INTJ"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        结果描述 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={result.description}
                        onChange={(e) => updateResult(rIndex, 'description', e.target.value)}
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="简要描述这个结果类型的特点"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        详细解释
                      </label>
                      <textarea
                        value={result.explanation}
                        onChange={(e) => updateResult(rIndex, 'explanation', e.target.value)}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="详细解释这个结果类型的含义"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        建议
                      </label>
                      <textarea
                        value={result.advice}
                        onChange={(e) => updateResult(rIndex, 'advice', e.target.value)}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="给用户的建议"
                      />
                    </div>

                    {/* 匹配规则 */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                          匹配规则
                        </label>
                        <button
                          type="button"
                          onClick={() => addRule(rIndex)}
                          className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          + 添加规则
                        </button>
                      </div>

                      {result.rules.length === 0 && (
                        <p className="text-sm text-gray-500 mb-4">
                          还没有配置规则，点击上方按钮添加。规则用于判断用户选择哪些选项时匹配到此结果。
                        </p>
                      )}

                      {result.rules.map((rule, ruleIndex) => (
                        <div key={ruleIndex} className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium text-gray-700">
                              规则 {ruleIndex + 1}
                            </span>
                            <div className="flex items-center space-x-2">
                              <label className="text-sm text-gray-600">优先级:</label>
                              <input
                                type="number"
                                value={rule.priority}
                                onChange={(e) => updateRulePriority(rIndex, ruleIndex, parseInt(e.target.value) || 0)}
                                className="w-16 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => removeRule(rIndex, ruleIndex)}
                                className="text-red-600 hover:text-red-900 text-sm"
                              >
                                删除规则
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs text-gray-500 mb-2">
                              选择题目和对应的选项（满足所有选中的条件即可匹配）
                            </p>
                            {questions.map((q, qIdx) => {
                              // 使用稳定的临时ID格式
                              const questionId = q.id || `temp-q-${qIdx}`
                              const selectedOptions = rule.conditions[questionId] || []
                              
                              return (
                                <div key={questionId} className="border rounded-md p-3 bg-white">
                                  <div className="flex items-start space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedOptions.length > 0}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          // 使用第一个选项的ID或临时ID
                                          const firstOptId = q.options[0]?.id || `temp-o-${qIdx}-0`
                                          updateRuleCondition(rIndex, ruleIndex, questionId, [firstOptId])
                                        } else {
                                          removeRuleCondition(rIndex, ruleIndex, questionId)
                                        }
                                      }}
                                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 mb-2">
                                        第 {qIdx + 1} 题: {q.content || '(未填写)'}
                                      </p>
                                      {selectedOptions.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                          {q.options.map((opt, oIdx) => {
                                            const optId = opt.id || `temp-o-${qIdx}-${oIdx}`
                                            return (
                                              <label key={oIdx} className="inline-flex items-center">
                                                <input
                                                  type="checkbox"
                                                  checked={selectedOptions.includes(optId)}
                                                  onChange={(e) => {
                                                    const newSelection = e.target.checked
                                                      ? [...selectedOptions, optId]
                                                      : selectedOptions.filter(id => id !== optId)
                                                    updateRuleCondition(rIndex, ruleIndex, questionId, newSelection)
                                                  }}
                                                  className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                />
                                                <span className="ml-1 text-xs text-gray-600">
                                                  {String.fromCharCode(65 + oIdx)}. {opt.content || '(未填写)'}
                                                </span>
                                              </label>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 结果预览 Tab */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              <div className="bg-white shadow sm:rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">结果预览</h2>
                <p className="text-sm text-gray-600 mb-6">
                  选择答案来预览不同选择会得到什么结果
                </p>

                <div className="space-y-4">
                  {questions.map((question, qIdx) => {
                    const questionId = question.id || `temp-q-${qIdx}`
                    return (
                      <div key={questionId} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">
                          第 {qIdx + 1} 题: {question.content || '(未填写)'}
                        </h4>
                        <div className="space-y-2">
                          {question.options.map((option, oIdx) => {
                            const optionId = option.id || `temp-o-${qIdx}-${oIdx}`
                            return (
                              <label key={oIdx} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`preview-${questionId}`}
                                  value={optionId}
                                  checked={previewAnswers[questionId] === optionId}
                                  onChange={() => handlePreviewAnswer(questionId, optionId)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <span className="text-gray-700">
                                  {String.fromCharCode(65 + oIdx)}. {option.content || '(未填写)'}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={runPreview}
                    disabled={previewLoading || Object.keys(previewAnswers).length === 0}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {previewLoading ? '预览中...' : '预览结果'}
                  </button>
                </div>

                {previewResult && (
                  <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100">
                    <div className="text-center mb-4">
                      <h3 className="text-2xl font-bold text-indigo-900">{previewResult.name}</h3>
                      <p className="text-lg text-indigo-600 mt-1">{previewResult.code}</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">描述</h4>
                        <p className="text-gray-700">{previewResult.description}</p>
                      </div>
                      {previewResult.explanation && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">详细解释</h4>
                          <p className="text-gray-700">{previewResult.explanation}</p>
                        </div>
                      )}
                      {previewResult.advice && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">建议</h4>
                          <p className="text-gray-700">{previewResult.advice}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {previewResult === null && !previewLoading && Object.keys(previewAnswers).length > 0 && (
                  <div className="mt-6 bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                    <p className="text-yellow-800 text-center">
                      当前选择没有匹配到任何结果类型，请检查您的选择或结果类型的匹配规则
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
