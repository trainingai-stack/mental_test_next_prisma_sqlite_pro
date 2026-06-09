'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Option {
  content: string
  score: number
}

interface Question {
  content: string
  options: Option[]
}

interface TestQuestion {
  id: string
  content: string
  order: number
  options: {
    id: string
    content: string
    score: number
    order: number
  }[]
}

interface ResultRule {
  conditions: Record<string, string[]>
  matchType: 'all' | 'any' | 'score'
  scoreThreshold?: number
}

interface ResultType {
  id?: string
  name: string
  displayName: string
  color: string
  description: string
  explanation: string
  advice: string
  rules: ResultRule[]
}

interface Test {
  id: string
  title: string
  description: string | null
  status: string
  questions: TestQuestion[]
}

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
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([])
  const [resultTypes, setResultTypes] = useState<ResultType[]>([])
  const [activeTab, setActiveTab] = useState<'questions' | 'results'>('questions')

  useEffect(() => {
    params.then(({ id }) => {
      setTestId(id)
      fetchTest(id)
      fetchResultTypes(id)
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
            content: q.content,
            options: q.options.map((o) => ({
              content: o.content,
              score: o.score,
            })),
          }))
        )
        setTestQuestions(test.questions)
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

  const fetchResultTypes = async (id: string) => {
    try {
      const res = await fetch(`/api/tests/${id}/result-types`)
      if (res.ok) {
        const data = await res.json()
        setResultTypes(
          data.map((rt: any) => ({
            ...rt,
            rules: rt.rules.map((rule: any) => ({
              ...rule,
              conditions: JSON.parse(rule.conditions),
            })),
          }))
        )
      }
    } catch (error) {
      console.error('Fetch result types error:', error)
    }
  }

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

  // ==================== 结果类型管理 ====================
  const addResultType = () => {
    setResultTypes([
      ...resultTypes,
      {
        name: '',
        displayName: '',
        color: '#6366f1',
        description: '',
        explanation: '',
        advice: '',
        rules: [{ conditions: {}, matchType: 'all' }],
      },
    ])
  }

  const removeResultType = async (index: number) => {
    const resultType = resultTypes[index]
    if (resultType.id) {
      if (!confirm('确定要删除这个结果类型吗？')) return
      try {
        await fetch(`/api/result-types/${resultType.id}`, {
          method: 'DELETE',
        })
      } catch (error) {
        console.error('Delete result type error:', error)
        alert('删除失败')
        return
      }
    }
    setResultTypes(resultTypes.filter((_, i) => i !== index))
  }

  const updateResultType = (index: number, field: keyof ResultType, value: any) => {
    const newResultTypes = [...resultTypes]
    newResultTypes[index][field] = value
    setResultTypes(newResultTypes)
  }

  const addRule = (resultTypeIndex: number) => {
    const newResultTypes = [...resultTypes]
    newResultTypes[resultTypeIndex].rules.push({
      conditions: {},
      matchType: 'all',
    })
    setResultTypes(newResultTypes)
  }

  const removeRule = (resultTypeIndex: number, ruleIndex: number) => {
    const newResultTypes = [...resultTypes]
    if (newResultTypes[resultTypeIndex].rules.length > 1) {
      newResultTypes[resultTypeIndex].rules.splice(ruleIndex, 1)
      setResultTypes(newResultTypes)
    }
  }

  const updateRule = (
    resultTypeIndex: number,
    ruleIndex: number,
    field: keyof ResultRule,
    value: any
  ) => {
    const newResultTypes = [...resultTypes]
    const rule = { ...newResultTypes[resultTypeIndex].rules[ruleIndex] }
    ;(rule as any)[field] = value
    newResultTypes[resultTypeIndex].rules[ruleIndex] = rule
    setResultTypes(newResultTypes)
  }

  const toggleOptionInRule = (
    resultTypeIndex: number,
    ruleIndex: number,
    questionId: string,
    optionId: string
  ) => {
    const newResultTypes = [...resultTypes]
    const rule = newResultTypes[resultTypeIndex].rules[ruleIndex]
    const currentConditions = rule.conditions[questionId] || []
    
    if (currentConditions.includes(optionId)) {
      rule.conditions[questionId] = currentConditions.filter((id: string) => id !== optionId)
      if (rule.conditions[questionId].length === 0) {
        delete rule.conditions[questionId]
      }
    } else {
      rule.conditions[questionId] = [...currentConditions, optionId]
    }
    
    setResultTypes([...newResultTypes])
  }

  const saveResultType = async (index: number) => {
    const resultType = resultTypes[index]
    
    // 验证
    if (!resultType.name.trim()) {
      alert('请输入类型名称（如：INTJ）')
      return
    }
    if (!resultType.displayName.trim()) {
      alert('请输入显示名称（如：建筑师）')
      return
    }
    if (!resultType.description.trim()) {
      alert('请输入类型描述')
      return
    }

    try {
      let res
      if (resultType.id) {
        // 更新
        res = await fetch(`/api/result-types/${resultType.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resultType),
        })
      } else {
        // 创建
        res = await fetch(`/api/tests/${testId}/result-types`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resultType),
        })
      }

      if (res.ok) {
        alert('保存成功')
        fetchResultTypes(testId)
      } else {
        const errorData = await res.json().catch(() => ({ error: '未知错误' }))
        console.error('Save result type error response:', errorData)
        alert('保存失败: ' + (errorData.error || '请查看控制台获取详细信息'))
      }
    } catch (error: any) {
      console.error('Save result type error:', error)
      alert('保存失败: ' + (error?.message || '网络错误，请重试'))
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
        router.push('/')
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
          {/* 基本信息 */}
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

          {/* 标签页切换 */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                type="button"
                onClick={() => setActiveTab('questions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'results'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                结果类型配置
              </button>
            </nav>
          </div>

          {/* 题目列表 */}
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

          {/* 结果类型配置 */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">结果类型配置</h2>
                <button
                  type="button"
                  onClick={addResultType}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  + 添加结果类型
                </button>
              </div>

              {resultTypes.length === 0 ? (
                <div className="bg-white shadow sm:rounded-lg p-12 text-center">
                  <div className="text-gray-400 text-6xl mb-4">📊</div>
                  <p className="text-gray-500">还没有配置结果类型，点击上方按钮添加</p>
                  <p className="text-gray-400 text-sm mt-2">类似MBTI，可以定义INTJ、ENFP等性格类型</p>
                </div>
              ) : (
                resultTypes.map((resultType, rtIndex) => (
                  <div
                    key={rtIndex}
                    className="bg-white shadow sm:rounded-lg overflow-hidden"
                  >
                    {/* 结果类型头部 */}
                    <div 
                      className="p-4 text-white flex justify-between items-center"
                      style={{ backgroundColor: resultType.color }}
                    >
                      <div className="flex items-center space-x-4">
                        <input
                          type="text"
                          value={resultType.name}
                          onChange={(e) => updateResultType(rtIndex, 'name', e.target.value)}
                          className="bg-transparent border-b border-white/30 text-2xl font-bold w-20 text-center focus:outline-none focus:border-white"
                          placeholder="INTJ"
                        />
                        <span className="text-xl">→</span>
                        <input
                          type="text"
                          value={resultType.displayName}
                          onChange={(e) => updateResultType(rtIndex, 'displayName', e.target.value)}
                          className="bg-transparent border-b border-white/30 text-xl w-32 focus:outline-none focus:border-white"
                          placeholder="建筑师"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={resultType.color}
                          onChange={(e) => updateResultType(rtIndex, 'color', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-2 border-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeResultType(rtIndex)}
                          className="text-white/80 hover:text-white"
                        >
                          删除
                        </button>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* 描述 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          类型描述
                        </label>
                        <textarea
                          value={resultType.description}
                          onChange={(e) => updateResultType(rtIndex, 'description', e.target.value)}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="描述这种类型的特点..."
                        />
                      </div>

                      {/* 解释 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          详细解析
                        </label>
                        <textarea
                          value={resultType.explanation}
                          onChange={(e) => updateResultType(rtIndex, 'explanation', e.target.value)}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="详细解析这种类型的行为模式..."
                        />
                      </div>

                      {/* 建议 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          发展建议
                        </label>
                        <textarea
                          value={resultType.advice}
                          onChange={(e) => updateResultType(rtIndex, 'advice', e.target.value)}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="给这种类型的发展建议..."
                        />
                      </div>

                      {/* 规则配置 */}
                      <div className="border-t pt-6">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium text-gray-900">匹配规则</h4>
                          <button
                            type="button"
                            onClick={() => addRule(rtIndex)}
                            className="text-sm text-indigo-600 hover:text-indigo-900"
                          >
                            + 添加规则
                          </button>
                        </div>

                        {resultType.rules.map((rule, rIndex) => (
                          <div key={rIndex} className="border rounded-lg p-4 mb-4">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">规则 {rIndex + 1}</span>
                                <select
                                  value={rule.matchType}
                                  onChange={(e) => updateRule(rtIndex, rIndex, 'matchType', e.target.value as any)}
                                  className="text-sm border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="all">满足所有条件</option>
                                  <option value="any">满足任意条件</option>
                                  <option value="score">达到分数阈值</option>
                                </select>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeRule(rtIndex, rIndex)}
                                className="text-red-600 hover:text-red-900 text-sm"
                              >
                                删除规则
                              </button>
                            </div>

                            {rule.matchType === 'score' ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">总分 ≥</span>
                                <input
                                  type="number"
                                  value={rule.scoreThreshold || ''}
                                  onChange={(e) => updateRule(rtIndex, rIndex, 'scoreThreshold', parseInt(e.target.value) || 0)}
                                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                                  placeholder="分数"
                                />
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {testQuestions.map((question) => (
                                  <div key={question.id}>
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                      {question.content}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {question.options.map((option) => {
                                        const isSelected = rule.conditions[question.id]?.includes(option.id)
                                        return (
                                          <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => toggleOptionInRule(rtIndex, rIndex, question.id, option.id)}
                                            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                              isSelected
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                                            }`}
                                          >
                                            {option.content}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* 保存按钮 */}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => saveResultType(rtIndex)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          保存此结果类型
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
