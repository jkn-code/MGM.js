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
        pic: { p1: 'img/player.png', }
        init: function() {
            this.size = 0.2
            this.physics = 'unit'
        },
        update: function() {
            this.arrows(5)
        },
    }

    Mgm.object['tree'] = {
        pic: {
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
