'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Answer {
  id: string
  question: {
    id: string
    content: string
  }
  option: {
    id: string
    content: string
    score: number
  }
}

interface Response {
  id: string
  createdAt: string
  answers: Answer[]
}

interface Test {
  id: string
  title: string
}

export default function ResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const [testId, setTestId] = useState<string>('')
  const [test, setTest] = useState<Test | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      setTestId(id)
      fetchData(id)
    })
  }, [params])

  const fetchData = async (id: string) => {
    try {
      // 获取测试单信息
      const testRes = await fetch(`/api/tests/${id}`)
      if (testRes.ok) {
        const testData = await testRes.json()
        setTest(testData)
      }

      // 获取所有响应
      const responsesRes = await fetch(`/api/tests/${id}/responses`)
      if (responsesRes.ok) {
        const responsesData = await responsesRes.json()
        setResponses(responsesData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateScore = (response: Response) => {
    return response.answers.reduce((sum, answer) => sum + answer.option.score, 0)
  }

  const getMaxScore = () => {
    if (!responses.length) return 0
    // 获取第一组答案中的最大可能分数
    const firstResponse = responses[0]
    const questionIds = [...new Set(firstResponse.answers.map((a) => a.question.id))]
    let maxScore = 0
    questionIds.forEach((qid) => {
      const questionAnswers = firstResponse.answers.filter((a) => a.question.id === qid)
      const maxOptionScore = Math.max(...questionAnswers.map((a) => a.option.score))
      maxScore += maxOptionScore
    })
    return maxScore
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-900">
            ← 返回列表
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            {test?.title || '测试单'} - 答卷结果
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            共收到 {responses.length} 份答卷
          </p>
        </div>

        {responses.length === 0 ? (
          <div className="bg-white shadow sm:rounded-lg p-8 text-center">
            <p className="text-gray-500">暂无答卷数据</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 答卷列表 */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">答卷列表</h3>
                </div>
                <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {responses.map((response, index) => (
                    <li
                      key={response.id}
                      className={`px-4 py-4 cursor-pointer hover:bg-gray-50 ${
                        selectedResponse?.id === response.id ? 'bg-indigo-50' : ''
                      }`}
                      onClick={() => setSelectedResponse(response)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            答卷 #{index + 1}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(response.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {calculateScore(response)} 分
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 答卷详情 */}
            <div className="lg:col-span-2">
              {selectedResponse ? (
                <div className="bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">答卷详情</h3>
                      <span className="text-2xl font-bold text-indigo-600">
                        {calculateScore(selectedResponse)} / {getMaxScore()} 分
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      提交时间：{new Date(selectedResponse.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="px-4 py-5">
                    <div className="space-y-6">
                      {selectedResponse.answers.map((answer, index) => (
                        <div
                          key={answer.id}
                          className="border-b border-gray-100 pb-4 last:border-0"
                        >
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            <span className="text-indigo-600 mr-2">{index + 1}.</span>
                            {answer.question.content}
                          </p>
                          <div className="ml-6">
                            <p className="text-sm text-gray-600">
                              选择：
                              <span className="font-medium text-gray-900 ml-1">
                                {answer.option.content}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              得分：{answer.option.score} 分
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow sm:rounded-lg p-8 text-center">
                  <p className="text-gray-500">点击左侧答卷查看详情</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
