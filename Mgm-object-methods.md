## Mgm object methods

**start()**

Если у объекта существует этот метод (его можно не создавать), то он автоматически выполнится при создании клона объекта из `Mgm.objects` в `Mgm.gameObjs`. Такое происходит в начале игры, когда создаются клоны всех игровых объектов, и в течении игры, когда выполняется метод `Mgm.createObj()`.
```js
Mgm.objects.unit1 = { // Создание объекта
    pic: 'Images/unit.png',
}
         
Mgm.objects.unit1.start = th => { // Создание метода start()
    Mgm.unitPoints = 0 // В начале игры создать переменную для очков игрока
}
```
____

**update()**

Если у объекта существует этот метод (его можно не создавать), то он будет автоматически выполняться при каждом кадре игры для клона объекта в `Mgm.gameObjs`.
```js
Mgm.objects.unit1 = { // Создание объекта
    pic: 'Images/unit.png',
    speed: 5,
}
                 
Mgm.objects.unit1.update = th => { // Создание метода update()
    if (Mgm.keys.right) th.x += th.speed
}
```
____

**step(speed: number)**

Смещает объект на `speed` в направлении `th.angle`.
```js
Mgm.objects.unit1.update = th => {
    if (Mgm.mouse.down) {
        th.angle = th.angleTo(Mgm.mouse)
        th.step(3)      
    }
}
```
____

**wasd(speed: number)**

Смещает объект по `x` и `y` на `speed` пикселей при нажатии клавиш `w, a, s, d`.
```js
Mgm.objects.unit1.update = th => {
    th.wasd(5)
}
```
____

**arrows(speed: number)**

Смещает объект по `x` и `y` на `speed` пикселей при нажатии стрелок.
```js
Mgm.objects.unit1.update = th => {
    th.arrows(5)
}
```
____

**bounce()**

Отражает угол движения объекта, при его касании края экрана. Важно `(!)`, чтобы эта команда стояла перед командой `th.step()`.
```js
Mgm.objects.unit1.update = th => {
    th.bounce()
    th.step(5)
}
```
____

**stepTo(obj: string/mgm-object, speed: number)**

Постепенно двигает объект в сторону указанного объекта со скоростью `speed`. Параметр `obj` принимает как строку (тогда ищется объект с таким именем), так и объект.
```js
Mgm.objects.unit1.update = th => {
    th.stepTo("box", 5)
}
```
____

**delete()**

Удалить объект из игры (из Mgm.gameObjs).
```js
Mgm.objects.unit1.update = th => {
    if (b = th.contact("bullet")) {
        b.delete()
        th.hp -= 10
        if (th.hp <= 0) th.delete()
    }
}
```
____

**contact(prm: string/mgm-object/array[mgm-object]): object/null**

Проверить касание с объектом, и вернуть его при косании. Принимает строку, игровой объект, массив игровых объектов.
```js
Mgm.objects.unit1.update = th => {
    if (b = th.contact("bullet")) {
    // if (b = th.contact(Mgm.unit2)) {
    // if (b = th.contact(Mgm.bullets)) {
        b.delete()
        th.hp -= 10
        if (th.hp <= 0) th.delete()
    }
}
```
____

**contacts(): array[mgm-object]**

Получить список касающихся объектов.
```js
Mgm.objects.unit1.update = th => {
    let objs = th.contacts()
    objs.forEach(obj => {
        if (obj.name == 'tree') obj.alpha = 0.5
        else obj.alpha = 1
    })
}
```
____

**contactXY(x, y: number): boolean**

Проверить касание точки координат. Возвращает true/false.
```js
if (th.contactXY(Mgm.mouse.x, Mgm.mouse.y)) th.delete()
```
____

**contactIn(prm: string/mgm-object/array[mgm-object]): object/null**

Проверить полное касание с объектом (нахождение на его плоскости), и вернуть его при полном косании. Принимает строку, игровой объект, массив игровых объектов.
```js
Mgm.objects.unit1.update = th => {
    if (b = th.contactIn("water")) {
    // if (b = th.contactIn(Mgm.water)) {
    // if (b = th.contactIn(Mgm.waters)) {
        b.unitIn = true
        th.hp -= 10
        if (th.hp <= 0) th.delete()
    }
}
```
____

**raycast(angle: number, all = false: boolean, steps: number, density = 10: number) ???**

Тоже тут надо бы разобраться...
____

**positionTo(prm: string/mgm-object)**

Переместиться на координаты объекта. Параметр принимает строку для поиска объекта, либо сам объект.
```js
if (th.x > 100) th.positionTo(Mgm.startPos)
```
____

**angleTo(prm: string/mgm-object): number**

Получить угол по отношению к объекту. Параметр принимает строку для поиска объекта, либо сам объект.
```js
if (th.x > 100) th.angle = th.angleTo(Mgm.startPos)
```
____

**distanceTo(prm: string/mgm-object): number**

Получить расстояние до объекта. Параметр принимает строку для поиска объекта, либо сам объект.
```js
if (th.x > 100) th.angle = th.angleTo(Mgm.startPos)
```
____

**limit(name, min, max: number)**

Ограничивает значение параметра объекта по имени `name` от `min` до `max`.
```js
th.limit("x", -100, 100)
// 50 => 50, 150 => 100, -200 => -100
```
____

**soundPlay(...args: string+number+boolean)**

Проиграть звук. Принимает три необязательных параметра:
• строка - имя звука в массиве `th.sounds` (первый);
• число (0-1) - громкость (1);
• true/false - играть звук, если он еще не звучит (true).

Если имя не указано, то играется `th.sound`. Если имя указано, то `th.sounds[имя]`. Если громкость не указана, то громкость 1. По умолчанию включен режим доигрывания звука до конца, прежде чем начать его играть снова. Кроме этого метода, к звукам в `th.sound` и `th.sounds[]` можно обращаться стандартными средствами `javascript` для воспроизведения `Audio()`
```js

th.soundPlay() // th.sound.play()
th.soundPlay(0.5) // th.sound.volume = 0.5; th.sound.play()
th.soundPlay("shot") // играть th.sounds["shot"] независимо от того, доигрался ли он до конца до этого
```
____

**soundLoop(...args: string+number)**

Проиграть звук зацикленно. Принимает два необязательных параметра:
• строка - имя звука в массиве `th.sounds` (первый);
• число (0-1) - громкость (1);

Если имя не указано, то играется `th.sound`. Если имя указано, то `th.sounds[имя]`. Если громкость не указана, то громкость 1.
```js

th.soundLoop() // зацикленно играть th.sound
th.soundLoop(0.5) // громкость 50%
th.soundLoop("backMusic") // зацикленно играть th.sounds['backMusic']
```
____

**soundStop(name = "": string)**

Остановить звук. Если не указан параметр, то `th.sound`. Если параметр указан, то `th.sounds[name]`
```js
th.soundStop("backMusic")
```
____
