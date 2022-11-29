# MGM.js
Mini Game Maker

**|| ПРОЕКТ НАХОДИТСЯ В РАЗРАБОТКЕ (80%) ||**

- Классы `MGM` и `MGMObject` - готовы, но еще могут дорабатываться.
- `MGMMapEditor` - редактор карт. В разработке.
- `Инструкция` - пока толком нет.
- `Примеры` - в разработке.

## Описание

Библиотека для помощи в создании игр на `javascript`.

____

# Инструкция

Скачать `MGM.js`, создать файл `game.html`, и написать там код:

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
        init: th => {
            th.drawCircle = {
                radius: 30,
                fillColor: 'green',
            }
        },
        update: th => {
            th.wasd(5)
        },
    }
</script>
```
____

# Donate

Зодонатить:

[yoomoney](https://yoomoney.ru/to/410018410401723)

