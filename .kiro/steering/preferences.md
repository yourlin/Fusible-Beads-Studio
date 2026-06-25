# 项目协作偏好

## 沟通语言

- **始终使用中文与用户沟通**：所有回复、解释、总结、提问都用中文。
- 代码、提交信息、文件内的英文术语可保留（如变量名、Conventional Commits 类型），但面向用户的对话一律中文。

## Git

- 执行 `git push` 时必须带 `--no-verify` 参数（本环境的 push 钩子需要跳过）。
  - 示例：`git push --no-verify -u origin main`
- 其余 Git 安全规则不变：不强推、不改写已推送历史、不修改 git config。
