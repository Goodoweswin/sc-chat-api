<!--
==================================================
文件：sc-chat-api/WORKFLOW.md
功能：部署与运维工作流（完整操作指南）
受众：项目维护者（你自己）
要求：步骤精确到命令，包含错误排查，可直接执行
重要性：未来3年维护的唯一指南
==================================================

【文档结构】
1. 环境准备（首次部署）
2. 部署流程（日常更新）
3. 测试验证（部署后必做）
4. 故障排查（常见问题）
5. 维护周期（每周/每月任务）
6. 紧急回滚（灾难恢复）

【写作要求】
- 使用Markdown列表和代码块
- 每个步骤包含：命令 + 预期输出 + 验证方法
- 错误排查：问题现象 → 诊断命令 → 解决方案
- 维护周期：明确时间点（每周一、每月1号）

【技术细节】
- 项目：sc-chat-api（Workers AI聊天API）
- 技术栈：Cloudflare Workers + KV + Gemini 3 Pro
- 部署工具：Wrangler CLI
- 监控：Cloudflare Dashboard + wrangler tail
================================================== -->

# 部署与运维工作流

## 1. 环境准备（首次部署）

### 1.1 安装Wrangler
```bash
# 推荐：项目本地安装（已在 package.json 中配置）
npm install

# 验证安装
npx wrangler --version
# 预期输出：3.x.x
```

### 1.2 创建KV命名空间
```bash
# 创建限流KV
npx wrangler kv:namespace create "RATE_LIMIT"
# 记录输出的 id，填入 wrangler.toml
```

### 1.3 前端集成注意事项
- **CORS**: Worker 已配置 CORS 头，允许前端跨域调用。
- **URL**: 部署后获得的 URL (如 `https://sc-chat-api.xxx.workers.dev`) 必须填入前端 `src/components/chat-widget.html` 的 `API_ENDPOINT` 变量中。
- **Auth**: 前端通过 Basic Auth 传递密码，确保 Worker 中的 `ACCESS_PASSWORD` 环境变量已设置。

# 创建知识库KV
npx wrangler kv:namespace create "KNOWLEDGE_INDEX"
# 记录输出的 id，填入 wrangler.toml
```

### 1.3 设置密钥
```bash
# 设置访问密码
npx wrangler secret put ACCESS_PASSWORD
# 输入你的密码

# 设置Gemini API Key
npx wrangler secret put GEMINI_API_KEY
# 输入你的API Key
```

## 2. 部署流程
```bash
# 部署到生产环境
npm run deploy
```

## 3. 测试验证
```bash
# 测试API
curl -X POST https://sc-chat-api.<your-subdomain>.workers.dev/api/chat \
  -H "Authorization: Basic <base64_user_pass>" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is scRNA-seq?"}'
```
