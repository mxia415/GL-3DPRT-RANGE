# GL-3DPRT 运动范围判定工具

版本：v1.32

日期：2026-07-29

这是一个用于 GL-3DPRT 蜘蛛式建筑 3D 打印机的浏览器端运动范围判定项目。工具根据实测的 X-Y 平面范围和 R-Z 垂直截面，生成三维可达空间，并判断输入的长方体是否完整落在设备运动范围内。

## 当前包含的设备

- `GL-3DPRT-SP-M`
- `GL-3DPRT-SP-S`
- `GL-3DPRT-TJA`（轨道版 / 固定底座）
- `GL-3DPRT-TRL`
- `GL-3DPRT-CRL`

项目入口是：

```text
outputs/index.html
```

打开入口页后选择设备型号，进入对应的判定工具。

各设备页面都支持临时导入本地 STL 参考模型。STL 文件只在浏览器本地读取，不会上传；导入后可以通过滑动条或手动输入调整 X/Y/Z 位置，也可以调整 X/Y/Z 旋转、缩放和透明度。导入的 STL 只用于观察对照，不参与运动范围判定。

TJA 页面可在“轨道版”和“固定底座”之间切换。轨道版使用沿 X 轨道扫掠的胶囊形包络并扣除无限长中心带；固定底座版使用半径 8130.3 mm、高 4500 mm 的圆柱包络并扣除中心固定平台菱形。切换时会同步更换包络、判定、最大贴合、默认视角和设备模型。

TRL 页面使用 KUKA KR210 R2700-2 轨道项目的 V9 50 mm 真实 IK + 物理干涉包络，支持 `Long` / `Standard` 两种 Nozzle。切换时同步更换光滑包络、末端 GLB 和判定模板。模型固定使用 E1=3050、A1=-6.99986°、A2=-62.22702°、A3=35.48715°、A4=0°、A5=-116.7401°、A6=-18.3870° 的截图姿态。

TRL 的 Y 向内侧边默认值按打印头区分：加长款为 `1300 mm`，标准款为 `1700 mm`。首次打开、切换打印头、重置尺寸和导入 STL 后会恢复到当前打印头的默认值，但这不是硬下限。用户可在 `0…4000 mm` 内手动调整，长方体判定和最大贴合使用当前 Y 值并由 Nozzle 包络决定结果。

TRL V1.2 将画面显示的最终闭合光滑网格作为长方体、STL 和最大贴合的直接判定边界，修复角点视觉上已经越界但仍被原始 50 mm 模板接受的问题；地面型号字已缩小并向 `+Y` 外侧移动，坐标轴多余刻度也已移除。

TRL V1.3 增加 `file://` 离线资源包。直接双击 `outputs/index.html` 进入时，可正常显示包络、长方体和坐标场景；设备参考模型在点击显示按钮后按需加载离线轻量模型。HTTP/GitHub Pages 仍使用原始分件模型。

TRL V1.4 将 `Y=1100 mm` 改为初始/重置/导入恢复值；用户可手动调整至更低位置，判定与最大贴合按当前 Y 值执行。

TRL V1.4 同时取消 150 mm 地面闭合放宽，并将显示/判定包络同步下移约 40.4 mm 至 `Z=0`，底面仅在网格内侧约 2 mm 处取样，修复长方体底边视觉越界但仍显示范围内的问题。

TRL V1.5 将离线光滑包络底部约 150 mm 的过渡带直接压平到 `Z=0`。显示网格与 BVH 判定网格共用这一平底几何，使整个有效底部接触地面，避免只有最低点落地而其余底边悬空。

TRL V1.6 将 Nozzle 规格标题与切换框调整为同一行，并统一垂直居中。

TRL V1.7 接入 KUKA 项目的 V9 双包络。“可达”现在要求权威约束 IK 成功且 Collision Model V2 无物理干涉；竖直喷嘴只允许 TCP 平端接触地面。V9 网格自身最低面为 `Z=0`，页面移除旧的运行时下移/压平处理，显示与判定直接共用同一份 V9 轻量网格。

TRL V1.8 将加长款默认 Y 调整为 `1300 mm`，标准款调整为 `1700 mm`，并统一应用于首次打开、打印头切换、尺寸重置和 STL 导入恢复。

CRL 页面以 TRL V1.8 为界面与交互基准，使用 CRL01 的 68,250 个碰撞过滤后 TCP 姿态生成连续打印包络，并接入同一统一装配矩阵下的八个设备 GLB 分件。CRL 没有 Nozzle 规格切换。

设备页面还支持隐藏/显示中间的内接长方体和尺寸标注；隐藏后参数和判定结果仍会保留。

导入 STL 后可以显示或隐藏 STL 与运动范围边界的近似交线。交线通过模型三角面边上的范围内外变化点生成，只作为视觉辅助。

导入 STL 后，工具会按三角面检查模型是否超出当前设备的打印范围。范围内保持蓝色，超出范围的三角面显示为红色，并在 3D 视图左上角提示“超出打印范围”；这部分检查只用于参考显示，不改变内接长方体判定。

## 文件结构

```text
outputs/index.html                    设备选择入口
outputs/GL-3DPRT-SP-M.html            SP-M 运动范围判定工具
outputs/GL-3DPRT-SP-S.html            SP-S 运动范围判定工具
outputs/GL-3DPRT-TJA-track.html       TJA 轨道版 / 固定底座合并判定工具
outputs/GL-3DPRT-TRL.html             TRL 运动范围判定工具
outputs/GL-3DPRT-CRL.html             CRL 打印范围判定工具
outputs/GL-3DPRT-SP-M说明.md          SP-M 使用说明
outputs/GL-3DPRT-SP-S说明.md          SP-S 使用说明
outputs/GL-3DPRT-TJA-track说明.md     TJA 两种形式使用说明
outputs/GL-3DPRT-TRL说明.md           TRL 使用说明
outputs/GL-3DPRT-CRL说明.md           CRL 使用说明
outputs/assets/GL-3DPRT-SP-M.glb      SP-M 设备模型，供 HTTP / GitHub Pages 使用
outputs/assets/GL-3DPRT-SP-S.glb      SP-S 高精度设备模型，供 HTTP / GitHub Pages 使用
outputs/assets/GL-3DPRT-SP-S-model.js  SP-S 高精度设备模型的 file:// 备用包
outputs/assets/GL-3DPRT-TJA-track.glb  TJA(track) 压缩完整设备模型，供 HTTP / GitHub Pages 使用
outputs/assets/TJA-track-model.js      TJA(track) file:// 离线备用模型包
outputs/assets/TJA_00_FIX_PLATFORM.glb TJA 固定平台压缩模型
outputs/assets/TJA-fixed-model*.js     TJA 固定底座五分件 file:// 备用模型包
outputs/assets/trl/                    TRL 两套包络、分类模板与轻量设备模型资源
outputs/assets/CRL01-*                 CRL 包络数据、离线包与八分件模型资源
outputs/assets/raw/GL-3DPRT-TJA-track-raw.glb  TJA(track) 原始模型备份
outputs/assets/*-model.js             本地 file:// 打开时使用的备用模型包
outputs/glb-compressor.html           维护用 GLB 压缩工具
outputs/preview.html                  维护用界面预览文件
```

根目录下的 `spm model.glb` 和 `sps model.glb` 是原始模型文件；正式页面使用 `outputs/assets` 里的压缩模型和备用模型包。

## 使用方式

推荐从项目目录启动本地 HTTP 服务：

```bash
python3 -m http.server 4174
```

然后在浏览器打开：

```text
http://localhost:4174/outputs/index.html
```

SP-M、SP-S、TJA、TRL 与 CRL 均提供各自的离线备用资源包。

## 判定方法

一个点必须同时满足两类条件，才算在设备可达范围内：

- 位于 X-Y 平面的可达区域内。
- 位于 R-Z 垂直截面的可达区域内。

长方体需要整体位于这两个范围的交集空间内。工具会检查角点和表面采样点，避免只看角点导致误判。

设备模型只用于视觉参考，不参与运动范围判定，也不影响最大贴合结果。

## 发布和分享

如果发布到 GitHub Pages 或用本地 HTTP 服务访问，请保留完整的 `outputs` 文件夹，特别是：

- `outputs/index.html`
- `outputs/GL-3DPRT-SP-M.html`
- `outputs/GL-3DPRT-SP-S.html`
- `outputs/GL-3DPRT-TJA-track.html`
- `outputs/GL-3DPRT-TRL.html`
- `outputs/GL-3DPRT-CRL.html`
- `outputs/assets`

如果只分享单个设备页面，也要同时提供该设备对应的 `.glb` 和 `*-model.js` 文件，否则设备模型按钮无法在所有访问方式下正常工作。

## 维护说明

只要网页功能、设备数据、模型、显示效果或说明文档发生变化，发布前需要同步更新：

- 设备 HTML 的 `<title>` 版本号。
- 设备 HTML 左侧信息栏里的版本号和日期。
- 对应说明文档顶部的版本号和日期。
- 本 README 的版本号和日期。
