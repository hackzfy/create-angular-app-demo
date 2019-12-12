# es-projects 配置

## 项目目录与路由

D: 文件夹 F: 文件

### 目录结构

```code

新模块 D
├── 创建页 D
├── 详情页 D
├── 列表页 D
├── 修改页 D
├── 模块定义 F
├── 模块路由 F
├── 模块中使用的模型 F
└── 模块服务 F
```

> 示例

```code
src/app/user
├── create
│   ├── create.component.html
│   ├── create.component.scss
│   ├── create.component.spec.ts
│   └── create.component.ts
├── details
│   ├── details.component.html
│   ├── details.component.scss
│   ├── details.component.spec.ts
│   └── details.component.ts
├── list
│   ├── list.component.html
│   ├── list.component.scss
│   ├── list.component.spec.ts
│   └── list.component.ts
├── update
│   ├── update.component.html
│   ├── update.component.scss
│   ├── update.component.spec.ts
│   └── update.component.ts
├── user-routing.module.ts
├── user.model.ts  存放模型
├── user.module.ts
└── user.service.ts 模块级 service


```

> 如果模块中包含子模块，遵循同样的结构。

### 对应的路由结构

```code

const routes = [
  // 用户模块
  {
    path: 'user',
    children: [
      // 用户列表
      { path: 'list', component: UserListComponent },
      // 用户详情
      { path: 'details/:id', component: UserDetailsComponent },
      // 用户信息更新
      { path: 'update/:id', component: UserUpdateComponent },
      // 新增用户
      { path: 'create', component: UserCreateComponent }
    ]
  }
];

```

## 组件开发规范

### 所有的非页面级 component 都要继承 BaseComponent

- 获取对应的属性和方法。
- 避免重复代码。比如 subscription， ngOnDestroy，每个组件都会用到，可以通过继承精简大量代码。
- 统一维护。组件在构造器，初始化，销毁时可以统一执行一些共同的逻辑，这些逻辑在父类中设定， 并且可以根据业务逻辑进行修改，实现组件的统筹管理。

**`base-component.class.ts`**

```ts
export abstract class BaseComponent extends Base {
  protected constructor(protected injector: Injector) {
    super(injector);
  }
}
```

**`not-a-page.component.ts`**

```ts
import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../public-api';
import { interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'lib-not-a-page',
  template: `
    {{ count }}
  `
})
export class NotAPageComponent extends BaseComponent implements OnInit {
  count: number;

  constructor(protected injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => (this.count = value));
  }
}
```

### 所有的页面级组件都需要继承 BasePage

- BasePageComponent 有一个抽象属性：moduleService，继承后必须实例化此属性。
- 所有和 UI 展示有关的逻辑写在 component 中，与数据获取有关的逻辑由 moduleService 提供。实现数据与 ui 的分层。
- 继承后可以通过在 BasePage 中添加属性和方法来统一管理所有的页面级组件。

**`base-page.class.ts`**

```ts
export abstract class BasePage extends BaseComponent {
  protected abstract moduleService: BaseModuleService;
  protected route: ActivatedRoute;
  protected router: Router;

  constructor(protected injector: Injector) {
    super(injector);
    this.route = injector.get(ActivatedRoute);
    this.router = injector.get(Router);
  }
}
```

**`a-page.component.ts`**

```ts
@Component({
  selector: 'lib-a-page',
  template: ``
})
export class APageComponent extends BasePage implements OnInit {
  users: IUser[] = [];

  constructor(protected injector: Injector, protected moduleService: DemoService) {
    super(injector);
  }

  ngOnInit() {
    this.moduleService.getUsers().subscribe(users => (this.users = users));
  }
}
```

### component 所有的属性必须有初始值

**如果属性是数组类型，则赋值空数组。如果属性是空对象，则赋值为空对象。**

```ts
@Component({
  selector: 'lib-a-page',
  template: ``
})
export class APageComponent extends BasePage implements OnInit {
  users: IUser[] = [];
  details = {} as IUser;

  constructor(protected injector: Injector, protected moduleService: DemoService) {
    super(injector);
  }

  ngOnInit() {
    this.moduleService.getUsers().subscribe(users => (this.users = users));
  }
}
```

### 所有不会自动取消的订阅都必须添加 takeUntil 操作符来防止内存泄漏

```ts
@Component({
  selector: 'lib-not-a-page',
  template: `
    {{ count }}
  `
})
export class NotAPageComponent extends BaseComponent implements OnInit {
  count: number;

  constructor(protected injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    interval(1000)
      .pipe(takeUntil(this.destroy$)) // takeUntil在组件销毁时自动取消订阅
      .subscribe(value => (this.count = value));
  }
}
```

### 所有组件和服务如果覆盖了父类的 ngOnDestroy 方法，必须调用 super.ngOnDestroy

```ts
export class NotAPageComponent extends BaseComponent implements OnDestroy {
  constructor(protected injector: Injector) {
    super(injector);
  }

  ngOnDestroy() {
    console.log('NotAPageComponent destroyed.');
    super.ngOnDestroy();
  }
}
```

### 任何组件中不得注入 HttpClient，不可以在组件中直接发送 http 请求。应该注入相应的 service 来完成。

## Service 开发规范

### 所有的 service 都应该直接或间接的继承 BaseService

```ts
import { Base } from './base.class';
import { Injector } from '@angular/core';

export abstract class BaseService extends Base {
  constructor(protected injector: Injector) {
    super(injector);
  }
}
```

### 所有发送 http 请求的 service 都应该直接或间接的继承 BaseApiService

```ts
import { BaseService } from './base-service.class';
import { Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/**
 * Service uses httpClient should extend this class.
 */
export abstract class BaseApiService extends BaseService {
  protected http: HttpClient;
  constructor(protected injector: Injector) {
    super(injector);
    this.http = injector.get(HttpClient);
  }
}
```

### 所有为页面级组件提供数据的 service 都应该直接或间接的继承 BaseModuleService

```ts
import { BaseApiService } from './base-api-service.class';
import { Injector } from '@angular/core';

export abstract class BaseModuleService extends BaseApiService {
  protected constructor(protected injector: Injector) {
    super(injector);
  }
}
```

### 继承的目的

- 项目中 service 的统筹管理。
- 减少重复代码。
- service 分类，分层。

## 动态表单

### @ngx-formly/core

### 使用场景

- 表单项很多。
- 表单项之间有联动关系。
- 表单验证逻辑多。
- 表单项动态增删。

### 使用效果

- 减少 html 代码 90% 以上。
- 表单通过配置生成，只要组件封装好，开发效率很高。
- 表单项动态显隐，表单值回写，处理，都可以很方便的实现。
- 具体使用方法请查看文档：<https://formly.dev/>

## 公共库管理

> 在项目前期， 中期，甚至后期，公共库都有可能修改。这时推荐使用 git submodule 进行不同项目的共享和同步。当公共库稳定后，再打包发布，后续项目使用 npm 安装使用。

1. 所有项目通用的公共库使用 ng g lib 生成。

> `ng g lib es-common`

```code
projects
└── es-common
    ├── README.md
    ├── karma.conf.js
    ├── ng-package.json
    ├── package.json
    ├── src
    │   ├── lib
    │   │   ├── es-common.component.spec.ts
    │   │   ├── es-common.component.ts
    │   │   ├── es-common.module.ts
    │   │   ├── es-common.service.spec.ts
    │   │   └── es-common.service.ts
    │   ├── public-api.ts
    │   └── test.ts
    ├── tsconfig.lib.json
    ├── tsconfig.spec.json
    └── tslint.json
```

- 修改 tsconfig 中对公共库路径的配置。

  修改前：

  ```json
  {
    "paths": {
      "es-common": ["dist/es-common"],
      "es-common/*": ["dist/es-common/*"]
    }
  }
  ```

  修改后：

  ```json
  {
    "paths": {
      "@es-common": ["projects/es-common/src/public-api"]
    }
  }
  ```

- 修改公共库的 package.json。

修改前:

```json
{
  "name": "es-common",
  "version": "0.0.1",
  "peerDependencies": {
    "@angular/common": "^7.2.0",
    "@angular/core": "^7.2.0"
  }
```

修改后：

```json
{
  "name": "@es-common",
  "version": "0.0.1",
  "peerDependencies": {
    "@angular/common": "^7.2.0",
    "@angular/core": "^7.2.0"
  }

```

- 公共代码库暴露给外部使用的类必须通过 src/public/api 导出, 禁止项直接引用公共库内部文件。

```ts
import { Component } from '@angular/core';
import { EsCommonService } from '@es-common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'es-project-demo';
  constructor(private common: EsCommonService) {}

```

- 公共代码库的 package.json 中， name 属性必须与公共库 package.json 中的 name 保持一致。

  > 这样做的额外好处是，当有一天公共库作为一个单独的 npm 包发布后，我们可以删除 projects 目录下的公共库，但是项目代码不需要修改 import 时使用的路径。

> 另一种公共文件属于当前业务的通用组件，和当前项目藕合。此类公共文件做为 npm 包发布没有意义。这种公共文件没有固定结构，只要方便管理和维护即可。下面是一个参考：(business-shared 文件夹在 projects 目录下手动创建)

```code
projects
└── business-shared
|    ├── module1
|    ├── module2
|    ├── hedge-shared
|    │   ├── hedge-apply-shared
|    │   │   ├── hedge-apply-shared.component.less
|    │   │   ├── hedge-apply-shared.component.ts
|    │   │   ├── hedge-apply-shared.component.html
|    │   ├── hedge-shared.module.ts
|    │   └── hedge-shared.service.ts
├── tsconfig.json
└── tslint.json

```

## 如何作为 git 子仓库发布

1. 首先需要在 bitbucket 上创建 repo。
2. 在当前 lib 文件夹下初始化 git 仓库。 `git init`
3. 添加 lib 中的文件。 `git add`
4. 设置仓库地址。 `git remote add origin 仓库地址`
5. 推送文件。 `git push -u origin master`

## 如何为项目添加子仓库

1. git submodule add [子仓库 url][子仓库将要在项目中存放的目录], 如果我们想在项目的 projects/common 目录设置一个子仓库， 则运行 `git submodule add https://example.com/common projects/common`

2. 添加成功后， 子仓库是空的。需要运行 `git submodule init` 来初始化仓库。
3. 仓库初始化成功后，运行 `git submodule update --remote` 来更新子仓库。
4. 如果想修改子仓库代码，需要进入子仓库目录，把分支切换为 master （或任何你想要的分支）后再操作，因为子仓库默认处于游离的 head 状态。
5. 如果修改了子仓库，请及时提交，否则别的项目组成员看不到最新的代码。
6. package.json 中已经有操作子仓库的脚本。

> `npm run submodule:init` 初始化子仓库
> `npm run submodule:update` 更新子仓库
> package.json 中没有添加子仓库的，添加的方法参考第一步。

## commit 检查

- 安装依赖

> `npm i --save-dev husky prettier lint-staged`

- 在项目根目录添加 .prettierrc

```json
{
  "bracketSpacing": true,
  "printWidth": 120,
  "useTabs": false,
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2
}
```

- 修改 `package.json`

```json
  "scripts": {
    "lint": "ng lint --fix",
    "format:write": "prettier --config ./.prettierrc --write"
  },
  "lint-staged": {
    "*.{ts,html}": [
      "npm run format:write",
      "git add"
    ]
  },
  "husky": {
    "hooks": {
      "pre-commit": "ng lint && lint-staged"
    }
  },

```

> 经过配置后，在代码提交前会先进行 tslint 检查，并格式化代码。
