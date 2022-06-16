## MGM class methods

**console(txt: string)**

Вывести текст поверх всего в левый верхний угол.
```js
Mgm.console("Угол: "+ th.angle)
```
____

**pause()**

Поставить игру на паузу.
```js
Mgm.pause()
```
____

**run()**

Запустить игру, снять игру с паузы.
```js
Mgm.run()
```
____

**stop(txt = "": string)**

Остановить игру. Можно передать текст, который выведется при остановке.
```js
Mgm.objects.unit1.update = th => {
    if (c = th.contact("snake")) Mgm.stop("GAME OVER")
}
```
____

**restart(url = "": string)**

Перезагрузить страницу. Можно указать параметры `url`.
```js
Mgm.restart("?level=10")
```
____

**urlParse(): object**

Парсинг параметров `url`.
```js
let url = Mgm.urlParse()
// url = { level: 10 }
```
____

**setSave(prm: object)**

Сохранить объект. (в `localStorage["MgmSave"]`)
```js
Mgm.setSave({ room: 10, gun: 53 })
```
____

**getSave(): object**

Получить сохраненные данные. (из `localStorage["MgmSave"]`)
```js
let save = Mgm.getSave()
// save = { room: 10, gun: 53 }
```
____

**random(min = 0: number, max = 1: number): number**

Получить случайное число.
```js
Mgm.objects.unit = {
    pic: "Images/unit.png",
    th.x: Mgm.random(-200, 200),
    th.y: Mgm.random(-400, 400),
}
```
____

**angleXY(x1: number, y1: number, x2: number, y2: number): number**

Получить угол между двумя точками.
```js
th.angle = Mgm.angleXY(box.x, box.y, unit.x, unit.y)
```
____

**angleObj(obj1: object, obj2: object): number**

Получить угол между двумя объектами.
```js
th.angle: Mgm.angleObj(box, unit)
```
____

**distanceXY(x1: number, y1: number, x2: number, y2: number): number**

Получить расстояние между двумя точками.
```js
let dist = distanceXY(box.x, box.y, unit.x, unit.y)
```
____

**distanceObj(obj1: object, obj2: object): number**

Получить расстояние между двумя объектами.
```js
th.dist = Mgm.distanceObj(box, unit)
```
____

**createObj(prm: object)**

Создать клон объекта из `Mgm.objects` по его имени - "`name`" обязательный параметр.
```js
let blt = Mgm.createObj({ 
    name: "bullet", 
    x: th.x, 
    y: th.y, 
    angle: th.angle,
    active: true,
})
if (a == 10) blt.delete()
```
____

**getObj(name: string): object (Mgm.gameObjs)**

Получить игровой объект по имени.
```js
let unit1 = Mgm.getObj("unit1")
unit1.hp += 50
```
____

**getObjs(name: string): array[mgm-object]**

Получить игровые объекты по имени
```js
let bullets = Mgm.getObjs("bullet")
bullets.forEach(b => b.delete())
```
____
