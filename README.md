# mgm
Mini game maker

|| The project is under development and testing ||

# Description

**MGM** is a class that is designed to help you program games, animations, presentations, and so on. in javascript. The class has prepared tools for convenient handling of objects in the visual field, the necessary settings and features. An important condition for MGM is accessibility so that novice programmers and even children can use it. If necessary, the class can be easily extended using javascript.

### Advantages.
- Combining different aspects of development: setup, graphics, operation, sound.
- Ease of connection.
- Accessibility for understanding, the use of functions is simplified as much as possible.
- Free.
- Support and control settings from the phone.
- Both canvas and html/css objects.

### Flaws.
- Only 2D.
- Working with sound from standard html functionality.
- Animations only with separate pictures.
- Object colliders are only square and do not rotate.

### Planned in the future.
- Object map editor.
- Methods for animation and working with glued images.
- Working with sound from the Web Audio API.
- More than one collider per object.
- Better physics.
- Own hosting with registration for developers where they could publish their games and have users respond.

### Planned for the distant future.
- 3D.
- Multiplayer.

____

# Instruction

Download the latest version of MGM.js. Place it in the folder where you plan to make the game. Create an index.html file in this folder. In it, create basic html tags, include the MGM.js file in the head, and create an instance of the class below in the body.

```html
<!DOCTYPE html>
<html>
    <head>
        <script src="MGM.js"></script>
    </head>
    <body>
        <script>
            const Mgm = new MGM({})
        </script>
    </body>
</html>
```

### MGM class parameters

`name: string`

Название игры. Будет отображаться в title страницы.
```js
const Mgm = new MGM({
    name: 'Моя игруля'
})
```


`platforms: string`

Платформы для игры. Принимается строка, где через запятую указаны один или два параметра: "pc, mobile". По умолчанию выбрана только платформа "pc".
```js
platforms: "pc",
platforms: "mobile"
platforms: "pc, mobile"
```


`ratio: number`
Отношение сторон канваса. По умолчанию 1 = квадрат.
```js
ratio: 1.8 // полный экран
```

`quality: number`

Разрешение экрана игры - количество пикселей в высоту. По умолчанию 1000.
```js
quality: 300 // олдскул ;)
```

`scripts: array[string(url-script)]`

Список адресов скриптов для игры, которые необходимо подключить.
```js
scripts: ["Scripts/player.js", "Scripts/units.js", "Scripts/map.js"]
```

### MGM class variables
### MGM class methods
### Mgm Object parameters
### Mgm object methods











# Donate

Support project development

[yoomoney](https://yoomoney.ru/to/410018410401723)

