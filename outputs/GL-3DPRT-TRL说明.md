# GL-3DPRT-TRL 运动范围判定说明

- 版本：V1.6
- 日期：2026-07-28
- 页面：`GL-3DPRT-TRL.html`

## Nozzle 切换

页面提供 `Long` 与 `Standard` 两种 Nozzle。切换时会同时更换：

- 对应的 TCP 真实 IK 光滑包络；
- 对应的末端 GLB；
- 用于长方体和导入 STL 判定的 50 mm IK 分类模板。

两种规格共用轨道、机械臂分件和同一组截图姿态，不会只更换标签或颜色。

Nozzle 规格标题与切换框在同一行水平排列并垂直居中，中英文界面使用相同布局。

## 包络与判定口径

包络来自 KUKA KR210 R2700-2 轨道项目的 V6 离线结果：

- `Long Nozzle`：`envelope-v6-long-ypos-fullx-50mm-conservative-smooth`
- `Standard Nozzle`：`envelope-v6-standard-ypos-fullx-50mm-conservative-smooth`

显示网格由 50 mm 真实 IK 证据构造，并经过保守内缩和连续光滑处理。V1.2 起，长方体、导入 STL 与最大贴合直接以画面显示的最终闭合包络网格为判定边界；轨内 Y-Z、轨外 R-Z 分类模板只承担来源一致的快速预筛。这样可避免原始模板通过、但角点已经穿出光滑显示边界的不一致。

最终网格使用 BVH 加速射线奇偶判定。离线光滑过程会在底部形成约 150 mm 的圆滑过渡，V1.5 在页面加载时将该过渡带的网格顶点投影到 `Z=0`，形成可见的连续平底，再以修改后的同一网格构建 BVH。底面采样点在网格内侧约 2 mm 处判定，因此平底不是隐藏的判定放宽：画面显示的地面边界与长方体、STL 和最大贴合使用的边界完全相同。

坐标与范围：

- 世界单位：mm；
- 轨道 E1：`X=575…5535`；
- 原始包络采样域：`X=-3500…9600, Y=0…4000, Z=0…3000`；
- Y 向内侧边可手动调整范围：`Y=0…4000 mm`；
- 设备无限高禁区：`X=0…6300, Y=-650…650, Z≥0`；
- 长方体 X 使用中心位置，Y 使用靠设备一侧的内侧边位置并向 `+Y` 展开；
- `Y=1100 mm` 仅是网页初始值、重置值和导入 STL 后的恢复值，不是硬下限；手动输入或滑动可低于 `1100 mm`，最终由当前 Nozzle 包络决定是否可达；
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

TRL 同时支持本地 HTTP 服务和直接双击入口页。

从项目根目录启动本地 HTTP 服务：

```bash
python3 -m http.server 4174
```

然后打开：

```text
http://localhost:4174/outputs/GL-3DPRT-TRL.html
```

直接双击 `outputs/index.html`、通过 `file://` 进入 TRL 时，页面会自动加载 `trl-offline-data.js`，其中包含分类模板与两套轻量包络。点击“显示设备模型”时才会按需加载 `trl-offline-reference.js`，避免在页面启动时解析大型设备模型包。

## 资产

```text
outputs/assets/trl/classification.json
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

原始两套闭合光滑包络保留不变（Long 约 7.1 MB / 414,824 面，Standard 约 7.8 MB / 456,128 面）。页面加载的 `*-light.glb` 使用二次误差简化至各 60,000 个三角面，仍保持闭合，约 1.1 MB；显示和最终判定共用同一轻量网格，以降低浏览器启动和连续判定耗时。

HTTP/Cloudflare Pages 与 `file://` 模式均使用预先应用截图姿态的合并基础模型与两套轻量 Nozzle；基础模型约 17 MB，两套 Nozzle 各约 0.7 MB，并只在用户点击显示设备模型时加载。原始分件 GLB 作为本地重建源保留，不进入静态部署。
