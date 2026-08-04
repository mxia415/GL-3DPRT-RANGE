# GL-3DPRT-TRL02 运动范围判定说明

- 版本：V3.0
- 日期：2026-08-04
- 页面：`GL-3DPRT-TRL02.html`

## Nozzle 切换

页面提供 `Long` 与 `Standard` 两种 Nozzle。切换时会同时更换：

- 对应的 TCP V9 真实 IK + 物理干涉光滑包络；
- 对应的末端 GLB；
- 用于长方体和导入 STL 判定的 50 mm IK + 物理干涉分类模板。

两种规格共用轨道、机械臂分件和同一组截图姿态，不会只更换标签或颜色。

Nozzle 规格标题与切换框在同一行水平排列并垂直居中，中英文界面使用相同布局。

## 包络与判定口径

包络来自 KUKA KR210 R2700-2 轨道项目的 V9 离线结果：

- `Long Nozzle`：`envelope-v9-long-ypos-fullx-50mm-conservative-smooth`
- `Standard Nozzle`：`envelope-v9-standard-ypos-fullx-50mm-conservative-smooth`

V9 的“可达”要求权威约束 IK 成功且 Collision Model V2 无物理干涉。碰撞模型覆盖机械臂非相邻连杆自碰撞、机械臂与轨道/滑台/固定结构、Long/Standard 喷嘴与机械臂及固定结构，并使用 25 mm 保守净距；相邻设计连接按白名单豁免。喷嘴严格竖直向下时，仅 TCP 平端允许接触 `Z=0`，喷嘴杆和其他结构仍必须保持地面净距。

显示网格由 50 mm IK + 碰撞证据构造，并经过保守内缩和连续光滑处理。长方体、导入 STL 与最大贴合直接以画面显示的最终闭合包络网格为判定边界；轨内 Y-Z、轨外 R-Z 分类模板只承担来源一致的快速预筛。

最终轻量网格使用 BVH 加速射线奇偶判定。V9 源网格已经在离线生成阶段保留真实 TCP 触地面，Long 与 Standard 的最低 Z 均为 `0`；页面不再平移或压平包络。显示与判定使用同一份 V9 轻量网格，底面采样点只向网格内侧偏移约 2 mm，避免射线起点恰好落在三角面上。

坐标与范围：

- 世界单位：mm；
- 轨道 E1：`X=575…5535`；
- 原始包络采样域：`X=-3500…9600, Y=0…4000, Z=0…3000`；
- Y 向内侧边可手动调整范围：`Y=0…4000 mm`；
- 设备无限高禁区：`X=0…6300, Y=-650…650, Z≥0`；
- 长方体 X 使用中心位置，Y 使用靠设备一侧的内侧边位置并向 `+Y` 展开；
- 加长款的 Y 初始值、切换恢复值、重置值和导入 STL 后恢复值为 `1300 mm`；标准款为 `1700 mm`；
- 上述默认值不是硬下限；用户仍可手动输入或滑动至更小的 Y，最终由当前 Nozzle 包络决定是否可达；
- 若当前位置连保留固定尺寸的最小截面也无法容纳，“固定最大贴合”会从当前 Y 向设备外侧寻找首个可行位置后再执行贴合，避免留下无效的极小长方体；
- 长方体底面固定为 `Z=0`，向 `+Z` 展开。

长方体会检查 8 个角点和约 100 mm 间距的表面采样点。三个按钮分别支持固定 L、固定 W、固定 H 的最大贴合。

地面型号标识在 V1.2 中缩小并沿 `+Y` 外侧移动；坐标轴仅保留主轴、箭头和正方向标签，不再显示负向延长线与分段刻度。Nozzle 卡片只保留规格标题和切换框。X 向长度尺寸线与数字移到长方体的 `+Y` 外侧，避免被设备轨道遮挡。

## 设备模型姿态

页面按用户截图中的值固定显示参考模型：

- E1：3050 mm
- A1：-6.99986°
- A2：-62.22702°
- A3：35.48715°
- A4：0°
- A5：-116.7401°
- A6：-18.3870°

九个逻辑分件沿用参考项目已锁定的 V6 标定和世界矩阵。Nozzle 切换只在 `kr210_90_tool_extension.glb` 与 `kr210_90_tool_extension_standard.glb` 之间互斥显示。

设备模型仅用于视觉参考，不参与可达性或碰撞判定。

## 本地打开

TRL02 同时支持本地 HTTP 服务和直接双击入口页。

从项目根目录启动本地 HTTP 服务：

```bash
python3 -m http.server 4174
```

然后打开：

```text
http://localhost:4174/outputs/GL-3DPRT-TRL02.html
```

直接双击 `outputs/index.html`、通过 `file://` 进入 TRL02 时，页面会自动加载 `trl-offline-data.js`，其中包含分类模板与两套轻量包络。点击“显示设备模型”时才会按需加载 `trl-offline-reference.js`，避免在页面启动时解析大型设备模型包。

## 资产

```text
outputs/assets/trl/classification.json
outputs/assets/trl/envelope-build-report.json
outputs/assets/trl/envelope-long.glb
outputs/assets/trl/envelope-standard.glb
outputs/assets/trl/envelope-long-light.glb
outputs/assets/trl/envelope-standard-light.glb
outputs/assets/trl/reference-base-light.glb
outputs/assets/trl/reference-tool-long-light.glb
outputs/assets/trl/reference-tool-standard-light.glb
outputs/assets/trl/trl-offline-data.js
outputs/assets/trl/trl-offline-reference.js
```

TRL02 保存两套 V9 闭合光滑包络：Long 为 168,663 顶点 / 337,322 面，Standard 为 205,818 顶点 / 411,632 面。页面加载的 `*-light.glb` 使用二次误差简化至各 60,000 个三角面，仍保持闭合、绕序一致且最低 `Z=0`；显示和最终判定共用同一轻量网格，以降低浏览器启动和连续判定耗时。构建来源、SHA-256、边界与面数记录在 `envelope-build-report.json`。

HTTP/Cloudflare Pages 与 `file://` 模式均使用预先应用截图姿态的合并基础模型与两套轻量 Nozzle；基础模型约 17 MB，两套 Nozzle 各约 0.7 MB，并只在用户点击显示设备模型时加载。原始分件 GLB 作为本地重建源保留，不进入静态部署。
