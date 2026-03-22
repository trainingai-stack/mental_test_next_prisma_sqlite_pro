'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Test {
  id: string
  title: string
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
  _count: {
    questions: number
    responses: number
  }
}

export default function Home() {
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/tests')
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || '获取数据失败')
        setTests([])
        return
      }
      
      if (!Array.isArray(data)) {
        setError('数据格式错误')
        setTests([])
        return
      }
      
      setTests(data)
    } catch (error) {
      console.error('Failed to fetch tests:', error)
      setError('网络错误，请稍后重试')
      setTests([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个测试单吗？')) return

    try {
      const res = await fetch(`/api/tests/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setTests(tests.filter((test) => test.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete test:', error)
    }
  }

  const handleToggleStatus = async (test: Test) => {
    const newStatus = test.status === 'published' ? 'draft' : 'published'
    try {
      const res = await fetch(`/api/tests/${test.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: test.title,
          description: test.description,
          status: newStatus,
          questions: [],
        }),
      })
      if (res.ok) {
        fetchTests()
      }
    } catch (error) {
      console.error('Failed to update test status:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            已上线
          </span>
        )
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            草稿
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            已下线
          </span>
        )
    }
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">心理测试管理系统</h1>
            <p className="mt-1 text-sm text-gray-500">管理和发布心理测试问卷</p>
          </div>
          <Link
            href="/admin/tests/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            创建测试单
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={fetchTests}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              重试
            </button>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {tests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无测试单，点击上方按钮创建</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {tests.map((test) => (
                <li key={test.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {test.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {test.description || '暂无描述'}
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>{getStatusBadge(test.status)}</span>
                          <span>{test._count?.questions || 0} 道题目</span>
                          <span>{test._count?.responses || 0} 份答卷</span>
                          <span>
                            创建于 {new Date(test.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {test.status === 'published' ? (
                          <>
                            <Link
                              href={`/tests/${test.id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                            >
                              预览
                            </Link>
                            <Link
                              href={`/admin/tests/${test.id}/responses`}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                            >
                              查看结果
                            </Link>
                          </>
                        ) : null}
                        <button
                          onClick={() => handleToggleStatus(test)}
                          className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-xs font-medium rounded ${
                            test.status === 'published'
                              ? 'border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                              : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                          }`}
                        >
                          {test.status === 'published' ? '下线' : '上线'}
                        </button>
                        <Link
                          href={`/admin/tests/${test.id}/edit`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(test.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
