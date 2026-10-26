# QA 冒烟清单 · R2

## 每轮必跑（Web `/play/circle-survivor`）

1. 页面有标题、canvas 非黑屏
2. WASD 移动；破境面板打开时 1/2/3 择法
3. 自动御剑；击杀掉灵韵；拾取有反馈（音 optional）
4. ~20–28s 首次破境三选一
5. 道消/渡劫成功：再入试炼、返回道台可点
6. Esc：对局中（非破境暂停）返回道台
7. 无 PNG/OGG 不白屏、控制台无未捕获异常

## R2 增量

- 120/150/175s 渡劫兽.spawn + tribulation 音（有 ogg 时）
- 再入试炼 5 局：BGM 不叠（待测）
- 180s 胜利计时（待测）
- 60+ 怪帧率（待测）

## 自动化

`python3 modes/circle_survivor/tools/smoke_pygame_dummy.py` → exit 0，asset WARN 可接受直至拷贝完成。
