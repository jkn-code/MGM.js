**prm: object**

Параметры создания класса.
____

**objects: array[object]**

Объекты для клонирования в игровые. Создаются до начала игры.
____

**gameObjs: array[mgm-object]**

Игровые объекты, клонируются из **Mgm.objects** и обрабатываются в игровом цикле.
____

**curtain: html-div**

Занавес для загрузки игрового поля и ресурсов игры.
____

**curtainIn: html-div**

Текст в центре занавеса.
____

**RUN: boolean**

Флаг работы игры.
____

**frame: number**

Номер кадра игры от начала.
____

**canvas: html-canvas**

Канвас игры.
____

**context: html-canvas-context**

Контекст канваса игры.
____

**plane: html-div**

Поле над канвасом для размещения **html-объектов** с классом "**.mgm**".
____

**kfHeight: number**

Соотношение высоты канваса и высоты его разрешения.
____

**canvCX: number, canvCY: number**

Центр канваса.
____

**isMobile: boolean**

Флаг определения мобильного устройства.
____

**keys: object(boolean)**

Клавиши клавиатуры. Возвращает true, если клавиша нажата.
Перечислены клавиши:
стрелки - **up, down, left, right**;
функциональные - **space, enter, escape, shift, ctrl, backspace**;
буквы - **a-z**;
цифры - **n0 ... n9**.
```js
if (Mgm.keys.space) th.fill++
```
____

**mouse: object**

Параметры мыши.
**down**: boolean - нажатие левой кнопки,
**x, y**: number - координаты от центра канваса,
**cx, cy**: number - координаты от левого верха.
```js
if (Mgm.mouse.down) th.x = Mgm.mouse.x
```
____

**zList: array[number]**

Список z-слоев, собранный из объектов.
____
