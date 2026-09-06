# 随星录

STELLAGRAM OF WHIMSIES

**顶部标记：** ENGRAM / INITIAL CONDITIONS
**版本：** 0.5
**项目 ID：** stellagram-default-v4
**更新时间：** 2026-09-05T21:45:35.761Z

## 项目说明

你在一段无法追溯来源的日志里醒来。世界仍在运行，历史仍在向前；只有你的记录多出了一行本不该存在的校验信息。

桌上留着一份空白档案，以及 **50 枚铟锭**。每一次选择，都将在下一页留下痕迹。

## 基础规则

初始持有 **50 IN**。正值增加铟锭，负值消耗铟锭；完成构筑时，余额不得低于 0。

世界状态、起始权限与存在分辨率各选一项；四项基础素质各选一档。自选 Tag 与路线可以多选，但应满足各自的前置与互斥条件。

**代币名称：** 铟锭
**单位：** IN
**初始余额：** 50
**严格预算：** 关闭：允许暂时透支，结算仍报错
**图件显示设置：** moduleNumbers: false；moduleTitles: true；moduleSubtitles: true；selectionHints: true；cardNumbers: false；attributeTitles: true；pageLabels: true
**标题方式：** stellagram

### 创作备注（不向试玩者显示）

铟锭 / IN（Ingot）。代币名称、初始持有量与各项变化均可在项目中修改。
H 级统称象胥 / Haltija；四大机关分支后置展示。

---

## 01 · 世界状态

**ID：** world
**类型：** choices
**副标题：** WORLD STATE
**选择方式：** single
**选择数量：** 至少 1；不设数量上限（单选仍限一项）
**可见性：** public

决定这条潜图的大尺度环境。
**排版开关：** moduleNumbers: true；moduleTitles: true；moduleSubtitles: true；selectionHints: true；cardNumbers: false；attributeTitles: true

#### [ ] 潮汐失稳

**ID：** world-collapse
**副标题：** SYSTEMIC COLLAPSE
**资源变化：** +50 IN
**状态：** 已完成
**可见性：** 公开

海侵、能源与地缘冲突同时恶化，泛南秩序难以维持。大量系统性风险叠加。

#### [ ] 灰色黎明

**ID：** world-dawn
**副标题：** GREY DAWN
**资源变化：** +25 IN
**状态：** 已完成
**可见性：** 公开

独立战争与权力重组尚未结束。资源紧张，组织边界模糊，但新的秩序正在形成。

#### [ ] 基准潜图 · 2039

**ID：** world-2039
**副标题：** REFERENCE HYPOGRAM
**资源变化：** 0 IN
**状态：** 已完成
**可见性：** 公开

以主体故事时期为参考：泛南联邦初定，元素天演仍以隐蔽方式运行。

#### [ ] 极地秩序

**ID：** world-stable
**副标题：** POLAR STABILITY
**资源变化：** -25 IN
**状态：** 已完成
**可见性：** 公开

联邦制度与国际关系相对稳定，基础设施恢复，公开冲突显著减少。

#### [ ] 星海前夜

**ID：** world-stars
**副标题：** PRELUDE TO THE STARS
**资源变化：** -50 IN
**状态：** 已完成
**可见性：** 公开

深空工程与跨世界研究进入常态，人类拥有更高的总体安全余量。

---

## 02 · 身份与权限

**ID：** status
**类型：** choices
**副标题：** STATUS / ACCESS
**选择方式：** single
**选择数量：** 至少 1；不设数量上限（单选仍限一项）
**可见性：** public

描述你在社会系统中的起始便利度，不等同于图录分辨率。
**排版开关：** moduleNumbers: true；moduleTitles: true；moduleSubtitles: true；selectionHints: true；cardNumbers: false；attributeTitles: true

#### [ ] 无籍之人

**ID：** status-none
**副标题：** UNREGISTERED
**资源变化：** +40 IN
**状态：** 已完成
**可见性：** 公开

缺少稳定身份与制度保护，很多基础服务都需要绕行灰色渠道。

#### [ ] 外围居民

**ID：** status-edge
**副标题：** PERIPHERAL
**资源变化：** +20 IN
**状态：** 已完成
**可见性：** 公开

合法存在，但资源、交通与信息权限都很有限。

#### [ ] 普通公民

**ID：** status-citizen
**副标题：** CITIZEN
**资源变化：** 0 IN
**状态：** 已完成
**可见性：** 公开

拥有正常身份、教育与就业路径，没有额外的制度性特权。

#### [ ] 专业机构成员

**ID：** status-pro
**副标题：** INSTITUTIONAL
**资源变化：** -20 IN
**状态：** 已完成
**可见性：** 公开

你已经进入大学、研究机构、工业系统或同等级专业网络。

#### [ ] 高位权限持有者

**ID：** status-high
**副标题：** HIGH ACCESS
**资源变化：** -40 IN
**状态：** 已完成
**可见性：** 公开

能够接触战略资源、封闭档案或高等级行政系统；相应地也更难置身事外。

---

## 03 · 存在分辨率

**ID：** resolution
**类型：** choices
**副标题：** RESOLUTION
**选择方式：** single
**选择数量：** 至少 1；不设数量上限（单选仍限一项）
**可见性：** public

这是系统如何记录你的层级，不等同于职业或能力值。
**排版开关：** moduleNumbers: true；moduleTitles: true；moduleSubtitles: true；selectionHints: true；cardNumbers: false；attributeTitles: true

#### [ ] P · 常量

**ID：** res-p
**副标题：** P-ZOMBIE / CONSTANT
**资源变化：** +35 IN
**状态：** 已完成
**可见性：** 公开

系统把你视作维持世界连续性的常量。作为玩家选择这一项，本身就构成一个值得追问的悖论。

#### [ ] D · 哑变量

**ID：** res-d
**副标题：** DUMMY VARIABLE
**资源变化：** +15 IN
**状态：** 已完成
**可见性：** 公开

你与关键元变量高度绑定，在重大事件里有稳定权重，但自主跨图能力有限。

#### [ ] M · 元变量

**ID：** res-m
**副标题：** META-VARIABLE
**资源变化：** 0 IN
**状态：** 已完成
**可见性：** 公开

标准觉醒变量：拥有完整的个体一致性，并可能在不同图录之间留下可追踪记录。

#### [ ] H · 象胥

**ID：** res-h
**副标题：** HALTIJA
**资源变化：** -70 IN
**状态：** 已完成
**可见性：** 公开
**标签：** H

H 级象胥。你已具备介入图录运行的资格，具体职能取决于你所接触的机关。

---

## 04 · 基础素质

**ID：** attributes
**类型：** attributes
**副标题：** ATTRIBUTES
**选择方式：** 每行单选
**选择数量：** 至少 0；不设数量上限（单选仍限一项）
**可见性：** public


**排版开关：** moduleNumbers: true；moduleTitles: true；moduleSubtitles: true；selectionHints: true；cardNumbers: false；attributeTitles: true

### 体格

身体条件与长期训练水平。
**必选：** 是

#### [ ] 羸弱

**ID：** body-1
**副标题：** FRAGILE
**资源变化：** +30 IN
**状态：** 已完成
**可见性：** 公开

长期高强度行动对你并不友好。

#### [ ] 略有欠缺

**ID：** body-2
**副标题：** BELOW AVG.
**资源变化：** +10 IN
**状态：** 已完成
**可见性：** 公开

日常无碍，连续奔跑、负重或低温环境会很吃力。

#### [ ] 普通

**ID：** body-3
**副标题：** NORMAL
**资源变化：** 0 IN
**状态：** 已完成
**可见性：** 公开

一个正常健康人的基线。

#### [ ] 训练有素

**ID：** body-4
**副标题：** TRAINED
**资源变化：** -10 IN
**状态：** 已完成
**可见性：** 公开

拥有稳定运动习惯或专业体能训练。

#### [ ] 人类极限

**ID：** body-5
**副标题：** PEAK HUMAN
**资源变化：** -30 IN
**状态：** 已完成
**可见性：** 公开

在不引入超自然强化的前提下逼近人类体能上限。

### 学识

科研、工程与专业训练的综合基线。
**必选：** 是

#### [ ] 门外汉

**ID：** know-1
**副标题：** OUTSIDER
**资源变化：** +30 IN
**状态：** 已完成
**可见性：** 公开

面对专业系统时需要从头学习。

#### [ ] 基础薄弱

**ID：** know-2
**副标题：** BASIC
**资源变化：** +10 IN
**状态：** 已完成
**可见性：** 公开

知道概念，但很难独立处理复杂问题。

#### [ ] 专业训练

**ID：** know-3
**副标题：** TRAINED
**资源变化：** 0 IN
**状态：** 已完成
**可见性：** 公开

完成系统性的高等教育或同等级训练。

#### [ ] 领域专家

**ID：** know-4
**副标题：** SPECIALIST
**资源变化：** -10 IN
**状态：** 已完成
**可见性：** 公开

能独立承担高难度专业工作。

#### [ ] 跨域怪物

**ID：** know-5
**副标题：** POLYMATH
**资源变化：** -30 IN
**状态：** 已完成
**可见性：** 公开

在多个高门槛领域都保持异常强的学习与迁移能力。

### 应变

面对未知、冲突与系统故障时的临场表现。
**必选：** 是

#### [ ] 慢半拍

**ID：** adapt-1
**副标题：** LAG
**资源变化：** +30 IN
**状态：** 已完成
**可见性：** 公开

意外往往先发生，你再开始理解发生了什么。

#### [ ] 稍显生涩

**ID：** adapt-2
**副标题：** HESITANT
**资源变化：** +10 IN
**状态：** 已完成
**可见性：** 公开

能处理小问题，但复杂危机容易打乱节奏。

#### [ ] 临场正常

**ID：** adapt-3
**副标题：** NORMAL
**资源变化：** 0 IN
**状态：** 已完成
**可见性：** 公开

普通人的合理反应速度。

#### [ ] 反应敏锐

**ID：** adapt-4
**副标题：** SHARP
**资源变化：** -10 IN
**状态：** 已完成
**可见性：** 公开

能很快识别优先级并执行。

#### [ ] 危机处理器

**ID：** adapt-5
**副标题：** INCIDENT CORE
**资源变化：** -30 IN
**状态：** 已完成
**可见性：** 公开

越混乱的局面，你反而越接近自己的最佳状态。

### 运势

把无法归因于能力与信息的剩余部分交给概率。
**必选：** 是

#### [ ] 厄运缠身

**ID：** luck-1
**副标题：** CURSED
**资源变化：** +30 IN
**状态：** 已完成
**可见性：** 公开

低概率事故似乎总能找到你。

#### [ ] 偏衰

**ID：** luck-2
**副标题：** UNLUCKY
**资源变化：** +10 IN
**状态：** 已完成
**可见性：** 公开

统计结果总比预期稍差一点。

#### [ ] 概率学正常

**ID：** luck-3
**副标题：** EXPECTED
**资源变化：** 0 IN
**状态：** 已完成
**可见性：** 公开

大数定律终于愿意正常工作。

#### [ ] 好运连连

**ID：** luck-4
**副标题：** FORTUNATE
**资源变化：** -10 IN
**状态：** 已完成
**可见性：** 公开

关键时刻常能撞上相对有利的结果。

#### [ ] 观测者偏爱？

**ID：** luck-5
**副标题：** OBSERVER BIAS?
**资源变化：** -30 IN
**状态：** 已完成
**可见性：** 公开

巧合已经多到值得怀疑是否有人在后台替你重抽。

---

## 05 · 核心设定

**ID：** canon
**类型：** choices
**副标题：** CANON TAGS
**选择方式：** multi
**选择数量：** 至少 0；不设数量上限（单选仍限一项）
**可见性：** public

直接改变你与元素天演、图录机制或世界底层规则的关系。
**排版开关：** moduleNumbers: false；moduleTitles: false；moduleSubtitles: false；selectionHints: false；cardNumbers: false；attributeTitles: true

### 展示标题行：自选 Tag
**副标题：** MARKS LEFT ON THE WORLD
**对齐：** center
**插入位置：** start
**字号：** 34

#### [ ] 空席元素使

**ID：** tag-element
**副标题：** VACANT ELEMENT
**资源变化：** -30 IN
**状态：** 已完成
**可见性：** 公开

你取得一个当前未被占用的元素席位。具体元素与能力仍需另行填写。

#### [ ] 元素信物

**ID：** tag-artifact
**副标题：** ELEMENT ARTIFACT
**资源变化：** -15 IN
**状态：** 已完成
**可见性：** 公开

你持有一个可被元素体系识别的信物。它的归属、强化幅度与代价由后续设定决定。

#### [ ] 感应过强

**ID：** tag-sense
**副标题：** OVER-SENSING
**资源变化：** +10 IN
**状态：** 已完成
**可见性：** 公开

你更容易发现相近元素的存在，同时也更难把自己从别人的感应中隐藏。

#### [ ] 锚点异常损耗

**ID：** tag-anchor
**副标题：** ANCHOR DRAIN
**资源变化：** +25 IN
**状态：** 已完成
**可见性：** 公开

你的高强度异常行为会更明显地反映到锚点负荷上。

#### [ ] 档案重影

**ID：** tag-record
**副标题：** DOUBLE RECORD
**资源变化：** +20 IN
**状态：** 已完成
**可见性：** 公开

同一套系统里出现了两份都能通过校验的个人档案。没有人知道哪份才是“先来的”。

#### [ ] 世界边缘既视感

**ID：** tag-edge
**副标题：** EDGE DÉJÀ VU
**资源变化：** +10 IN
**状态：** 已完成
**可见性：** 公开

你偶尔会看见渲染错误、重复街景或不该出现的系统式提示。

---

## 06 · 其他设定

**ID：** worldtags
**类型：** choices
**副标题：** WORLD TAGS
**选择方式：** multi
**选择数量：** 至少 0；不设数量上限（单选仍限一项）
**可见性：** public

改变社会与历史背景的宏观开关。
**排版开关：** moduleNumbers: true；moduleTitles: true；moduleSubtitles: true；selectionHints: true；cardNumbers: false；attributeTitles: true

#### [ ] 天演公开化

**ID：** wt-public
**副标题：** ELEMENTS EXPOSED
**资源变化：** +30 IN
**状态：** 已完成
**可见性：** 公开

元素使不再只是秘密档案，各组织开始公开争夺与监管。

#### [ ] 南极封锁

**ID：** wt-lockdown
**副标题：** POLAR LOCKDOWN
**资源变化：** +20 IN
**状态：** 已完成
**可见性：** 公开

出入境、通讯与物流受到长期限制。

#### [ ] 模世界普及

**ID：** wt-bios
**副标题：** BIOS EVERYWHERE
**资源变化：** -20 IN
**状态：** 已完成
**可见性：** 公开

意识上传与模世界服务已经进入普通人的生活。

#### [ ] 大远征提前

**ID：** wt-expedition
**副标题：** EARLY EXPEDITION
**资源变化：** -15 IN
**状态：** 已完成
**可见性：** 公开

深空航行计划更早获得资源与政治优先级。

#### [ ] 独居石供应稳定

**ID：** wt-monazite
**副标题：** MONAZITE STABLE
**资源变化：** -15 IN
**状态：** 已完成
**可见性：** 公开

能源体系获得更高安全余量，社会波动随之下降。

#### [ ] 异图干涉增加

**ID：** wt-para
**副标题：** PARAGRAM BLEED
**资源变化：** +25 IN
**状态：** 已完成
**可见性：** 公开

平行实例之间的痕迹更频繁地泄漏到当前世界。

---

## 07 · 特殊设定

**ID：** personal
**类型：** choices
**副标题：** PERSONAL TAGS
**选择方式：** multi
**选择数量：** 至少 0；不设数量上限（单选仍限一项）
**可见性：** public

个人身份、组织关系与无法归入基础参数的特殊状态。
**排版开关：** moduleNumbers: true；moduleTitles: true；moduleSubtitles: true；selectionHints: true；cardNumbers: false；attributeTitles: true

#### [ ] CUA 关系

**ID：** pt-cua
**副标题：** CONTINENTAL UNIVERSITY
**资源变化：** 0 IN
**状态：** 已完成
**可见性：** 公开

你与南极洲立大学存在稳定的学习、研究或工作关系。

#### [ ] LUACL 知道你的名字

**ID：** pt-luacl
**副标题：** LAWRENCE D'URVILLE
**资源变化：** +20 IN
**状态：** 已完成
**可见性：** 公开

你能更容易接触核心科研资源；相应地，核心科研资源也更容易接触你。

#### [ ] WUI 工业网络

**ID：** pt-wui
**副标题：** WEDDELL UNITED
**资源变化：** +5 IN
**状态：** 已完成
**可见性：** 公开

你拥有稳定的工业系统与企业渠道。

#### [ ] 冰原同盟会网络

**ID：** pt-tia
**副标题：** ICEFIELD ALLIANCE
**资源变化：** +10 IN
**状态：** 已完成
**可见性：** 公开

你能使用一部分底层社会的安全屋、运输与消息渠道。

#### [ ] PASC 高层关系

**ID：** pt-pasc
**副标题：** SCIENCE COUNCIL
**资源变化：** -35 IN
**状态：** 已完成
**可见性：** 公开

你能够直接触及泛南权力中心，但每个请求也会留下更深的记录。

#### [ ] Apëiron 接口

**ID：** pt-apeiron
**副标题：** APEIRON
**资源变化：** -20 IN
**状态：** 已完成
**可见性：** 公开

你获得一条来自天平论体系的高权限技术接口。它的善意程度暂不保证。

#### [ ] Juno 看见你了

**ID：** pt-juno
**副标题：** JUNO SAW YOU
**资源变化：** 0 IN
**状态：** 已完成
**可见性：** 公开

某次查询结束后，后台留下了一条无法复现的访问记录。她目前什么也没有做。

#### [ ] 海侵遗民

**ID：** pt-refugee
**副标题：** DISPLACED
**资源变化：** +10 IN
**状态：** 已完成
**可见性：** 公开

你的旧居或故乡已经因海侵而失去，身份与家庭网络因此发生长期断裂。

---

## 08 · 大型路线

**ID：** scenarios
**类型：** scenario
**副标题：** SCENARIOS
**选择方式：** multi
**选择数量：** 至少 0；不设数量上限（单选仍限一项）
**可见性：** public


**排版开关：** moduleNumbers: true；moduleTitles: true；moduleSubtitles: true；selectionHints: true；cardNumbers: false；attributeTitles: true

#### [ ] 灰色黎明：余波

**ID：** sc-grey
**副标题：** GREY DAWN / AFTERMATH
**资源变化：** +25 IN
**状态：** 已完成
**可见性：** 公开
**标签：** ROUTE

你被卷入泛南政权建立前后的高风险过渡期。胜利并不会自动带来秩序。

**目标：** 在独立战争余波与权力重组中维持自己的生存与立场。

**结果：** 由你的选择决定进入联邦、离开南极，或转入其他组织路线。

#### [ ] 元素天演：激活

**ID：** sc-evolve
**副标题：** ELEMENTAL EXPERIMENT
**资源变化：** +35 IN
**状态：** 已完成
**可见性：** 公开
**标签：** ROUTE

筛选程序进入高活跃状态。原本可以互相回避的元素使开始被同一套机制推向交汇点。

**目标：** 在不被筛选机制彻底定义的情况下找到自己的行动方式。

**结果：** 可能解锁更高等级的元素关系、管理员线索或异图信息。

#### [ ] CHECKSUM MISMATCH

**ID：** sc-check
**副标题：** FILE / IDENTITY ERROR
**资源变化：** +50 IN
**状态：** 已完成
**可见性：** 公开
**标签：** ROUTE

陵墓后台认为你“既存在，又不应当存在”。从这一刻起，身份问题会变成一条真正的剧情主线。

**目标：** 查清发生冲突的是记忆、身份、世界线，还是整个图录层级。

**结果：** 可能打开异图、间图或管理权限相关路线。

---

## 09 · 象胥分岔

**ID：** haltija
**类型：** choices
**副标题：** HALTIJA / FOUR APPARATUSES
**选择方式：** single
**选择数量：** 至少 1；不设数量上限（单选仍限一项）
**可见性：** gated

四种职能均属于 H 级，彼此没有行政上下级关系。
**排版开关：** moduleNumbers: true；moduleTitles: true；moduleSubtitles: true；selectionHints: true；cardNumbers: false；attributeTitles: true
**解锁条件：** H · 象胥 [res-h]
**解锁模式：** all

#### [ ] 墓守

**ID：** h-maus
**副标题：** MAUSOLEUM
**资源变化：** 0 IN
**状态：** 已完成
**可见性：** 公开
**标签：** H

对应陵墓：负责向潜图方向的封存、运行与管理。

#### [ ] 庭师

**ID：** h-para
**副标题：** PARADEISOS
**资源变化：** 0 IN
**状态：** 已完成
**可见性：** 公开
**标签：** H

对应悬苑：负责向上位层级的读取、解算与实体化。

#### [ ] 镜匠

**ID：** h-kale
**副标题：** KALEIDOSCOPE
**资源变化：** 0 IN
**状态：** 已完成
**可见性：** 公开
**标签：** H

对应万华镜：负责异图之间的折射、观测与连接。

#### [ ] 艄公

**ID：** h-sarc
**副标题：** SARCOPHAGUS
**资源变化：** 0 IN
**状态：** 已完成
**可见性：** 公开
**标签：** H

对应石棺：负责间图中的潜航、承载与意识保护。

---

## 10 · 构筑笔记

**ID：** notes
**类型：** text
**副标题：** FIELD NOTES
**选择方式：** single
**选择数量：** 至少 0；不设数量上限（单选仍限一项）
**可见性：** public


**排版开关：** moduleNumbers: true；moduleTitles: true；moduleSubtitles: true；selectionHints: true；cardNumbers: false；attributeTitles: true

在这里写下你的出生地、具体元素、组织关系，以及仍未履行的约定。
**为这次开局留下记录：** （未填写）

---

## 当前试玩构筑

**剩余资源：** 50 IN


### 构筑校验

- [error] “世界状态”至少选择 1 项。
- [error] “身份与权限”至少选择 1 项。
- [error] “存在分辨率”至少选择 1 项。
- [error] “基础素质 / 体格”尚未选择。
- [error] “基础素质 / 学识”尚未选择。
- [error] “基础素质 / 应变”尚未选择。
- [error] “基础素质 / 运势”尚未选择。

## 编辑状态

**模块数：** 10
**卡片数：** 61
**未定价卡片：** 0
**草稿卡片：** 0

### 图件表层文字

**initial：** INDIUM / INVENTORY
**image：** IMAGE / RESERVED
**end：** END OF RECORD
**record：** RECORD / 049
**single：** 单选
**multi：** 多选
**display：** 展示
**attribute：** 每行单选
**text：** 自由文本

STELLAGRAM OF WHIMSIES
