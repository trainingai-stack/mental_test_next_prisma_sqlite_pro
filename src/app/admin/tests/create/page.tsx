'use client'

import { useState } from 'react'
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

export default function CreateTestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([
    { content: '', options: [{ content: '', score: 0 }, { content: '', score: 0 }] },
  ])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          questions,
        }),
      })

      if (res.ok) {
        router.push('/')
      } else {
        alert('创建失败，请重试')
      }
    } catch (error) {
      console.error('Create test error:', error)
      alert('创建失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-900">
            ← 返回列表
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">创建测试单</h1>
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
            </div>
          </div>

          {/* 题目列表 */}
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
              {loading ? '保存中...' : '保存测试单'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
