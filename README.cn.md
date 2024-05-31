<h1 align="center" style="margin: 30px 0 30px; font-weight: bold;">RuoYi v0.1.0</h1>
<h4 align="center">基于Nestjs+Vue3前后端分离的Nodejs快速开发框架（WIP）</h4>
<h5>[EN DOC](https://github.com/CodeKungfu/nest-ruoyi-prisma/README.md)</h5>
<p align="center">
	<a href="https://github.com/CodeKungfu/ruoyi-vue3/blob/master/LICENSE"><img src="https://img.shields.io/github/license/mashape/apistatus.svg"></a>
</p>

# 用nodejs（nestjs） 重写若依cms

本项目代码是个人开发，未经大量测试和专业测试，不建议用于生产环境。

## 平台简介

特别鸣谢Ruoyi 原版开发者无私开源及支持我的伙伴们。让我有很大的动力去开发一版基于Nodejs的Ruoyi。目前还是处于（WIP）, 早期的一个状态，欢迎大家提建议, 提issue, 提PullRequest。

Java版若依是一套流行的快速开发平台, 但是对于不熟悉或不擅长Java但是擅长Nodejs或前端的开发人员来，本项目可以作为一个学习和参考。

* 采用前后端分离的模式，前端(基于 [RuoYi-Vue](https://github.com/CodeKungfu/ruoyi-vue3))。
* 后端采用Nestjs(nodejs) + prisma + mysql + redis。
* 提供了技术栈（[Vue3](https://v3.cn.vuejs.org) [Element Plus](https://element-plus.org/zh-CN) [Vite](https://cn.vitejs.dev)）版本[RuoYi-Vue3](https://github.com/CodeKungfu/ruoyi-vue3)，保持同步更新。

## 程序运行

```bash
# 克隆项目
git clone https://github.com/CodeKungfu/nest-ruoyi-prisma.git

# 进入项目目录
cd nest-ruoyi-prisma

# 把 deploy目录的ry_20231130.sql 安装到你指定的mysql 数据库

# 新建.env 按照.env.example 进行相应的环境变量修改(强烈建议不使用环境变量的默认用户名密码,避免不必要麻烦)

mv .env.example .env

# 安装依赖
yarn --registry=https://registry.npmmirror.com

# 初始化prisma

yarn db:gen

# 启动服务
yarn dev

# 构建测试环境 yarn build:stage
# 构建生产环境 yarn build:prod
# 前端访问地址 http://localhost:4080
```

## 内置功能（复刻若依功能，当前版本相应支持情况）

1.  用户管理：用户是系统操作者，该功能主要完成系统用户配置。（已支持）
2.  部门管理：配置系统组织机构（公司、部门、小组），树结构展现支持数据权限。（已支持）
3.  岗位管理：配置系统用户所属担任职务。（已支持）
4.  菜单管理：配置系统菜单，操作权限，按钮权限标识等。（已支持）
5.  角色管理：角色菜单权限分配、设置角色按机构进行数据范围权限划分。（已支持）
6.  字典管理：对系统中经常使用的一些较为固定的数据进行维护。（已支持）
7.  参数管理：对系统动态配置常用参数。（已支持）
8.  通知公告：系统通知公告信息发布维护。（已支持）
9.  操作日志：系统正常操作日志记录和查询；系统异常信息日志记录和查询。
10. 登录日志：系统登录日志记录查询包含登录异常。
11. 在线用户：当前系统中活跃用户状态监控。
12. 定时任务：在线（添加、修改、删除)任务调度包含执行结果日志。
13. 代码生成：前后端代码的生成（java、html、xml、sql）支持CRUD下载 。
14. 系统接口：根据业务代码自动生成相关的api接口文档。
15. 服务监控：监视当前系统CPU、内存、磁盘、堆栈等相关信息。
16. 在线构建器：拖动表单元素生成相应的HTML代码。
17. 连接池监视：监视当前系统数据库连接池状态，可进行分析SQL找出系统性能瓶颈。

## 系统模块

~~~
├──prisma                                             // prisma schema
src     
├── common                                            // 通用模块
├── config                                            // 配置模块
├── mission                                           // 任务模块
├── modules                                           // 系统模块
│       └── admin                                     // 系统接口及业务逻辑
│       └── ws                                        // websocket 模块
├── shared                                            // 公用模块
│       └── logger                                    // 日志模块
│       └── redis                                     // redis
│       └── services                                  // 公用业务
├──package.json                                       // 公共依赖
