# 丢响应与迟到退出验收

candidate8 Auth/BFF，candidate5 Gateway/IAM；真实同源HTTPS、Chrome、双Auth/BFF节点与三节点GR。

1. BFF提交200后代理实际断链，正式Cookie未交付；原BFF节点SIGKILL，另一节点resume交付同一结果。重复恢复仍为相同AT、sid、root、代次和原登录截止，数据库结果会话数量1。
2. 原root注销持久确认后扣住响应，实际重新登录创建新root，再释放旧响应。旧响应200且无Set-Cookie，新Cookie/AT/root保持有效，旧root不恢复。

两项通过，原始脱敏结果见同名JSON。临时路由和代理模式均在finally恢复；其余故障、性能及发布门禁仍未关闭，未提交。
