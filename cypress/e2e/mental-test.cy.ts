describe('心理测试系统', () => {
  beforeEach(() => {
    // 访问首页
    cy.visit('/')
  })

  describe('首页 - 测试单管理列表', () => {
    it('应该显示页面标题和创建按钮', () => {
      cy.contains('心理测试管理系统').should('be.visible')
      cy.contains('管理和发布心理测试问卷').should('be.visible')
      cy.contains('创建测试单').should('be.visible')
    })

    it('应该能够导航到创建测试单页面', () => {
      cy.contains('创建测试单').click()
      cy.url().should('include', '/admin/tests/create')
      cy.contains('创建测试单').should('be.visible')
    })
  })

  describe('创建测试单', () => {
    beforeEach(() => {
      cy.contains('创建测试单').click()
    })

    it('应该能够创建一个新的测试单', () => {
      // 填写基本信息
      cy.get('#title').type('抑郁自评量表测试')
      cy.get('#description').type('这是一个用于评估抑郁症状的心理测试')

      // 填写第一题
      cy.contains('第 1 题').should('be.visible')
      cy.get('input[placeholder="请输入题干"]').first().type('我感到情绪低落')
      
      // 填写选项
      cy.get('input[placeholder="选项 A"]').first().type('从不')
      cy.get('input[placeholder="选项 B"]').first().type('偶尔')
      
      // 添加选项
      cy.contains('+ 添加选项').first().click()
      cy.get('input[placeholder="选项 C"]').first().type('经常')

      // 添加新题目
      cy.contains('+ 添加题目').click()
      cy.contains('第 2 题').should('be.visible')
      cy.get('input[placeholder="请输入题干"]').eq(1).type('我对未来感到悲观')
      cy.get('input[placeholder="选项 A"]').eq(1).type('完全不符合')
      cy.get('input[placeholder="选项 B"]').eq(1).type('有点符合')

      // 保存测试单
      cy.contains('保存测试单').click()
      
      // 验证返回首页
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      cy.contains('抑郁自评量表测试').should('be.visible')
    })

    it('应该验证必填字段', () => {
      // 直接点击保存
      cy.contains('保存测试单').click()
      
      // 应该显示警告
      cy.on('window:alert', (text) => {
        expect(text).to.include('请输入测试单标题')
      })
    })
  })

  describe('测试单操作', () => {
    beforeEach(() => {
      // 先创建一个测试单
      cy.contains('创建测试单').click()
      cy.get('#title').type('测试用测试单')
      cy.get('input[placeholder="请输入题干"]').first().type('测试问题1')
      cy.get('input[placeholder="选项 A"]').first().type('选项A')
      cy.get('input[placeholder="选项 B"]').first().type('选项B')
      cy.contains('保存测试单').click()
      cy.contains('测试用测试单').should('be.visible')
    })

    it('应该能够编辑测试单', () => {
      cy.contains('测试用测试单')
        .parent()
        .parent()
        .contains('编辑')
        .click()
      
      cy.url().should('include', '/edit')
      cy.get('#title').clear().type('修改后的测试单')
      cy.contains('保存修改').click()
      
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      cy.contains('修改后的测试单').should('be.visible')
    })

    it('应该能够上线测试单', () => {
      cy.contains('修改后的测试单')
        .parent()
        .parent()
        .contains('上线')
        .click()
      
      cy.contains('已上线').should('be.visible')
      cy.contains('下线').should('be.visible')
      cy.contains('预览').should('be.visible')
    })

    it('应该能够访问测试页面', () => {
      // 先上线
      cy.contains('修改后的测试单')
        .parent()
        .parent()
        .contains('上线')
        .click()
      
      // 点击预览
      cy.contains('修改后的测试单')
        .parent()
        .parent()
        .contains('预览')
        .click()
      
      // 验证在新标签页打开（Cypress 会自动跟随）
      cy.url().should('include', '/tests/')
      cy.contains('修改后的测试单').should('be.visible')
      cy.contains('测试问题1').should('be.visible')
      cy.contains('选项A').should('be.visible')
      cy.contains('选项B').should('be.visible')
    })

    it('应该能够提交测试答案', () => {
      // 先上线
      cy.visit('/')
      cy.contains('修改后的测试单')
        .parent()
        .parent()
        .contains('上线')
        .click()
      
      // 访问测试页面
      cy.contains('修改后的测试单')
        .parent()
        .parent()
        .contains('预览')
        .click()
      
      // 选择答案
      cy.contains('选项A').click()
      
      // 提交
      cy.contains('提交答案').click()
      
      // 验证结果页面
      cy.contains('测试完成！').should('be.visible')
      cy.contains('您的得分').should('be.visible')
    })

    it('应该能够查看测试结果', () => {
      // 先上线并提交一个答案
      cy.visit('/')
      cy.contains('修改后的测试单')
        .parent()
        .parent()
        .contains('上线')
        .click()
      
      cy.contains('修改后的测试单')
        .parent()
        .parent()
        .contains('预览')
        .click()
      
      cy.contains('选项A').click()
      cy.contains('提交答案').click()
      cy.contains('返回首页').click()
      
      // 查看结果
      cy.contains('修改后的测试单')
        .parent()
        .parent()
        .contains('查看结果')
        .click()
      
      cy.url().should('include', '/responses')
      cy.contains('答卷列表').should('be.visible')
      cy.contains('答卷 #1').should('be.visible')
    })

    it('应该能够删除测试单', () => {
      cy.visit('/')
      cy.contains('修改后的测试单')
        .parent()
        .parent()
        .contains('删除')
        .click()
      
      cy.on('window:confirm', () => true)
      
      cy.contains('修改后的测试单').should('not.exist')
    })
  })

  describe('测试页面 SSR', () => {
    it('应该正确渲染已发布的测试单', () => {
      // 创建并上线测试单
      cy.contains('创建测试单').click()
      cy.get('#title').type('SSR测试单')
      cy.get('input[placeholder="请输入题干"]').first().type('SSR测试问题')
      cy.get('input[placeholder="选项 A"]').first().type('选项1')
      cy.get('input[placeholder="选项 B"]').first().type('选项2')
      cy.contains('保存测试单').click()
      
      cy.contains('SSR测试单')
        .parent()
        .parent()
        .contains('上线')
        .click()
      
      // 访问测试页面
      cy.contains('SSR测试单')
        .parent()
        .parent()
        .contains('预览')
        .click()
      
      // 验证 SSR 渲染的内容
      cy.contains('SSR测试单').should('be.visible')
      cy.contains('SSR测试问题').should('be.visible')
      cy.contains('共 1 道题目').should('be.visible')
    })

    it('未上线的测试单应该返回 404', () => {
      // 创建但不发布测试单
      cy.contains('创建测试单').click()
      cy.get('#title').type('未发布测试')
      cy.get('input[placeholder="请输入题干"]').first().type('测试问题')
      cy.get('input[placeholder="选项 A"]').first().type('A')
      cy.get('input[placeholder="选项 B"]').first().type('B')
      cy.contains('保存测试单').click()
      
      // 获取测试单 ID
      cy.contains('未发布测试')
        .parent()
        .parent()
        .contains('编辑')
        .invoke('attr', 'href')
        .then((href) => {
          const testId = href?.split('/')[3]
          // 直接访问测试页面应该 404
          cy.request({
            url: `/tests/${testId}`,
            failOnStatusCode: false,
          }).its('status').should('eq', 404)
        })
    })
  })
})
