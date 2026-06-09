'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ResultType {
  id: string
  name: string
  displayName: string
  color: string
  description: string
  explanation: string
  advice: string
}

interface TestResult {
  resultType: ResultType
  totalScore: number
  shareToken: string
  response: {
    test: {
      title: string
      description: string | null
    }
  }
}

export default function ResultPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const router = useRouter()
  const [shareToken, setShareToken] = useState('')
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    params.then(({ shareToken }) => {
      setShareToken(shareToken)
      fetchResult(shareToken)
    })
  }, [params])

  const fetchResult = async (token: string) => {
    try {
      const res = await fetch(`/api/results/${token}`)
      if (res.ok) {
        const data = await res.json()
        setResult(data)
      } else {
        alert('结果不存在或已过期')
        router.push('/')
      }
    } catch (error) {
      console.error('Fetch result error:', error)
      alert('获取结果失败')
    } finally {
      setLoading(false)
    }
  }

  const copyShareLink = async () => {
    const shareUrl = window.location.href
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy share link error:', error)
      alert('复制链接失败，请手动复制')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">加载中...</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <div className="text-gray-600 text-lg">结果不存在或已过期</div>
          <button
            onClick={() => router.push('/')}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const { resultType, response } = result

  return (
    <div className="min-h-screen" style={{ backgroundColor: resultType.color + '15' }}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* 测试标题 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {response.test.title}
          </h1>
          <p className="text-gray-500">测试结果</p>
        </div>

        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          {/* 头部 */}
          <div 
            className="p-8 text-white text-center"
            style={{ backgroundColor: resultType.color }}
          >
            <div className="text-6xl font-bold mb-2">{resultType.name}</div>
            <div className="text-2xl opacity-90">{resultType.displayName}</div>
          </div>
          
          {/* 内容 */}
          <div className="p-8 space-y-8">
            {/* 描述 */}
            <section>
              <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                <span className="w-1 h-6 mr-3 rounded" style={{ backgroundColor: resultType.color }}></span>
                类型描述
              </h3>
              <p className="text-gray-600 leading-relaxed pl-4">
                {resultType.description}
              </p>
            </section>
            
            {/* 解释 */}
            <section>
              <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                <span className="w-1 h-6 mr-3 rounded" style={{ backgroundColor: resultType.color }}></span>
                详细解析
              </h3>
              <p className="text-gray-600 leading-relaxed pl-4">
                {resultType.explanation}
              </p>
            </section>
            
            {/* 建议 */}
            <section>
              <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                <span className="w-1 h-6 mr-3 rounded" style={{ backgroundColor: resultType.color }}></span>
                发展建议
              </h3>
              <div className="pl-4">
                <p className="text-gray-600 leading-relaxed">
                  {resultType.advice}
                </p>
              </div>
            </section>
            
            {/* 分享 */}
            <section className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">分享这个结果</h3>
              <div className="flex gap-3">
                <button
                  onClick={copyShareLink}
                  className="flex-1 py-3 px-4 rounded-lg text-white font-medium transition-all hover:opacity-90"
                  style={{ backgroundColor: resultType.color }}
                >
                  {copied ? '✓ 已复制链接' : '复制分享链接'}
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="py-3 px-4 rounded-lg border-2 font-medium transition-all hover:bg-gray-50"
                  style={{ borderColor: resultType.color, color: resultType.color }}
                >
                  去做测试
                </button>
              </div>
            </section>
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
