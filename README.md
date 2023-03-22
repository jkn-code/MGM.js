# MGM.js
Mini Game Maker

## Описание

Библиотека для помощи в создании игр на `javascript`.

**|| ПРОЕКТ НАХОДИТСЯ В РАЗРАБОТКЕ (80%) ||**

- Классы `MGM` и `MGMObject` - готовы, но еще могут дорабатываться.
- `MGMMapEditor` - редактор карт. В разработке.
- `Инструкция` - пока толком нет.
- `Примеры` - в разработке.

____

## Инструкция

Скачать `MGM.js`, создать файл `index.html`, и написать там код:

```html
<script src="MGM.js"></script>
<script>
    const Mgm = new MGM()
</script>
```

Создать игру с юнитом, который выглядит как зеленый круг, и управляется клавишами WASD

```html
<script src="MGM.js"></script>
<script>
    const Mgm = new MGM({
        name: 'My game',
    })

    Mgm.object['unit'] = {
        init: function() {
            this.drawCircle = {
                radius: 30,
                fillColor: 'green',
            }
        },
        update: function() {
            this.wasd(5)
        },
    }
</script>
```

Создать игру с юнитом из изображения `img/player.png`, размер которого пропорционально изменен, и который управляется стрелками клавиатуры. Так же с деревьями `img/tree1.png`, `img/tree2.png`, `img/tree3.png`, которых создано 50 клонов со случайной картинкой и случайными координатами в диапазоне `2000px`.

```html
<script src="MGM.js"></script>
<script>
    const Mgm = new MGM({
        name: 'My game',
    })

    Mgm.object['unit'] = {
        pic: 'img/player.png', 
        init: function() {
            this.size = 0.2
            this.physics = 'unit'
        },
        update: function() {
            this.arrows(5)
        },
    }

    Mgm.object['tree'] = {
        pics: {
            t1: 'img/tree1.png',
            t2: 'img/tree2.png',
            t3: 'img/tree3.png',
        },
        init: function() {
            this.active = false
            this.size = 0.5
            this.physics = 'wall'
        },
        start: function() {
            for (let i = 0; i < 50; i++)
                this.clone({
                    x: Mgm.random(-1000, 1000),
                    y: Mgm.random(-1000, 1000),
                })
        },
        stClone: function() {
            this.picName = 't'+ Mgm.random(1, 3)
        }
    }
</script>
```
____

Donate : [Yoomoney](https://yoomoney.ru/to/410018410401723)

Discord : [Discord](https://discord.gg/mzmgJqH6Vj)

____

### Поля класса MGM

`name` - Название игры. Это будет написано на вкладке браузера. (string)

`bodyColor` - Цвет фона страницы. (css)

`canvasColor` - Цвет фона канваса. (css)

`textColor` - Цвет текста игры. (css)

`ratio` - Соотношение сторон канваса, ширины к высоте. (float)

`orderY` - Сортировать объекты по координате `Y` (для 2.5D-игр). (true/false)

...в процессе написания.....

____

### Методы класса MGM

`clearGame(reObj = true)` - Очищает массивы объектов и пересоздает их заново. Если передать в метод `false`, то заново объекты не пересоздаются, но так как они инициализированы и настроены ранее, то можно создавать с них клоны.

`setScene(name)` - Сменить сцену игры. По умолчанию у всех объектов сцена равна пустой строке, и сцена игры тоже.В поле `Mgm.scene` можно задать сцену, а через `Mgm.setScene(name)` сменить на другую. Объектам, привязанным к другой сцене нужно задать соответствующее значение в поле `scene`.

`resizeWin()` - Пересчитать размеры объектов на `html-странице`. Включается при изменении экрана. Так же метод надо вызывать, если у `html-объектов` изменены аттрибуты для настройки положения `mgm-left`, `mgm-top`, и т.д.

`firstV(m)` - Возвращает первый элемент из объекта. В `Mgm` используется для получения первой картинки из нескольких заданных.

`firstJ(m)` - Возвращает ключ первого элемента объекта.

`loadScript(url)` - Подгружает к странице скрипт.

`pause()` - Остановка игры на паузу.

`run()` - Запуск игры, либо снятие ее с паузы.

`stop(txt)` - Полная остановка игры. Пауза, с которой игру нельзя заново запустить методом `Mgm.run()`. Если в метод передать строку, то она выведется на экран при остановке. Иначе будет показан текст из поля `stopText` при создании экземпляра `MGM`.

`restart(url = '')` - Перезапустить `html-страницу` с новым `url`.

`urlParse()` - Разобрать `url-адрес` в объект.

`setSave(prm)` - Сохранить в `localStorage['MgmSave']` объект параметров в `JSON`. Сохранение привязывается к адресной строке браузера `location.pathname`.

`getSave()` - Получить объект из сохранения `localStorage['MgmSave']`.

`random(min, max)` - Получить случайное число из указанного диапазона двух чисел. Если в метод передать только единицу `random(1)`, то вернется в случайном порядке `1` или `-1`. Если в метод не передать ничего, то вернется в случайном порядке `true` либо `false`.

`angleXY(x1, y1, x2, y2)` - Получить угол между двумя точками.

`angleObj(obj1, obj2)` - Получить угол между двумя объектами.

`distanceXY(x1, y1, x2, y2)` - Получить расстояние между двумя точками.

`distanceObj(obj1, obj2)` - Получить расстояние между двумя объектами.

`clone(prm)` - Сделать клон игрового объекта. Метод принимает объект `clone({})`. Если объект уже существует, то надо указать его имя в поле `name`. Если нет, то будет создан новый объект. Переданные в параметры поля будут присвоены клону, будто были переданы в методе `init`. Так же можно задавать в полях методы update и другие, они так же будут присвоены клону и будут использованы классом.

`newClone(prm)` - Сделать клон игрового объекта. Метод принимает объект `clone({})`. Если объект уже существует, то надо указать его имя в поле `name`. Если нет, то будет создан новый объект. Переданные в параметры поля будут присвоены клону, будто были переданы в методе `init`. Так же можно задавать в полях методы update и другие, они так же будут присвоены клону и будут использованы классом.

`getObj(prm, key = 'name')` - Получить игровой объект по указанному значению поля. Если имя поля не указано, то ищет объект по полю `name`.

`getObjs(prm, key = 'name')` - Получить игровые объекты по указанному значению поля. Если имя поля не указано, то ищет объекты по полю `name`. Если в метод не передать ничего, то вернет все игровые объекты с `active = true`.

`getStep(angle, dist)` - Получить координаты по углу и расстоянию.

`round(n, t)` - Округлить число с заданной точностью.

`log(s)` - Вывести сообщение в собственную консоль. Консоль включается при создании экземпляра `MGM` в поле `log: true`.

`logPrm(n, v)` - Вывести параметр в собственную консоль. Консоль включается при создании экземпляра `MGM` в поле `log: true`.

`lim(v, min = 0, max = 1)` - Ограничить число по верхней и нижней границе. Если не передать границы, то число ограничивается диапазоном от ноля до единицы.

...в процессе написания...

____


### Создание MGMObject

`Mgm.object['unit'] = { prm }` - Создание игрового объекта. Ниже перечислены поля, которые можно указывать в `prm`.

`pic` - Задать изображение и-объекту. (string)

`pics` - Задать набор изображений и-объекту. (object). Задать и-объекту изображение из набора в процессе игры можно указав имя поля в `this.picName = "p1"`. 

```javascript
pics: {
    // задать изображение из файла
    p1: "Images/unit.png", 
    // задать изображение из части файла, который указан в этом же объекте
    p2: { picName: 'p1', x: 50, y: 40, width: 20, height: 30, }, 
    // задать изображение из части файла, который указан другому объекту, и если у того объекта несколько изображений в `pics`
    p3: { object: 'space', picName: 'star', x: 1551, y: 263, width: 27, height: 33, }, 
    // задать изображение из части файла, который указан другому объекту, и если у того объекта одно изображение в `pic`
    p4: { object: 'sceneGame', x: 1551, y: 263, width: 27, height: 33, }, 
},
```

`sound` - Задать звук и-объекту. (string)

`sounds` - Задать набор звуков и-объекту. (object). Далее звуки можно проигрывать через метод `this.audio()`. 

```javascript
sounds: {
    // указать звук из файла
    step: 'Sounds/step1.wav',
    // указать звук из файла с громкостью относительно общей громкости класса
    damage: { src: 'Sounds/damage.wav', volume: 0.5, },
},
```

`anim` - Задать анимации для и-объекта. (object). Далее анимации можно использовать с помощью метода `this.setAnim()`. В поле `speed` задается скорость анимации. В остальные поля задаются массивы имен изображений и-объекта, указанные в `pics`.

```javascript
anim: {
    speed: 20,
    work: ['p1', 'p2', 'p3'],
    jump: ['p4'],
},
```

`init()` - Задать начальные параметры объекта `this.x, this.active, this.drawCircle, ...`. В этом методе лучше не использовать методы класса и и-объектов, потому что он запускается еще только при создании объекта, и многие поля и методы для других объектов могут быть еще не заданы и не рассчитаны. 

`start()` - Задать метод для первого кадра и-объекта. К этому методу объект уже создан и настроен и можно использовать методы поиска контактов, клонирования и т.д.

`stClone()` - Задать метод для клона. Если и-объект был создан с помощью `Mgm.clone(), Mgm.newClone(), this.clone()`, то будет у него выполнен метод `stClone()`.

`update()` - Метод обработки и-объекта в каждом кадре игры. Если `this.active = false`, то метод не выполняется.

`scene` - Поле указания сцены, к которой относится и-объект. У всех и-объектов в игре будет выполнен `init()`, но остальные методы будут выполнены только у и-объектов, у которых `scene` совпадает с `Mgm.scene`.

Так же можно создавать произвольные методы для и-объекта, и использовать их в процессе игры, вызывая через `this.myMethod()`.

____

### Поля MGMObject

`name` - Имя объекта.




...в процессе написания...

____

### Методы MGMObject

`setAnim(name, frame = 0)` - Задает анимацию персонажа, указанную в объекте при его создании. 

`getAnim()` - Получить имя используемой анимации анимации.

`step(speed)` - Объект делает шаг в направлении `this.angle`.

`stepA(speed, angle = 0)` - Объект делает шаг в направлении `angle`.

`wasd(speed = 0)` - Объект управляется клавишами `WASD`, двигается вверх/вниз/влево/вправо со скоростью `speed`.  

`wasdA(speed = 0)` - Объект управляется клавишами `WASD`, двигается вверх/вниз/влево/вправо со скоростью `speed`. Отличие от `wasd()` в том, во всех направлениях объект двигается с одинаковой скоростью (а не с ускорением при 45 градусах). Метод возвращает угол движения, если вдруг он понадобится для изменения картинки персонажа.

`arrows(speed = 0)` - Объект управляется клавишами `Стрелки`, двигается вверх/вниз/влево/вправо со скоростью `speed`.  

`delete(act = false)` - Удалить объект. Если передать `true`, то сразу снимется активность, это может быть нужно, чтобы методы написанные ниже удаления, не выполнились в этом кадре игры.

`contactXY(x, y)` - Проверить контакт объекта с точкой координат `x, y`. Если контакт есть, то вернет `true`, иначе `flase`. Если объект не активен или скрыт, то контакт не сработает.

`contact(prm, key = 'name')` - Проверить контакт объекта с другим объектом по его полю `name`. Если `prm` не указан, то берется любой объект, с которым есть контакт. В параметр `key` можно указать любое другое поле, для фильтрации поиска контактов. Если в `prm` передать игровой объект, то просто проверяется контакт с ним. Метод вернет объект контакта или `undefined`.

`contactIn(prm, key = 'name')` - То же самое, что `contact()`, только проверяется именно нахождение внутри объекта полностью.

`contacts(prm, key = 'name')` - Получить массив объектов с которыми есть контакт. Поиск можно фильтровать по полю и его значению. По умолчанию ищется значение `prm` в поле `name` у объектов. В параметр `key` можно указать любое другое поле, для фильтрации поиска контактов. Если `prm` не указан, то берутся любые объекты, с которыми есть контакт. Если в `prm` передать массив объектов, то проверится контакт именно с ними. Если контактов нет, то метод вернет пустой массив.

`contactsIn(prm, key = 'name')` - То же самое, что метод `contacts()`, только проверяется не просто контакт, а нахождение внутри объекта полностью.

`raycast(prm)` - Контактирующий луч. Принимает объект с параметрами: `angle` - направление луча (по умолчанию `this.angle`); `steps` - количество контактирующих точек в луче (по умолчанию 40); `density` - плотность точек, расстояние между ними; `distance` - длина луча, задает шаги `steps`, разделяя длину на плотность `density`; `all` - метод возвратит массив найденных объектов; если `all` не задан, то массив вернет первый найденный объект, либо `null`; `visible` - видимость луча (точки контакта будут показаны красными кружками).

`positionTo(obj)` - Переместить на координаты другого объекта. Если в параметрах строка, то ищется объект с таким именем `name`.

`angleTo(obj)` - Получить угол относительно другого объекта. Если в параметрах строка, то ищется объект с таким именем `name`.

`distanceTo(obj)` - Получить расстояние до объекта. Если в параметрах строка, то ищется объект с таким именем `name`.

`getStep(angle, dist)` - Получить координаты шага по углу и расстоянию от объекта.

`jump(v)` - Задать вертикальное усилие, при использовании гравитации.

`lim(n, min, max)` - Ограничить численное поле `n` по верхней и нижней границе.

`clone(prm)` - Клонировать объект. То же, что Mgm.clone({ name: this.name, ... }).

`click()` - Нажатие на объект. Вернет `true`, если нажатие произошло. В методе стоит задержка на блокирование повторного нажатия до 300 мс.

`ondown()` - Нажатие на объект. Вернет `true`, если нажатие произошло. Блокирующей задержки нет, возврат `true` будет каждый кадр игры.

`wait(name, frames, func)` - Создать отложенное событие. `name` - имя события, чтобы можно было создавать много таких ожиданий для одного объекта, а так же удалять нужное ожидание по его имени. `frames` - время ожидания в кадрах игры. `func` - функция события, которая выполнится при достижении заданного времени. Если нужно удалить ожидание, то `frames` нужно указать `null` (`func` при этом можно не указывать). Если метод создан в `update`, то он не пересоздаст ожидание, пока не будет окончен или удален.

`repeat(name, frames, func)` - Задать повторяющееся событие. `name` - имя события, чтобы можно было создавать много таких повторений для одного объекта, а так же удалять нужное повторение по его имени. `frames` - время ожидания в кадрах игры. `func` - функция события, которая выполнится при достижении заданного времени. Если нужно удалить повторение, то `frames` нужно указать `null` (`func` при этом можно не указывать). Если метод создан в `update`, то он не пересоздаст повторение, пока не будет окончен или удален.

`audio(d, name, obj)` - Действия со звуком. `d` - тип действия. `name` - звук объекта. `obj` - рассчитать громкость относительно другого объекта. Если `obj = true`, то рассчитывается расстояние до `Mgm.camera`. Действия: `play` - проиграть звук сначала, если он не проигрывается в данный момент; `start` - проиграть звук сначала, независимо от того, что он сейчас играется; `loop` - проиграть звук с зацикливанием (громкость от расстояния в таком случае не рассчитывается); `stop` - остановить звук, вернув его на начало; `pause` - остановить звук, сохранив время проигрывания.

`setVol(name, vol)` - Задать громкость с учетом общей громкости класса.