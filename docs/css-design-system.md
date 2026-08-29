# Pure CSS 设计体系：变量定义规则与设计原则

> 版本：基于 `client/scss/` 当前代码（2026-08）审阅
> 目的：说明本项目 CSS 自定义属性（CSS var）的分层规则、命名约定、基础 token 清单，并标注现存缺口——为后续引入"普遍适应性响应式方案"提供基线。

---

## 摘要

Pure 的样式系统不依赖任何 CSS 框架（无 Tailwind、无 CSS-in-JS），由 Dart Sass 编译，通过 webpack `sass-loader` + `mini-css-extract-plugin` 产出单一 `[name].min.css`。

其核心不是"写样式"，而是**用 CSS 自定义属性构建一条可被任意祖先节点改道的值传递链**。SCSS 只承担两件编译期必需的工作：媒体查询断点（`$screen-*`）和图标码点（`$icon-*`）；其余全部是运行期可覆盖的 `--*` 变量。

全项目共 **493 行** 自定义属性声明，分布在 26 个源文件中；权威定义文件是 `client/scss/_theme.default.scss`（263 行）。

---

## 一、架构：三层 Token 模型

系统实际存在三层，越往下越"语义化"、越接近组件：

```
第 1 层  原始通道（Channel primitives）      :root
         --color-major-hue: 165
         --color-major-saturation: 58%
         --color-major-lightness: 23%
                        ↓ hsl() 组装
第 2 层  语义角色（Semantic roles）          body
         --color-major: hsl(hue, sat, light)
         --color / --color-bg / --color-border   ← 上下文别名
                        ↓ comp-color() / comp-size() 批量派生
第 3 层  组件契约（Component contract）      .btn / .input / ...
         --btn-color / --btn-color-bg / --btn-size / --btn-font-size
```

### 设计原则 1：颜色以 HSL 通道为原子，而非色值

项目**不存储颜色，只存储色相/饱和度/明度三个通道**，最终颜色由 `hsl()` 在第 2 层组装：

```scss
--color-major: hsl(
  var(--color-major-hue),
  var(--color-major-saturation),
  var(--color-major-lightness)
);
```

直接收益：换肤只需改一个 `--color-major-hue`。`data/comps/theme*.js` 正是这么做的——四套主题（default/blue/pink/yellow）各自只声明 4～6 个通道值，由服务端 `server/ejs/comp_theme.js` 生成内联 `<style>` 注入 `body`：

```js
// data/comps/theme.js
default: {
  '--color-major-hue': '216',
  '--color-major-saturation': '100%',
  '--color-major-lightness': '50%',
  '--color-major-lightness-l1': '96%',
}
```

暗色模式同理，只翻转明度通道，不重写任何色值。

### 设计原则 2：变量沿 DOM 继承改道，而非靠选择器叠加

组件永不直接读全局 token，而是读自己的 `--<comp>-*`；而 `--<comp>-*` 又指向上下文别名 `--color` / `--color-bg`。于是任何祖先元素改写 `--color` 就能整片改道，无需增加选择器特异性。

`_mixins.scss:7-23` 的 `comp-color($name)` 为每个组件批量盖出 13 个 token：

```scss
@mixin comp-color($name) {
  .#{$name} {
    --#{$name}-color: var(--color);
    --#{$name}-color-bg: var(--color-bg);
    --#{$name}-color-border: var(--color-border);
    --#{$name}-color-hover: var(--color-hover);
    --#{$name}-color-bg-hover: var(--color-bg-hover);
    --#{$name}-color-border-hover: var(--color-border-hover);
    --#{$name}-color-active: var(--color-active);
    --#{$name}-color-active-bg: var(--color-active-bg);
    --#{$name}-color-active-border: var(--color-active-border);
    --#{$name}-color-active-hover: var(--color-active-hover);
    --#{$name}-color-active-bg-hover: var(--color-active-bg-hover);
    --#{$name}-color-active-border-hover: var(--color-active-border-hover);
    --#{$name}-border-weight: 1px;
  }
}
```

配套的 `color()` mixin（`_mixins.scss:62-141`）定义 7 个语义类 `.default .gray .major .minor .danger .safe .tip`，每个类重写 `--color` 系别名，并用 `color-mix()` 自动派生 hover 态：

```scss
--color-hover: color-mix(in srgb, var(--color) 90%, var(--color-default));
--color-bg-hover: color-mix(in srgb, var(--color-bg) 90%, var(--color-bg-default));
```

`_header.scss:28-72` 是该原则最完整的示范——深色 header 直接把子组件 token 接到自己的 token 上，输入框与按钮自动反色：

```scss
--input-color: var(--header-color);
--input-color-bg: var(--header-color-bg);
--btn-color: var(--header-color);
--btn-color-bg: var(--header-color-bg);
```

### 设计原则 3：尺寸走 T-shirt 档位，而非逐属性微调

`comp-size($name, $width)`（`_mixins.scss:26-60`）为每个组件提供 `tiny / small / normal / large` 四档，一次性重写 gap、font-size、size、line-height：

```scss
&, &.normal {
  --#{$name}-gap: var(--g1);
  --#{$name}-font-size: var(--font-size-5);
  --#{$name}-size: var(--comp-size-3);
  --#{$name}-line-height: var(--line-height-3);
}
&.tiny   { --gap: 0;          --font-size: var(--font-size-6); --size: var(--comp-size-1); }
&.small  { --gap: var(--gxs); --font-size: var(--font-size-5); --size: var(--comp-size-2); }
&.large  { --gap: var(--g1);  --font-size: var(--font-size-4); --size: var(--comp-size-4); --border-weight: 2px; }
```

组件本体只消费 token，不含任何硬编码尺寸（`_button.scss:48-59`）：

```scss
font-size: var(--btn-font-size);
height: var(--btn-size);
padding: var(--btn-gap) var(--g2);
border-radius: calc(var(--btn-size) / 2);
box-shadow: inset 0 0 0 var(--btn-border-weight) var(--btn-color-border);
```

### 设计原则 4：响应式改的是"变量的值"，不是"属性的值"

**这是本项目最值得保留的响应式思路。** 媒体查询内不写 `width` / `font-size`，只重新赋值 token，声明本身保持唯一：

```scss
// client/scss/demo.scss:9-43
.page-demo {
  --item-width: 260px;
  --detail-max-width: 60%;

  @media (max-width: $screen-xs-max)                        { --item-width: 260px; }
  @media (min-width: $screen-sm-min) and (max-width: $screen-sm-max) { --item-width: 280px; }
  @media (min-width: $screen-md-min) and (max-width: $screen-md-max) { --item-width: 340px; }
  @media (min-width: $screen-lg-min)                        { --item-width: 360px; }
  @media (orientation: portrait)                            { --detail-max-width: 56%; }
  @media (orientation: landscape)                           { --detail-max-width: 40%; }
}
```

`_grid.scss:4-16` 用同一模式把栅格轨道抽成 token：

```scss
--grid-col-1: repeat(1, minmax(80%, 1fr));
--grid-col-2: repeat(2, minmax(40%, 1fr));
--grid-col-3: repeat(3, minmax(30%, 1fr));
--grid-col-4: repeat(4, minmax(20%, 1fr));

--grid-xs: var(--grid-col-1);
--grid-sm: var(--grid-col-2);
--grid-md: var(--grid-col-3);
--grid-lg: var(--grid-col-4);
--grid-xl: var(--grid-col-5);
```

`_layout.scss:338/477` 同理（`--record-xs/sm/md`、`--market-overview-xs/sm/md/lg`）。

### 设计原则 5：间距与字号是同一套数列的两个投影

`--g*` 的每一档都在注释里声明了它与字号的关系——间距不是随便挑的，是字号的一半或前两项之和（斐波那契式累加）：

```scss
--gxs: 0.125rem;  // half of gs
--g0:  0.25rem;   // half of f7
--g1:  0.5rem;    // half of f5
--g2:  0.75rem;   // half of f3 或 g0 + g1
--g3:  1rem;      // g1 + g2
--g4:  1.75rem;   // g2 + g3
--g5:  2.75rem;   // g3 + g4
--g6:  4.5rem;    // g4 + g5
```

`--comp-size-*` 同样标注了推导过程（黄金比例 1.618）：

```scss
--comp-size-1: 1.75rem;  // f3 (f5 × 1.618)
--comp-size-2: 2rem;     // gxs + f3 + gxs
--comp-size-3: 2.75rem;  // 1.75 + .5 × 2
--comp-size-4: 3.2rem;   // 1.25 × 1.25 + 0.5 × 2
```

---

## 二、基础 Token 完整清单

### 2.1 排版 Typography

| Token | 值 | 说明 |
|---|---|---|
| `--cui-font` | `'Roboto'` | 唯一带厂商前缀的 token |
| `--font-size-1` | `2rem` | 注意：**编号越小字号越大**（倒序） |
| `--font-size-2` | `1.75rem` | |
| `--font-size-3` | `1.5rem` | |
| `--font-size-4` | `1.25rem` | |
| `--font-size-5` | `1rem` | 基准正文 |
| `--font-size-6` | `0.875rem` | |
| `--font-size-7` | `0.75rem` | |
| `--line-height-1` | `1` | |
| `--line-height-2` | `1.25` | `_reset.scss` 全局默认 |
| `--line-height-3` | `1.75` | 组件默认 |
| `--font-weight-regular` | `400` | |
| `--font-weight-medium` | `400` | ⚠ 与 regular 同值 |
| `--font-weight-bold` | `700` | |

根字号在 `_reset.scss:49` 被**硬编码为 `16px`**，未 token 化——这是后续 fluid typography 最关键的一处阻碍。

别名：mixin `f1`…`f7`（`_mixins.scss:484-510`）、工具类 `.h1/.f1` … `.h7/.f7`（`_typograph.scss:5-50`）。

### 2.2 间距 Spacing

原子：`--gxs --g0 --g1 --g2 --g3 --g4 --g5 --g6`（见上）

布局语义层（`_theme.default.scss:193-197`，作用域为 `body`）：

```scss
--section-gap-x: var(--g3);
--section-gap-y: var(--g4);
--panel-gap-x: var(--g2);
--panel-gap-y: var(--g3);
```

`gap-size()` mixin（`_mixins.scss:452-482`）按 `tiny/small/normal/large` 重映射这四个值。

工具类（`_gap.scss`，330 行）：`.m-{x,y,t,b,l,r}-{0,xs,1,2,3,4}` 与 `.p-…` 同构。

### 2.3 圆角 Radius

```scss
--radius-0: 0.25rem;
--radius-1: 0.5rem;   // --comp-border-radius 默认值
--radius-2: 1rem;
--radius-3: 1.5rem;
--radius-4: 2rem;
```

工具类 `.corner-0..3`（`_utilities.scss:51-65`，无 `.corner-4`）。

### 2.4 颜色 Color

**全局通道**

```scss
--color-glb-lightness: 23%;
--color-glb-bg-lightness: 95%;
--color-glb-saturation: 1%;
--color-glb-bg-saturation: 100%;
--color-glb-default-saturation: 100%;
--color-glb-default-lightness: 30%;
```

**语义角色（5 个）** — 每个角色 5 个通道 token + 4 个组装 token

| 角色 | hue | saturation | lightness | l1 |
|---|---|---|---|---|
| major | 165 | 58% | 23% | 99% |
| minor | 169 | 100% | 31% | 99% |
| safe | 179 | `--color-glb-default-saturation` | 25% | 99% |
| danger | 10 | 同上 | 48% | 99% |
| tip | 321 | 同上 | 24% | 99% |

每个角色输出四种形态：`--color-X`、`--color-X-l1`、`--color-X-hsl`（裸三元组，供 `hsla()` 加透明度）、`--color-X-l1-hsl`。

**上下文别名（组件真正读取的层）**

```scss
--color:               var(--color-default);
--color-bg:            var(--color-bg-default);
--color-border:        var(--color-border-default);
--color-hover:         var(--color-default-l1);
--color-bg-hover:      var(--color-bg-default-l1);
--color-l1:            var(--color-default-l1);
--color-bg-l1:         var(--color-bg-default-l1);
--color-active:        var(--color-bg-default);
--color-active-bg:     var(--color-default);
--color-active-border: var(--color-default);
--color-disabled:      var(--color-default-l1);
```

**中性阶** `--color-0..9`（明度 100% → 10%，步长 10%）+ 彩虹阶 `--color-r0..r9`（10 个固定色相）。二者当前均**无消费者**。

**选区**

```scss
--selection-background: color-mix(in srgb, var(--color-major) 40%, var(--color-bg));
--selection-color: var(--color-default);
```

### 2.5 组件尺寸 Component

```scss
--comp-size-1: 1.75rem;
--comp-size-2: 2rem;
--comp-size-3: 2.75rem;
--comp-size-4: 3.2rem;

--comp-height:        var(--comp-size-3);
--comp-font-size:     var(--font-size-5);
--comp-border-radius: var(--radius-1);
--comp-max-width:     auto;
--comp-line-height:   var(--line-height-3);
```

### 2.6 层级 Z-index

体系中**唯一被完整 token 化的维度**（`_reset.scss:52-66`，注意作用域是 `html` 而非 `:root`）：

```scss
--ui-tooltip-index:       1000;
--ui-popover-index:       1050;
--ui-buttongroup-index:   1100;
--ui-pin-index:           1930;
--ui-pin-hover-index:     1940;
--ui-stick-index:         1960;
--ui-header-overlay:      1990;
--ui-header-index:        2000;
--ui-header-list-index:   2010;
--ui-datepicker-index:    2100;
--ui-gautocomplete-index: 3000;
--ui-dropdown-index:      3100;
--ui-modal-overlay:      10000;
--ui-modal-index:        10010;
```

### 2.7 动效 Motion

仅一个：`--animation-time: 0.1s`，且**只被 `_button.scss:14` 一处消费**。其余 transition 全为魔法数字（0.15s / 0.2s / 0.3s / 0.5s / 1s 散落 20+ 处）。无缓动 token，无 `prefers-reduced-motion`。

`_section-animation.scss` 已使用现代 `animation-timeline: scroll() / view()` 滚动驱动动画（8 处），但同样无 token。

### 2.8 断点 Breakpoints

`:root` 现镜像了一份 CSS 变量（`--screen-xs-min` … `--screen-lg-max`），供 `var()` 与 JS 读取；`@media` 条件仍必须使用下面的编译期 `$` 变量，**两处需手工同步**。



```scss
// client/scss/_var.screen.scss
$screen-xs-min: 320px;   // phone
$screen-sm-min: 640px;   // tablet
$screen-md-min: 960px;   // desktop
$screen-lg-min: 1600px;  // wide desktop
$screen-xl-min: 2561px;  // HD+

$screen-xs-max: $screen-sm-min - 1;   // 639px
$screen-sm-max: $screen-md-min - 1;   // 959px
$screen-md-max: $screen-lg-min - 1;   // 1599px
$screen-lg-max: $screen-xl-min - 1;   // 2560px
```

策略为**区间型（min + max 成对）**，非移动优先级联。规范写法（`_grid.scss:23-41`）：

```scss
@media (max-width: $screen-xs-max)                                  { … }
@media (min-width: $screen-sm-min) and (max-width: $screen-sm-max)  { … }
@media (min-width: $screen-md-min) and (max-width: $screen-md-max)  { … }
@media (min-width: $screen-lg-min) and (max-width: $screen-lg-max)  { … }
@media (min-width: $screen-xl-min)                                  { … }
```

区间型的代价：五个分支必须**全部**声明，漏一个就是"该宽度下无值"，而移动优先只需声明变化点。这是当前样板代码量的主要来源。

### 2.9 加载顺序

```
index.scss
├── _theme.default.scss        ← 全部 token 定义
└── base.scss
    ├── _font.roboto.scss      字体
    ├── _icon.scss             图标
    ├── _reset.scss            重置 + z-index token
    ├── _responsive.scss       .hidden-xs/sm/md/lg
    ├── _text.scss / _typograph.scss / _color.scss / _gap.scss / _utilities.scss
    ├── _grid.scss / _flex.scss
    └── 30+ 组件 partial
```

无 `@layer`；级联通过 `#body` id 选择器前缀（`_typograph.scss` / `_color.scss` / `_gap.scss` / `_utilities.scss`）强行提权。

---

## 三、现存缺口（对响应式方案的直接影响）

### 3.1 阻碍"普遍适应性"的四个结构性缺口

1. **零 fluid typography。** 整个 SCSS 树 `clamp()` 出现 **0 次**。字号在 320px 与 2561px 完全相同。全部依赖固定 `rem` + 硬编码 `16px` 根字号，320px 手机与 4K 显示器共用同一套字号。
2. ~~**断点无 CSS 变量对应物。**~~ **已修复** —— `:root` 现镜像了全部 9 个断点为 `--screen-*`，`var()` 与 `getComputedStyle()` 均可读。原先 4 处静默失效的引用（`_popover` `_layout` `_dialog` `_modal`）现已生效。**注意 `@media` 仍只能用编译期 `$screen-*`**，两者需手工保持同步。
3. **零容器查询。** 无 `@container` / `container-type`。所有响应式基于视口宽度，同一组件放进侧栏和主区无法自适应。
4. **间距不随断点缩放。** `--g*` 全局恒定；只有 `gap-size()` 的手动档位可换，无视口维度的自动收缩。

### 3.2 缺失的 token 类别

| 类别 | 现状 |
|---|---|
| 阴影 | 无 `--shadow-*`。3 个 mixin + 10 处硬编码 `box-shadow` |
| 动效 | 仅 `--animation-time`（用 1 次）。无 duration 阶、无 easing |
| 字距 | 无 token，全项目仅 `_autoscroller.scss:69` 一处 `0.08em` |
| 边框 | 无宽度/样式 token，仅组件级 `--<comp>-border-weight` |
| 透明度 / 模糊 | 无 |
| 焦点环 | 无。`_reset.scss:118` 对所有表单控件 `outline: none` 且无替代 —— 无障碍缺陷 |

### 3.3 已确认的 Bug —— 已全部修复

修复详情见文末「附二：修复记录」。

| 位置 | 问题 | 状态 |
|---|---|---|
| `_theme.default.scss` | `--color-default-lightness: 750%` —— 应为 `75%` | ✅ |
| `_theme.default.scss` | 暗色模式重写 `--color-major-default-lightness`，但 `--color-major-lightness` 的别名已在 `:root` 解析完毕，**major/minor/safe/danger/tip 五个语义色在暗色下实际不变暗** | ✅ |
| `_button.scss` `_input.scss` 等 7 处 | 消费 `var(--<comp>-font-weight)`，但 `comp-size()` 从不产出该 token | ✅ |
| `_typograph.scss` `_mixins.scss` | 消费 `--font-weight-light`，从未定义 → `.text-light` 为空操作 | ✅ |
| `_font.roboto.scss` | `font-weight: 700` 指向 `Roboto-Regular.woff2`，浏览器视其为真粗体并**跳过合成** → 粗体与常规完全同形 | ✅ |
| `_layout.scss` ×4 | 消费未定义的 `var(--color-f)` | ✅ |
| `_layout.scss` ×3 | 消费未定义的 `var(--color-link-default)` | ✅ |
| `_header.scss` | `var(--head--color-active-border)` —— 双横线拼写错误 | ✅ |
| `_popover.scss` `_layout.scss` `_dialog.scss` `_modal.scss` | `var(--screen-xs-min/max)` 静默失效 | ✅ |
| `_layout.scss` `_dropdownmenu.scss` `_tooltip.scss` `_animation.scss` 共 7 处 | `content: var(--icon-*)` —— 图标是 SCSS `$icon-*`，不是自定义属性，图标完全不显示 | ✅ |
| `_slider.scss` `_shifter.scss` | 消费未定义的 `--line-height-normal` | ✅ |
| `_autoscroller.scss` ×4 | 消费臆造 token `--g0-5` `--g1-5` `--color-bg-l2` `--color-fg-2` `--color-text-2` | ✅ |
| `_sharelink.scss` | `var(--radius, …)` 无此 token；且 `var(--g1, 0.25rem)` 回退值与 `--g1`(0.5rem) 不符 | ✅ |
| `_theme.default.scss` vs `_mixins.scss` | `--section-gap-y` 默认值不一致（`--g4` / `--g5`） | ✅ |

### 3.4 一致性问题

- **Token 分散在三个根作用域且无规则**：`:root`（原始通道）、`html`（z-index）、`body`（组装色 + 间距 + 组件尺寸）。后果：`::backdrop`、`html` 滚动条等 `<body>` 外的上下文**取不到任何颜色 token**。（注意：语义色的 `-lightness` 别名**必须**留在 `body`，见 3.3 的暗色 bug；统一作用域时要把 `-default-` 源一起搬，不能只搬别名。）
- `_goldenratio.scss` 用硬编码 `992px / 640px / 639px`，与 `_var.screen.scss` 无关。
- `--logo` 在 SCSS 指向 `../assets/img/`，在 JS 主题指向 `/assets/images/` —— 两套目录。
- 死 token：`--color-r0..r9`（20 条声明，0 消费）、`--color-0..9`（20 条，0 消费）、`--line-height-1`、`--comp-font-size`、`--comp-max-width`、`--color-disabled`、`--color-glb-bg-l1-lightness`、`--color-glb-l1-lightness`。
- `.csscomb.json` 要求 4 空格缩进 + 双引号，实际代码为 tab + 单引号 —— 配置已失效。

---

## 四、结论

**本体系已经具备的：** 一条纪律良好的三层值传递链；HSL 通道化让换肤成本降到几个数字；`comp-color()` / `comp-size()` 保证组件契约统一；以及最关键的——**"媒体查询只改变量、不改声明"** 这一响应式范式，已经在 `_grid.scss`、`demo.scss`、`_layout.scss` 中反复验证。

**尚未打通的：** 这条链在"尺寸随视口连续变化"这一维度上是断的。字号、间距、根字号三者全部是断点无关的常量，响应式只体现在栅格列数与个别宽度上。要达到"在不同设备上都有不错的显示效果"，缺的不是更多断点，而是：

1. 把 `--font-size-*` 与 `--g*` 从常量升级为 `clamp()` 表达式（或让它们跟随一个流式根字号）；
2. 为断点补一层 CSS 变量镜像，顺手修掉 4 处静默失效的 `var(--screen-*)`；
3. 对"同一组件在不同容器"的场景引入 `@container`，替代部分视口断点；
4. 统一 token 作用域到 `:root`，让 `::backdrop` 等上下文可用。

前三条都可以在**不改动任何组件 SCSS**的前提下落地——因为组件从不直接读字号与间距原子，只读 `--<comp>-font-size` 与 `--<comp>-gap`。这正是当前架构留下的最大余地。

---

## 附：文件索引

| 文件 | 行数 | 职责 |
|---|---|---|
| `client/scss/_theme.default.scss` | 263 | 全部 token 权威定义 + 暗色覆盖 |
| `client/scss/_mixins.scss` | 500+ | `comp-color()` `comp-size()` `color()` `gap-size()` `f1..f7` |
| `client/scss/_var.screen.scss` | 32 | 断点 SCSS 变量 |
| `client/scss/_reset.scss` | 120+ | 重置 + z-index token + `color-scheme` |
| `client/scss/_grid.scss` | 227 | 栅格 token + `.grid-{xs..xl}-{1..6}` 矩阵 |
| `client/scss/_gap.scss` | 330 | 间距工具类 |
| `client/scss/_color.scss` | 117 | 颜色工具类 |
| `client/scss/_typograph.scss` | 60+ | 排版工具类 |
| `client/scss/_responsive.scss` | 30 | 显隐工具类 |
| `data/comps/theme*.js` | 17-25 | 运行期主题 token（4 套） |
| `server/ejs/comp_theme.js` | 48 | 主题内联 CSS 生成 |

---

## 附二：修复记录（2026-08-29）

共改动 13 个 SCSS 文件，**未改动任何组件的样式声明**——全部是 token 定义与引用修正。

### 1. 暗色语义色不生效（最严重）

根因是 CSS 自定义属性的一条规则：`var()` 在自定义属性中的替换发生在**声明它的那个元素**上、级联结束之后。原代码把别名放在 `:root`：

```scss
:root { --color-major-lightness: var(--color-major-default-lightness); }  /* 在 html 上就冻结成亮色 23% */
body.theme-dark { --color-major-default-lightness: 50%; }                 /* 改的是 body，已经晚了 */
```

`body` 继承到的是 html 算好的 `23%`，暗色覆盖对 major/minor/safe/danger/tip **全部无效**。

修复：把 10 条 `--color-<role>-lightness` / `-lightness-l1` 别名从 `:root` 移到 `body`，与 `-default-` 源同处一个元素，级联后别名才会重新解析。`:root` 与 `body` 两处都留了注释说明原因。

模拟解析验证（`body.theme-dark`）：

| token | 修复前 | 修复后 |
|---|---|---|
| `--color-major` | `hsl(165, 58%, 23%)` | `hsl(165, 58%, 50%)` |
| `--color-minor` | `hsl(169, 100%, 31%)` | `hsl(169, 100%, 50%)` |
| `--color-safe` | `hsl(179, 100%, 25%)` | `hsl(179, 100%, 50%)` |
| `--color-danger` | `hsl(10, 100%, 48%)` | `hsl(10, 100%, 50%)` |
| `--color-tip` | `hsl(321, 100%, 24%)` | `hsl(321, 100%, 50%)` |
| `--color-major-l1` | `hsl(165, 58%, 99%)` | `hsl(165, 58%, 10%)` |

亮色模式取值逐一比对，无变化。`data/comps/theme*.js` 的运行期覆盖层级不受影响（内联 `<style>` 位于外链 CSS 之后，同特异性下仍然胜出）。

### 2. 新增的 token

```scss
--font-weight-light: 300;      /* 原先未定义，.text-light 是空操作 */
--font-weight-medium: 500;     /* 原为 400，与 regular 同值 */
--screen-xs-min … --screen-lg-max;   /* 9 个断点的 CSS 变量镜像 */
```

`comp-size()` 的 `.normal` 分支补上 `--#{$name}-font-weight: var(--font-weight-regular)`，一次修好 7 个组件（btn / input / checkbox / radio / selectbox / tab / group-btn）读取未定义 font-weight 的问题。

### 3. 引用修正

| 原引用 | 改为 | 处数 |
|---|---|---|
| `var(--color-f)` | `var(--color-bg-default)` | 4 |
| `var(--color-link-default)` | `var(--color-link)` | 3 |
| `var(--head--color-active-border)` | `var(--header-color-active-border)` | 1 |
| `content: var(--icon-*)` | `content: $icon-*` | 7 |
| `var(--line-height-normal)` | `var(--line-height-2)` | 2 |
| `var(--g1-5, var(--g2))` / `var(--g0-5, var(--g1))` | `var(--g2)` / `var(--g1)` | 2 |
| `var(--color-text-2, var(--color-fg-2))` | `var(--color-l1)` | 1 |
| `var(--color-border, var(--color-bg-l2))` | `var(--color-border)` | 1 |
| `var(--radius, 0.25rem)` | `var(--radius-0)` | 1 |
| `var(--g1, 0.25rem)` / `var(--g2, 0.5rem)`（回退值与真实 token 不符） | `var(--g1)` / `var(--g2)` | 4 |
| `var(--input-size, 2.5rem)` | `var(--input-size)` | 1 |

那 7 处图标是隐性最广的一个：`$icon-*` 是 SCSS 编译期变量，写成 `var(--icon-*)` 后 `content` 直接失效，分页箭头、下拉箭头、tooltip 的 info/warning/error 图标、loading 转圈图标**全部不显示**。注意要写 `content: $icon-x`（保留引号，产出 `"\f104"`），不能写 `content: #{$icon-x}`（插值会剥掉引号，产出非法标识符）。

### 4. 字体

删掉了指向 `Roboto-Regular.woff2` 的 700 字重 `@font-face`。声明一个「真」粗体会让浏览器跳过合成、直接用常规字形，粗体因此与常规完全同形；留空 700 则由引擎从 400 合成假粗体。仓库里确实没有 `Roboto-Bold.woff2`（只有 Regular 与 Thin），已在文件内留注释说明补字体文件时该怎么改回。

### 5. 一致性

`--section-gap-y` 的 body 级默认值 `--g4` → `--g5`，与 `gap-size()` 的 `.normal` 分支对齐（`.section` `.panel` `.grid` `.flex` 都会 include 它，`.normal` 才是实际生效值）。

### 验证

- 5 个 SCSS 入口（`index` `base` `demo` `demo.article` `animation`）全部编译通过。
- 全量 token 审计：**未定义却被消费的自定义属性从 27 个降到 0 个**。
- 自定义属性解析模拟：亮色 / 暗色两种状态下 `body` 上均无 `INVALID` 解析结果。

> 未处理项：§3.2 缺失的 token 类别（阴影 / 动效 / 字距 / 焦点环）、§3.4 的死 token 清理、`_goldenratio.scss` 的硬编码断点、`theme-pink.js`/`theme-yellow.js` 里两个无处定义的 `--color-glb-*-l1-lightness`。这些是设计决策而非 bug，留待流式 token 方案一并处理。
