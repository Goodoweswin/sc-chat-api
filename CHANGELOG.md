# Workers AI API 变更日志

## [1.0.0] - 2026-01-04
### 新增
- 基础AI聊天功能（POST /api/chat）
- HTTP Basic Auth密码保护
- IP限流（100次/天）
- 知识库上下文检索（Top 3篇文章）
- 单细胞专用Prompt构建

### 技术选型
- Cloudflare Workers（边缘计算）
- Workers KV（限流 + 知识库）
- Google Gemini 3 Pro（AI模型）

### 性能指标
- 响应时间：600-1200ms
- CPU时间：<5ms
- KV读写：<3ms

## [1.0.1] - 待发布
### 计划
- [ ] 全文搜索API（GET /api/search）
- [ ] 知识库自动索引生成
- [ ] 用户访问日志记录
- [ ] CORS跨域限制（仅允许你的网站）

## [1.1.0] - 长期规划
### 功能
- [ ] 多轮对话上下文记忆
- [ ] 代码执行环境（浏览器内R/Python）
- [ ] 用户账号系统（D1数据库）
- [ ] 付费额度管理（Stripe）
