<h1 align="center" style="margin: 30px 0 30px; font-weight: bold;">RuoYiNode v0.1.0</h1>
<h4 align="center">A rapid development framework for Node.js based on NestJS and Vue 3 with front-end and back-end separation (WIP)</h4>
<p align="center">
	<a href="https://github.com/CodeKungfu/ruoyi-vue3/blob/master/LICENSE"><img src="https://img.shields.io/github/license/mashape/apistatus.svg"></a>
</p>

English | [简体中文](https://github.com/CodeKungfu/nest-ruoyi-prisma/README.cn.md)

# Rewrite the Ruoyi CMS using Node.js (NestJS)

The code of this project is developed individually and has not undergone extensive or professional testing. It is not recommended for use in a production environment.

## Platform Introduction

Special thanks to the original developer of Ruoyi for their generous open-source contribution and to my partners for their support. Their encouragement has greatly motivated me to develop a Node.js-based version of Ruoyi. The project is currently in an early stage (Work in Progress). Suggestions, issues, and Pull Requests are welcome.


The Java version of Ruoyi is a popular rapid development platform, but for developers who are not familiar with or proficient in Java but excel in Node.js or front-end development, this project can serve as a learning resource and reference.

* It adopts a front-end and back-end separation model, with the front end based on [RuoYi-Vue](https://github.com/CodeKungfu/ruoyi-vue3)
* The back end uses NestJS (Node.js) + Prisma + MySQL + Redis.
* The technology stack includes [Vue 3](https://v3.cn.vuejs.org), [Element Plus](https://element-plus.org/zh-CN), and [Vite](https://cn.vitejs.dev). The project version [RuoYi-Vue3](https://github.com/CodeKungfu/ruoyi-vue3) is kept in sync with updates.

## Program Execution

```bash
# Clone the project
git clone https://github.com/CodeKungfu/nest-ruoyi-prisma.git

# Enter the project directory
cd nest-ruoyi-prisma

# Install the ry_20231130.sql file located in the deploy directory into your specified MySQL database

# Create a new .env file and make corresponding environment variable modifications according to .env.example (It's strongly recommended not to use default username and password for environment variables to avoid unnecessary trouble)

mv .env.example .env

# Install dependencies
yarn --registry=https://registry.npmmirror.com

# Initialize Prisma

yarn db:gen

# Start the service

yarn dev

```

## Built-in Functions (Replication of Ruoyi Functions, Current Version Support Status)

1. User Management: Users are system operators, and this function is mainly used to configure system users. (Supported)
2. Department Management: Configuring the organizational structure of the system (company, department, group), tree structure display supports data permissions. (Supported)
3. Position Management: Configuring the positions held by system users. (Supported)
4. Menu Management: Configuring system menus, operation permissions, button permission identifiers, etc. (Supported)
5. Role Management: Role menu permission allocation, setting role data range permissions by organization. (Supported)
6. Dictionary Management: Maintaining some frequently used and relatively fixed data in the system. (Supported)
7. Parameter Management: Dynamic configuration of commonly used parameters in the system. (Supported)
8. Notice Management: Publishing and maintaining system notification messages. (Supported)
9. Operation Log: Recording and querying normal operation logs and abnormal information logs of the system.
10. Login Log: Recording and querying system login logs, including login exceptions.
11. Online Users: Monitoring the status of active users in the current system.
12. Scheduled Tasks: Online (adding, modifying, deleting) task scheduling including execution result logs.
13. Code Generation: Generating front-end and back-end code (java, html, xml, sql) supporting CRUD downloads.
14. System Interface: Automatically generating related API interface documents based on business code.
15. Service Monitoring: Monitoring relevant information such as current system CPU, memory, disk, and stack.
16. Online Builder: Dragging form elements to generate corresponding HTML code.
17. Connection Pool Monitoring: Monitoring the status of the current system's database connection pool, and analyzing SQL to identify system performance bottlenecks.

## System Modules

~~~
prisma                                             // Prisma schema
src     
├── common                                            // Common module
├── config                                            // Configuration module
├── mission                                           // Mission module
├── modules                                           // System modules
│       └── admin                                     // System interfaces and business logic
│       └── ws                                        // Websocket module
├── shared                                            // Shared module
│       └── logger                                    // Logging module
│       └── redis                                     // Redis
│       └── services                                  // Shared services
package.json                                       // Common dependencies
