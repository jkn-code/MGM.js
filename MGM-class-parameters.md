## MGM class parameters
____

**name: string**

Название игры. Будет отображаться в title страницы.
```js
const Mgm = new MGM({
    name: 'Моя игруля'
})
```
____

**platforms: string**

Платформы для игры. Принимается строка, где через запятую указаны один или два параметра: "pc, mobile". По умолчанию выбрана только платформа "pc".
```js
platforms: "pc",
platforms: "mobile"
platforms: "pc, mobile"
```
____

**ratio: number**

Отношение сторон канваса. По умолчанию 1 = квадрат.
```js
ratio: 1.8 // полный экран
```
____

**quality: number**

Разрешение экрана игры - количество пикселей в высоту. По умолчанию 1000.
```js
quality: 300 // олдскул ;)
```
____

**scripts: array[string(url-script)]**

Список адресов скриптов для игры, которые необходимо подключить.
```js
scripts: ["Scripts/player.js", "Scripts/units.js", "Scripts/map.js"]
```
____

**vars: object**

Перменные, заранее созданные в классе.
```js
const Mgm = new MGM({
    name: 'Моя игра',
    vars: {
        points: 0,
        speed: 10,
        limit: 50000
    },
})
```
____

**bgPage: string(css-color)**

Цвет фона страницы.
```js
bgPage: "#be7200"
```
____

**bgCanvas**

Цвет фона канваса.
```js
bgPage: "#be7200"
```
____

**fontFamily: string(font-name)**

Шрифт страницы
```js
fontFamily: "Verdana"
```
____

**fontColor: string(css-color)**

Цвет текста страницы
```js
fontColor: "black"
```
____

**fontSize: number**

Размер текста страницы. По умолчанию = ширина поля / 50.
```js
fontSize: 25
```
____

**icon: string(url-image)**

Иконка страницы
```js
icon: "Images/logo.png"
```
____

**mobileControl: string**

Выбор из подготовленных мобильных кнопок и джойстиков, перечисляются через запятую. По умолчанию "**stickL, br1, br2, br3, br4**". Все возможные "**stickL, br1, br2, br3, br4, stickR, bl1, bl2, bl3, bl4, bc1, bc2**"
```js
// джойстик слева и четыре кнопки справа 

mobileControl: "stickL, br1, br2, br3, br4"

// джойстик справа и две кнопки слева
        
mobileControl: "stickR, bl1, bl2"

// два джойстика и две кнопки в центре

mobileControl: "stickL, stickR, bc1, bc2"
```
____

**mobileColor: string(css-color)**

Цвет кнопок мобильного управления
```js
mobileColor: "blue"
```
____

**autorun: boolean**

Автозапуск игры.
____

**startTxt: string(html-text)**

Текст для стартового окна игры. По умолчанию "<center><b>С т а р т</b><br><br><small>нажать для запуска</small></center>"
```js
startTxt: "<h1>ТЕТРИС</h1>"
```
____

**stopText: string(html-text)**

Текст для остановки игры методом **Mgm.stop()**. По умолчанию "The end"
```js
stopText: <h1>GAME OVER</h1>
```
____

**fullscreen: boolean**

Переход в полный экран после запуска игры. По умолчанию **flase**.
____

**cursor: boolean**

Видимость курсора. По умолчанию **true**.
____

**orderY: boolean**

Сортировать объекты по координате **Y**. По умолчанию **false**. Требуется для 2.5D игр.
____
