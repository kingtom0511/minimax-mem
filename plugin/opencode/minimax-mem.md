# Claude-Mem OpenCode Plugin

Claude-Mem 持久记忆插件，让 OpenCode 支持跨会话记忆功能。

## 功能

- **会话追踪**: 自动追踪 OpenCode 会话
- **观察记录**: 记录工具执行到记忆库
- **上下文注入**: 新会话自动注入历史记忆
- **压缩保护**: 会话压缩时保留记忆上下文

## 前置要求

1. **Claude-Mem 已安装**
   ```bash
   # 安装 Claude-Mem
   claude /plugin marketplace add thedotmack/claude-mem
   ```

2. **Worker 服务运行中**
   ```bash
   ~/.claude/plugins/marketplaces/thedotmack/scripts/worker-service.cjs start
   ```

3. **OpenCode 1.0+**

## 安装方式

### 方式一: npm 包 (推荐)
在 `opencode.json` 添加:
```json
{
  "plugin": ["claude-mem"]
}
```

### 方式二: 本地插件
```bash
# 复制插件文件
cp plugin/opencode/claude-mem.js ~/.config/opencode/plugins/
```

## 配置

### 启动 Worker 服务
```bash
# 方式 1: 手动启动
~/.claude/plugins/marketplaces/thedotmack/scripts/worker-service.cjs start

# 方式 2: 开机自启 (添加到 shell rc 文件)
echo '~/.claude/plugins/marketplaces/thedotmack/scripts/worker-service.cjs start' >> ~/.zshrc
```

### 可选: 使用其他模型

Claude-Mem 默认使用 Claude SDK，可配置使用其他模型:

```bash
# 编辑设置
nano ~/.claude-mem/settings.json
```

| Provider | 配置 | 模型示例 |
|----------|------|---------|
| Claude SDK | 默认 | claude-sonnet-4-5 |
| OpenRouter | CLAUDE_MEM_PROVIDER=openrouter | xiaomi/mimo-v2-flash:free |
| Gemini | CLAUDE_MEM_PROVIDER=gemini | gemini-2.5-flash-lite |
| Minimax | CLAUDE_MEM_PROVIDER=minimax | MiniMax-M2.1 |

## 使用方法

安装完成后，直接使用 OpenCode:

```bash
cd your-project
opencode

# 正常对话，Claude-Mem 自动记录
> 创建个登录功能
> 添加用户认证
> 编写测试用例
```

新会话自动注入历史记忆。

## 查看记忆

打开 Claude-Mem Viewer:
```bash
open http://localhost:37777
```

## 事件映射

| OpenCode 事件 | Claude-Mem 操作 |
|--------------|----------------|
| session.created | 初始化会话 |
| tool.execute.before | 记录工具输入 |
| tool.execute.after | 记录工具输出 |
| experimental.chat.system.transform | 注入记忆上下文 |
| experimental.session.compacting | 压缩时保留上下文 |

## 故障排除

### 观察未记录
1. 检查 worker 是否运行: curl http://127.0.0.1:37777/api/health
2. 检查日志: tail ~/.claude-mem/logs/claude-mem-*.log

### 端口被占用
```bash
# 找到占用进程
lsof -i :37777

# 杀掉进程
kill <PID>

# 重启 worker
~/.claude/plugins/marketplaces/thedotmack/scripts/worker-service.cjs start
```

### 插件未加载
```bash
# 检查插件目录
ls -la ~/.config/opencode/plugins/

# 重新复制插件
cp plugin/opencode/claude-mem.js ~/.config/opencode/plugins/
```

## 卸载

```bash
# 删除插件文件
rm ~/.config/opencode/plugins/claude-mem.js

# 或从 opencode.json 移除
# 删除 "claude-mem" 从 plugin 数组
```
