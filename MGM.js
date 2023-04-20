

console.log('MGM.js 1.43');



class MGM {

    #fpsTime = 0
    #logPrms = {}
    #build = {}
    #fpsSch = 0
    #logs = []

    constructor(params) {
        this.params = params
        this.object = {}
        this.RUN = false
        this.frame = 0
        this.camera = { x: 0, y: 0 }
        this.tabActive = true
        this.sch10 = 0
        this.sch100 = 0
        this.sch1000 = 0
        this._physMas = []
        this.inRunPause = false
        this.inActPause = false

        window.onload = () => this.#init()
    }


    #init() {
        if (this.params.autorun !== false) this.params.autorun = true
        if (this.params.fpsLimit === undefined) this.params.fpsLimit = 63
        this.#fpsTime = 1000 / this.params.fpsLimit
        if (this.params.fontRatio === undefined) this.params.fontRatio = 1
        this.params.ratio = this.params.ratio || 1
        if (this.params.ratio == 'auto') this.params.ratio = innerWidth / innerHeight
        if (this.params.volume === undefined) this.volume = 1
        else this.volume = this.params.volume
        if (this.params.volDist === undefined) this.volDist = 700
        else this.volDist = this.params.volDist
        if (this.params.scene === undefined) this.scene = ''
        else this.scene = this.params.scene

        this.#initHTML()
        this.#initCanvas()
        this.#initMobileControl()
        this.#initMouse()
        this.#initKeys()

        this.resizeWin()
        window.onresize = () => this.resizeWin()

        if (this.params.borders) {
            this.params.borders = this.params.borders.split(',')
            if (this.params.borders[0]) this.params.borders[0] = this.params.borders[0].trim()
            if (this.params.borders[1]) this.params.borders[1] = this.params.borders[1].trim()
            if (this.params.borders[2]) this.params.borders[2] = this.params.borders[2].trim()
        }


        let plOk = true, plTxt
        if (!this.params.platform) this.params.platform = 'pc'
        if (this.isMobile && !this.params.platform.includes('mobile')) {
            plTxt = this.params.platformError || 'Use only on PC'
            plOk = false
        }
        if (!this.isMobile && !this.params.platform.includes('pc')) {
            plTxt = this.params.platformError || 'Use only on mobile'
            plOk = false
        }
        if (this.params.platform == 'all') plOk = true
        if (!plOk) {
            this.curtainIn.innerHTML = plTxt
            return
        }

        this.fps = 0
        this.#fpsSch = 0
        setInterval(() => {
            this.fps = this.#fpsSch
            this.#fpsSch = 0
        }, 1000)


        window.onfocus = () => {
            if (this.STOP) return
            if (this.tabActive === false) {
                this.tabActive = true
                this.inActPause = false
                this.#soundsPause(false, 'act')
            }
        }
        window.onblur = () => {
            if (this.tabActive === true) {
                this.tabActive = false
                this.inActPause = true
                this.#soundsPause(true, 'act')
            }
        }

        window.oncontextmenu = function () {
            return false;
        }

        this.#loadResources()
    }


    #initHTML() {
        let viewPortTag = document.createElement('meta');
        viewPortTag.id = "viewport";
        viewPortTag.name = "viewport";
        viewPortTag.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0";
        document.head.appendChild(viewPortTag)

        document.body.style.cssText = `
            background-color: `+ (this.params.bodyColor || '#eee') + `;
            font-family: `+ (this.params.textFont || 'Tahoma') + `;
            color: `+ (this.params.textColor || '#555') + `;
            overflow: hidden;
            user-select: none;
            margin: 0px;
        `

        this._consDiv = document.createElement('div')
        this._consDiv.style.cssText = `
            position: absolute; 
            z-index: 999; 
            top: 0px; 
            left: 0px; 
            max-height: 50vh; 
            max-width: 50vw; 
            min-width: 150px;
            overflow-y: auto; 
            opacity: 0.7; 
            display: `+ (this.params.log ? 'block' : 'none') + `; 
            padding: 10px;
            font-size: 11px; 
            color: #000;
            background-color: #fffa;
            word-wrap: break-word;
            pointer-events: none;
            border-radius: 0 0 5px 0;
        `
        document.body.appendChild(this._consDiv)

        if (this.params.icon) {
            let link = document.createElement('link')
            link.rel = 'icon'
            link.href = this.params.icon
            document.head.appendChild(link)
        }
        if (this.params.name) {
            if (!document.createElement('title')) document.createElement('title')
            document.title = this.params.name
        }

        this.curtain = document.getElementById('mgmCurtain')
        if (!this.curtain) {
            this.curtain = document.createElement('div')
            this.curtain.id = 'mgmCurtain'
            document.body.appendChild(this.curtain)
        }

        this.curtain.style.cssText += `
            position: absolute; 
            top: 0; 
            left: 0; 
            height: 100%; 
            width: 100%; 
            background: ` + document.body.style.backgroundColor + `; 
            z-index: 9999; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            line-height: 300%;`
        this.curtainIn = document.createElement('div')
        this.curtain.appendChild(this.curtainIn)
        this.curtainIn.style.cssText = 'text-align: center; padding: 30px;'
        if (this.params.startStyle)
            this.curtainIn.style.cssText += this.params.startStyle
        this.curtainIn.innerHTML = '<b>MGM.js</b><br><small>0/0</small>'
    }


    set canvasColor(col) {
        this.canvas.style.backgroundColor = col
    }

    set bodyColor(col) {
        document.body.style.backgroundColor = col
    }


    #initCanvas() {
        this.canvas = document.createElement('canvas')
        this.canvas.classList.add('mgm-canvas')
        this.canvas.style.cssText = `
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
        `
        if (this.params.pixel)
            this.canvas.style.cssText += 'image-rendering: pixelated; image-rendering: crisp-edges;'

        this._defCtxText = {
            textAlign: 'left',
            fontColor: document.body.style.color,
            fontSize: 25,
            fontFamily: 'Tahoma',
            fontWeight: 'normal',
        }
        this.context = this.canvas.getContext('2d')
        if (this.params.canvasColor) this.canvas.style.backgroundColor = this.params.canvasColor
        if (this.params.cursor === false) this.canvas.style.cursor = 'none'
        document.body.appendChild(this.canvas)

        if (this.params.canvasFilter)
            this.canvas.style.filter = this.params.canvasFilter

    }

    #touchBtns = []
    #touchSticks = []
    #touchSK = {}
    #initMobileControl() {
        this.resizeWin()
        this.touch = {}
        this.touchS = {}
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        if (!this.isMobile) return

        this.touches = []

        this.touchJoy = {}
        this.touchesJoy = []

        if (!this.params.mobileStyle) this.params.mobileStyle = {}

        const touchFn = e => {
            this.touches = e.touches
            for (let i = 0; i < this.touches.length; i++) {
                const ti = this.touches[i]
                ti.px = ti.clientX - this.canvas.cpos.left
                ti.py = ti.clientY - this.canvas.cpos.top
                ti.x = ti.px / this.kfHeight - this.canvCX + this.camera.x
                ti.y = -ti.py / this.kfHeight + this.canvCY + this.camera.y
            }
            if (this.touches[0]) {
                this.touch.down = true
                this.touch.x = this.touches[0].x
                this.touch.y = this.touches[0].y
                this.touch.px = this.touches[0].px
                this.touch.py = this.touches[0].py
                this.touch.wx = this.touches[0].clientX
                this.touch.wy = this.touches[0].clientY
            } else {
                this.touch.down = false
            }
        }

        const touchFnJoy = e => {
            this.touchesJoy = e.touches
            for (let i = 0; i < this.touchesJoy.length; i++) {
                const ti = this.touchesJoy[i]
                ti.px = ti.clientX - this.canvas.cpos.left
                ti.py = ti.clientY - this.canvas.cpos.top
                ti.x = ti.px / this.kfHeight - this.canvCX + this.camera.x
                ti.y = -ti.py / this.kfHeight + this.canvCY + this.camera.y
            }
            if (this.touchesJoy[0]) {
                this.touchJoy.down = true
                this.touchJoy.x = this.touchesJoy[0].x
                this.touchJoy.y = this.touchesJoy[0].y
                this.touchJoy.px = this.touchesJoy[0].px
                this.touchJoy.py = this.touchesJoy[0].py
                this.touchJoy.wx = this.touchesJoy[0].clientX
                this.touchJoy.wy = this.touchesJoy[0].clientY
            } else {
                this.touchJoy.down = false
            }
        }

        document.addEventListener("contextmenu", e => e.preventDefault())
        document.addEventListener("touchstart", touchFnJoy)
        document.addEventListener("touchend", touchFnJoy)
        document.addEventListener("touchmove", touchFnJoy)

        this.canvas.addEventListener("contextmenu", e => e.preventDefault())
        this.canvas.addEventListener("touchstart", touchFn)
        this.canvas.addEventListener("touchend", touchFn)
        this.canvas.addEventListener("touchmove", touchFn)

        const color = this.params.mobileColor || 'gray'
        const styleBtn = 'position: absolute; background-color: ' + color + '; border: 2px solid ' + color + '; border-radius: 100px; z-index: 1000;'
        if (!this.params.mobileControl) this.params.mobileControl = ''

        this.params.mobileControl.split(',').forEach(c => {
            const name = c.trim()

            let bcrd = ''
            if (name == 'br1') bcrd = 'right: 20px; bottom: 40px;'
            if (name == 'br2') bcrd = 'right: 20px; bottom: 120px;'
            if (name == 'br3') bcrd = 'right: 100px; bottom: 40px;'
            if (name == 'br4') bcrd = 'right: 100px; bottom: 120px;'
            if (name == 'bl1') bcrd = 'left: 20px; bottom: 40px;'
            if (name == 'bl2') bcrd = 'left: 20px; bottom: 120px;'
            if (name == 'bl3') bcrd = 'left: 100px; bottom: 40px;'
            if (name == 'bl4') bcrd = 'left: 100px; bottom: 120px;'
            if (name == 'bc1') bcrd = 'left: calc(50% - 32px); bottom: 40px;'
            if (name == 'bc2') bcrd = 'left: calc(50% - 32px); bottom: 120px;'

            if (bcrd != '') {
                const btn = document.createElement('div')
                btn.style.cssText = styleBtn + bcrd + 'width: 60px; height: 60px; opacity: 0.3;'
                document.body.appendChild(btn)
                this.touch[name] = false
                const cpos = btn.getBoundingClientRect()
                const left = cpos.left - this.canvas.cpos.left
                const top = cpos.top - this.canvas.cpos.top
                this.#touchBtns.push({
                    el: btn,
                    name: name,
                    x1: left,
                    y1: top,
                    x2: left + cpos.width,
                    y2: top + cpos.height,
                })
            }

            let bst = ''
            if (name == 'stickL') bst = 'left: 40px; bottom: 40px;'
            if (name == 'stickR') bst = 'right: 40px; bottom: 40px;'

            if (bst != '') {
                this.touch[name] = {
                    down: false,
                    angle: 0,
                }
                const stick = document.createElement('div')
                stick.style.cssText = styleBtn + bst + ' width: 120px; height: 120px; opacity: 0.3;'
                document.body.appendChild(stick)
                this.touch[name] = false
                const cpos = stick.getBoundingClientRect()
                const left = cpos.left - this.canvas.cpos.left
                const top = cpos.top - this.canvas.cpos.top
                this.#touchSticks.push({
                    el: stick,
                    name: name,
                    x1: left,
                    y1: top,
                    x2: left + cpos.width,
                    y2: top + cpos.height,
                    px: left + 60,
                    py: top + 60,
                    d1: 10,
                    d2: 60,
                })
            }
        })

        this.#touchBtns.forEach(btn => {
            for (const j in this.params.mobileStyle)
                for (const k in this.params.mobileStyle[j])
                    if (btn.name == j)
                        btn.el.style[k] = this.params.mobileStyle[j][k]
        })

        this.#touchSticks.forEach(stick => {
            for (const j in this.params.mobileStyle)
                for (const k in this.params.mobileStyle[j])
                    if (stick.name == j)
                        stick.el.style[k] = this.params.mobileStyle[j][k]
        })

    }


    #initMouse() {
        this.mouse = { x: 0, y: 0, px: 0, py: 0, cx: 0, cy: 0 }

        if (this.isMobile) return


        this.canvas.onmousemove = e => {
            this.mouse.px = e.pageX - this.canvas.cpos.left
            this.mouse.py = e.pageY - this.canvas.cpos.top
            this.mouse.cx = this.mouse.px / this.kfHeight - this.canvCX
            this.mouse.cy = -this.mouse.py / this.kfHeight + this.canvCY
        }
        this.canvas.onmousedown = e => {
            this.mouse.down = true
            this.mouse.up = false
            this.mouse.which = e.which
        }
        this.canvas.onmouseup = e => {
            this.mouse.down = false
            this.mouse.up = true
            this.mouse.which = e.which
        }
        this.canvas.mouseenter = e => {
            console.log(e);
        }
    }


    #initKeys() {
        this.keys = {}
        this.press = {}
        this.pressK = {}


        let keyNums = {
            38: 'up', 40: 'down', 37: 'left', 39: 'right',
            32: 'space', 13: 'enter', 27: 'escape', 16: 'shift', 17: 'ctrl', 8: 'backspace',
            65: 'a', 66: 'b', 67: 'c', 68: 'd', 69: 'e', 70: 'f', 71: 'g', 72: 'h', 73: 'i', 74: 'j', 75: 'k', 76: 'l', 77: 'm', 78: 'n', 79: 'o', 80: 'p', 81: 'q', 82: 'r', 83: 's', 84: 't', 85: 'u', 86: 'v', 87: 'w', 88: 'x', 89: 'y', 90: 'z',
            48: 'n0', 49: 'n1', 50: 'n2', 51: 'n3', 52: 'n4', 53: 'n5', 54: 'n6', 55: 'n7', 56: 'n8', 57: 'n9',
        }
        for (let j in keyNums) this.keys[keyNums[j]] = false
        for (let j in keyNums) this.press[keyNums[j]] = false

        document.onkeydown = (e) => {
            e = e || window.event
            let k = keyNums[e.keyCode]
            this.keys[k] = true

            if (!this.pressK[k]) {
                this.press[k] = true
                this.pressK[k] = true
                setTimeout(() => this.pressK[k] = false, 100)
            }
        }
        document.onkeyup = (e) => {
            e = e || window.event
            this.keys[keyNums[e.keyCode]] = false
        }
    }


    #loadResources() {
        this.#build.resAll = 0
        this.#build.resLoad = 0

        for (const j in this.object) {
            if (this.object[j].pic) {
                this.object[j].pics = {
                    _one: this.object[j].pic
                }
            }
            if (this.object[j].pics) {
                this.object[j]._pics = {}
                for (const k in this.object[j].pics) {
                    if (typeof this.object[j].pics[k] == 'string')
                        this.object[j]._pics[k] = this.#loadPic(this.object[j].pics[k])
                    if (typeof this.object[j].pics[k] == 'object') {
                        if (!this.object[j].pics[k].picName) this.object[j].pics[k].picName = '_one'
                        this.object[j]._pics[k] = this.object[j].pics[k]
                    }
                }
            }
        }

        for (const j in this.object) {
            if (this.object[j].sound) {
                this.object[j].sounds = {
                    _one: this.object[j].sound
                }
            }
            if (this.object[j].sounds)
                for (let k in this.object[j].sounds)
                    this.object[j].sounds[k] = this.#loadSound(this.object[j].sounds[k])
        }

        let loadWait = setInterval(() => {
            this.curtainIn.innerHTML = '<b>MGM.js</b><br><small>' + this.#build.resLoad + " / " + this.#build.resAll + '</small>'
            if (this.#build.resAll == this.#build.resLoad) {
                clearInterval(loadWait)
                setTimeout(() => {
                    this.#build.isLoad = true
                    if (this.params.autorun !== false) this.#startGame()
                    else {
                        this.curtainIn.innerHTML = this.params.startText || '<center><b>Start1</b><br><br><small>click to run</small></center>'
                        this.curtain.onclick = () => {
                            if (!this.STOP) this.#startGame()
                        }
                    }
                }, 1000)
            }
        }, 10)
    }


    #startGame() {
        if (this.params.fullscreen && this.params.autorun === false)
            this.#toggleFullScreen()
        this.curtainIn.innerHTML = ''
        if (document.querySelector('.mgm-plane'))
            document.querySelector('.mgm-plane').style.display = 'block'
        this.resizeWin()
        this.objectsId = 0
        this.RUN = true
        this.clearGame()

        setTimeout(() => {
            this.curtain.style.display = 'none'
            let now, elapsed,
                then = Date.now()
            const animate = () => {
                requestAnimationFrame(animate)
                now = Date.now()
                elapsed = now - then
                if (elapsed > this.#fpsTime) {
                    then = now - (elapsed % this.#fpsTime)
                    this.#loopGame()
                }
            }
            animate()
        }, 100)
    }











    clearGame(reObj = true) {
        this.objects = []
        this.noconts = []
        this.zList = []
        this.camera = { x: 0, y: 0 }
        if (reObj) this.#initObjs()
    }


    setScene(name) {
        this.#soundsPause(true, 'run')
        this.scene = name
        this.clearGame()
    }


    #loadPic(src) {
        this.#build.resAll++
        const img = new Image()
        img.src = src
        img.onload = () => {
            this.#build.resLoad++
        }
        return img
    }


    #loadSound(prm) {
        const sound = new Audio()
        let src = prm

        if (typeof prm == 'object') sound.src = prm.src
        else sound.src = prm


        if (prm.volume !== undefined) {
            sound.vol = prm.volume
            sound.volume = prm.volume
        } else {
            sound.vol = 1
            sound.volume = 1
        }

        this.#build.resAll++
        sound.onloadstart = () => {
            this.#build.resLoad++
        }

        sound._actPause = false
        sound._setActPause = (paused, snd) => {
            if (paused) {
                if (!snd.paused) {
                    snd.pause()
                    snd._actPause = true
                }
            } else {
                if (snd._actPause) {
                    snd.play()
                    snd._actPause = false
                }
            }
        }
        sound._runPause = false
        sound._setRunPause = (paused, snd) => {
            if (paused) {
                if (!snd.paused) {
                    snd.pause()
                    snd._runPause = true
                }
            } else {
                if (snd._runPause) {
                    snd.play()
                    snd._runPause = false
                }
            }
        }

        return sound
    }


    resizeWin() {
        let height = innerHeight
        let width = innerHeight * this.params.ratio
        if (width > innerWidth) {
            height = innerWidth / this.params.ratio
            width = innerWidth
        }

        this.canvas.style.width = width + 'px'
        this.canvas.style.height = height + 'px'
        this.params.quality = this.params.quality || 1000
        this.canvas.width = this.params.quality * this.params.ratio
        this.canvas.height = this.params.quality
        this.kfHeight = height / this.params.quality
        this.canvCX = this.canvas.width / 2
        this.canvCY = this.canvas.height / 2
        this.canvas.cpos = this.canvas.getBoundingClientRect()
        document.body.style.fontSize = (this.params.fontRatio * (height / 40)) + 'px'

        const cpos = this.canvas.cpos
        const kh = cpos.height / this.params.quality

        document.querySelectorAll('.mgm').forEach(el => {
            el.style.position = 'absolute'
            if (getComputedStyle(el).zIndex == 'auto') el.style.zIndex = 1
            el.style.boxSizing = 'border-box'

            let left = parseFloat(el.getAttribute('mgm-left'))
            let right = parseFloat(el.getAttribute('mgm-right'))
            let top = parseFloat(el.getAttribute('mgm-top'))
            let bottom = parseFloat(el.getAttribute('mgm-bottom'))
            let x = parseFloat(el.getAttribute('mgm-x'))
            let y = parseFloat(el.getAttribute('mgm-y'))
            let w = parseFloat(el.getAttribute('mgm-width'))
            let h = parseFloat(el.getAttribute('mgm-height'))

            if (!isNaN(w)) el.style.width = (w * kh) + 'px'
            if (!isNaN(h)) el.style.height = (h * kh) + 'px'
            if (isNaN(x) && isNaN(right) && isNaN(left)) left = 0
            if (isNaN(y) && isNaN(bottom) && isNaN(top)) top = 0

            const elPos = el.getBoundingClientRect()

            if (!isNaN(left)) el.style.left = (cpos.left + left * kh) + 'px'
            if (!isNaN(right)) el.style.left = (cpos.right - right * kh - elPos.width) + 'px'
            if (!isNaN(top)) el.style.top = (cpos.top + top * kh) + 'px'
            if (!isNaN(bottom)) el.style.top = (cpos.bottom - bottom * kh - elPos.height) + 'px'
            if (!isNaN(x)) el.style.left = (cpos.left + this.canvCX * kh + x * kh) + 'px'
            if (!isNaN(y)) el.style.top = (cpos.top + this.canvCY * kh - y * kh) + 'px'

            if (el.style.padding != '') {
                if (!el.mgmPadding) el.mgmPadding = parseInt(el.style.padding.replace('px', ''))
                el.style.padding = (el.mgmPadding * kh) + 'px'
            }
        })

        this.#touchBtns.forEach(btn => {
            const cpos = btn.el.getBoundingClientRect()
            const left = cpos.left - this.canvas.cpos.left
            const top = cpos.top - this.canvas.cpos.top
            btn.x1 = left
            btn.y1 = top
            btn.x2 = left + cpos.width
            btn.y2 = top + cpos.height
        })

        this.#touchSticks.forEach(stick => {
            const cpos = stick.el.getBoundingClientRect()
            const left = cpos.left - this.canvas.cpos.left
            const top = cpos.top - this.canvas.cpos.top
            stick.x1 = left
            stick.y1 = top
            stick.x2 = left + cpos.width
            stick.y2 = top + cpos.height
            stick.px = left + 60
            stick.py = top + 60
        })

        if (this.objectsId > 0) this.#loopDraw()
    }


    firstV(m) {
        for (const v in m) return m[v]
    }


    firstJ(m) {
        for (const j in m) return j
    }


    #initObjs() {
        for (const j in this.object) {
            this.object[j].name = j
            this.object[j] = new MGMObject({
                name: j,
                _mgm: this
            })
        }

        this.#build.isInitAll = true

    }


    #mouseLoop() {
        if (this.isMobile) return
        this.mouse.x = this.mouse.cx + this.camera.x
        this.mouse.y = this.mouse.cy + this.camera.y
    }

    #touchLoop() {
        if (!this.isMobile) return

        for (const btn of this.#touchBtns) this.touch[btn.name] = false
        for (const stick of this.#touchSticks) this.touch[stick.name] = false

        let joy = false

        for (const ti of this.touchesJoy) {
            for (const btn of this.#touchBtns) {
                if (ti.px > btn.x1 && ti.px < btn.x2
                    && ti.py > btn.y1 && ti.py < btn.y2
                ) {
                    this.touch[btn.name] = true
                    if (!this.#touchSK[btn.name]) {
                        this.touchS[btn.name] = true
                        this.#touchSK[btn.name] = true
                        setTimeout(() => this.#touchSK[btn.name] = false, 100)
                    }
                    joy = true
                }
            }

            for (const stick of this.#touchSticks) {
                if (ti.px > stick.x1 && ti.px < stick.x2
                    && ti.py > stick.y1 && ti.py < stick.y2
                ) {
                    const d = this.distanceXY(ti.px, ti.py, stick.px, stick.py)
                    if (d > stick.d1 && d < stick.d2)
                        this.touch[stick.name] = -this.angleXY(stick.px, stick.py, ti.px, ti.py) + 180
                    if (this.touch[stick.name] > 180) this.touch[stick.name] -= 360
                    if (d < stick.d2) joy = true
                }
            }
        }

        if (joy) this.touch.down = false
    }


    #loopGame(a) {
        if (this.inActPause) return
        if (this.inRunPause) return
        if (!this.RUN) return


        if (this.params.log) {
            this._consDiv.style.display = 'block'
            this._consDiv.innerHTML = ''
        } else this._consDiv.style.display = 'none'

        this.#mouseLoop()
        this.#touchLoop()
        this.#loopDraw()
        this.#loopUpdate()

        if (this.params.log) this.#loopLog()

        this.sch10++
        this.sch100++
        this.sch1000++
        if (this.sch10 == 10) this.sch10 = 0
        if (this.sch100 == 100) this.sch100 = 0
        if (this.sch1000 == 1000) this.sch1000 = 0

        this.#fpsSch++
        this.frame++

        if (!this.isMobile) for (const k in this.press) this.press[k] = false
        else for (const k in this.touchS) this.touchS[k] = false
    }

    #loopEditor() {
        this.#loopDraw()
    }


    #loopUpdate() {
        let i = 0
        for (const obj of this.objects) {
            if (!obj._toDel) obj._update()
            else {
                if (obj.stop) obj.stop()
                obj.active = false
                this.objects.splice(i, 1)
            }
            i++
        }

        i = 0
        for (const obj of this.noconts) {
            if (!obj._toDel) obj._update()
            else {
                if (obj.stop) obj.stop()
                obj.active = false
                this.noconts.splice(i, 1)
            }
            i++
        }
    }


    #loopDraw() {
        if (!this.params.noClear)
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

        const mas = []
        const gr = 0
        this.indraws = 0
        this._physMas = []

        for (const obj of this.objects) {
            let ok = true
            let draw = false
            if (obj.hidden) ok = false
            else if (obj.active === false) ok = false
            else if (obj._toDel === false) ok = false

            if (obj._noDrawS === true) {
                ok = false
            }

            if (ok)
                if (obj.inDraw || obj.onCamera) draw = true
                else if (obj.y - obj.collider._py + obj._height2 > obj._mgm.camera.y - obj._mgm.canvCY + gr &&
                    obj.y - obj.collider._py - obj._height2 < obj._mgm.camera.y + obj._mgm.canvCY - gr &&
                    obj.x + obj.collider._px - obj._width2 < obj._mgm.camera.x + obj._mgm.canvCX - gr &&
                    obj.x + obj.collider._px + obj._width2 > obj._mgm.camera.x - obj._mgm.canvCX + gr
                ) draw = true

            if (ok && draw) {
                mas.push(obj)
                obj._drawing = true
                this.indraws++
            } else obj._drawing = false

            if (ok && obj.physics) this._physMas.push(obj)
        }

        for (const obj of this.noconts) {
            let ok = true
            let draw = false
            if (obj.hidden) ok = false
            else if (obj.active === false) ok = false
            else if (obj._toDel === false) ok = false

            if (obj._noDrawS === true) {
                ok = false
            }

            if (ok)
                if (obj.inDraw || obj.onCamera) draw = true
                else if (obj.y - obj.collider._py + obj._height2 > obj._mgm.camera.y - obj._mgm.canvCY + gr &&
                    obj.y - obj.collider._py - obj._height2 < obj._mgm.camera.y + obj._mgm.canvCY - gr &&
                    obj.x + obj.collider._px - obj._width2 < obj._mgm.camera.x + obj._mgm.canvCX - gr &&
                    obj.x + obj.collider._px + obj._width2 > obj._mgm.camera.x - obj._mgm.canvCX + gr
                ) draw = true

            if (ok && draw) {
                mas.push(obj)
                obj._drawing = true
                this.indraws++
            } else obj._drawing = false
        }


        if (this.params.orderY) mas.sort(this.#orderY)

        for (const z of this.zList)
            for (const obj of mas)
                if (obj.z == z)
                    obj._draw()
    }




    #loopLog() {
        let prms = ''
        for (const j in this.#logPrms)
            prms += '<br>' + j + ': ' + this.#logPrms[j]

        this.#logs = this.#logs.splice(-300)
        this._consDiv.innerHTML = '> ' + this.#logs.join('<br>> ')
            + prms
            + '<hr>fps: ' + this.fps + ', frame: ' + this.frame
            + '<br>objs: ' + this.objects.length + ', nocons: ' + this.noconts.length
            + '<br>indraw: ' + this.indraws

        this._consDiv.scrollTop = 10000
    }


    #soundsPause(paused, tip) {
        if (!this.objects && !this.noconts) return

        if (tip == 'act') {
            for (const obj of this.objects)
                if (obj.sounds)
                    for (const j in obj.sounds)
                        obj.sounds[j]._setActPause(paused, obj.sounds[j])
            for (const obj of this.noconts)
                if (obj.sounds)
                    for (const j in obj.sounds)
                        obj.sounds[j]._setActPause(paused, obj.sounds[j])
        }

        if (tip == 'run') {
            for (const obj of this.objects)
                if (obj.sounds)
                    for (const j in obj.sounds)
                        obj.sounds[j]._setRunPause(paused, obj.sounds[j])
            for (const obj of this.noconts)
                if (obj.sounds)
                    for (const j in obj.sounds)
                        obj.sounds[j]._setRunPause(paused, obj.sounds[j])
        }
    }


    #orderY(a, b) {
        if (a.y < b.y) return 1;
        if (a.y > b.y) return -1;
        return 0;
    }

    fullscreen() {
        this.#toggleFullScreen()
    }

    #toggleFullScreen() {
        var doc = window.document;
        var docEl = doc.documentElement;

        var requestFullScreen =
            docEl.requestFullscreen ||
            docEl.mozRequestFullScreen ||
            docEl.webkitRequestFullScreen ||
            docEl.msRequestFullscreen;
        var cancelFullScreen =
            doc.exitFullscreen ||
            doc.mozCancelFullScreen ||
            doc.webkitExitFullscreen ||
            doc.msExitFullscreen;

        if (
            !doc.fullscreenElement &&
            !doc.mozFullScreenElement &&
            !doc.webkitFullscreenElement &&
            !doc.msFullscreenElement
        ) {
            requestFullScreen.call(docEl);
        } else {
            cancelFullScreen.call(doc);
        }
    }


    _objInArr(obj, arr) {
        for (const a of arr)
            if (a.objectId === obj.objectId)
                return true
    }


    loadScript(url) {
        if (!url) return
        const s = document.createElement('script')
        document.head.appendChild(s)
        s.src = url
        s.onload = () => console.log('load: ' + url)
    }


    pause() {
        this.RUN = false
        this.inRunPause = true
        this.#soundsPause(true, 'run')
    }


    run() {
        if (this.STOP) return
        this.RUN = true
        this.inRunPause = false
        this.#soundsPause(false, 'run')
    }


    stop(txt) {
        console.log('stop');
        this.RUN = false
        this.STOP = true
        this.inRunPause = true
        if (txt || this.params.stopText) {
            this.curtainIn.innerHTML = txt || this.params.stopText
        }
        this.#soundsPause(true, 'run')
    }


    restart(url = '') {
        location.href = url
    }


    urlParse() {
        return location.search.replace('?', '').split('&')
            .reduce(function (s, c) {
                var t = c.split('=');
                s[t[0]] = t[1]; return s;
            }, {});
    }


    setSave(prm) {
        const save = JSON.parse(localStorage['MgmSave'] || '{}')
        save[decodeURI(location.pathname)] = prm
        localStorage['MgmSave'] = JSON.stringify(save)
    }


    getSave() {
        const save = JSON.parse(localStorage['MgmSave'] || '{}')
        return save[decodeURI(location.pathname)] || {}
    }


    random(min, max) {
        if (min !== undefined && max !== undefined)
            return Math.floor(Math.random() * (max - min + 1)) + min;
        else if (min == 1 && max === undefined) {
            if (Math.random() >= 0.5) return 1
            else return -1
        } else {
            if (Math.random() >= 0.5) return true
            else return false
        }
    }


    angleXY(x1, y1, x2, y2) {
        let angle = Math.atan2(x2 - x1, y2 - y1) * 180 / Math.PI
        if (angle > 180) angle -= 360
        if (angle < -180) angle += 360
        return angle
    }


    angleObj(obj1, obj2) {
        if (!obj1 || !obj2) return
        if (obj1.active === false) return
        if (obj2.active === false) return
        return this.angleXY(obj1.x, obj1.y, obj2.x, obj2.y)
    }


    distanceXY(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
    }


    distanceObj(obj1, obj2) {
        if (!obj1 || !obj2) return
        if (obj1.active === false) return
        if (obj2.active === false) return
        return this.distanceXY(obj1.x, obj1.y, obj2.x, obj2.y)
    }


    clone(prm) {
        prm._mgm = this
        prm.isClone = true
        const obj = new MGMObject(prm)
        return obj
    }


    newClone(prm) {
        prm._mgm = this
        prm.isClone = true
        prm._new = true
        const obj = new MGMObject(prm)
        return obj
    }


    getObj(prm, key = 'name') {
        for (const obj of this.objects)
            if (obj.active !== false && obj[key] == prm)
                return obj
    }


    getObjs(prm, key = 'name') {
        let ot = []

        if (prm)
            for (const obj of this.objects)
                if (obj.active !== false)
                    if (obj[key] == prm) ot.push(obj)

        if (!prm)
            for (const obj of this.objects)
                if (obj.active !== false)
                    ot.push(obj)

        return ot
    }


    getStep(angle, dist) {
        const rad = angle * Math.PI / 180;
        return {
            x: dist * Math.sin(rad),
            y: dist * Math.cos(rad)
        }
    }


    printText(to, txt, speed = 30, cp) {
        const m = txt.split(' ')
        let i = 0
        if (!cp) cp = ['.', '!', '?', ';']
        word()
        function word() {
            let w = m[i]
            let c = 0
            const div = document.createElement('div')
            div.style.display = 'inline-block'
            div.innerHTML = w
            to.appendChild(div)
            const cpos = div.getBoundingClientRect()
            div.style.width = cpos.width + 'px'
            div.innerHTML = ' '
            char()
            i++
            function char() {
                let s = speed
                if (cp.indexOf(w[c]) > -1) s *= 50
                div.innerHTML += w[c]
                c++
                if (c < w.length) setTimeout(char, s)
                else if (i < m.length) {
                    to.innerHTML += ' '
                    to.scroll({ top: 1000000 })
                    setTimeout(word, s)
                } else to.scroll({ top: 1000000 })
            }
        }
    }


    round(n, t) {
        return Math.round(n * t) / t
    }


    log(s) {
        this.#logs.push(s)
    }


    logPrm(n, v) {
        this.#logPrms[n] = v
    }


    lim(v, min = 0, max = 1) {
        if (v < min) v = min
        if (v > max) v = max
        return v
    }


    htmlWin(t, id, fn) {
        let el = document.getElementById(id)

        if (t == 'hide') {
            el.style.opacity = 0
            el.style.pointerEvents = 'none'
        }
        if (t == 'show') {
            el.style.opacity = 1
            el.style.pointerEvents = 'all'
        }
        if (t == 'fadeOut') {
            let op = 1
            let ai = setInterval(() => {
                el.style.opacity = op
                op -= 0.1
                if (op < 0.1) {
                    el.style.opacity = 0
                    el.style.pointerEvents = 'none'
                    clearInterval(ai)
                    if (fn) fn()
                }
            }, 30)
        }
        if (t == 'fadeIn') {
            let op = 0
            el.style.display = 'block'
            el.style.pointerEvents = 'all'
            let ai = setInterval(() => {
                el.style.opacity = op
                op += 0.1
                if (op > 0.9) {
                    el.style.opacity = 1
                    clearInterval(ai)
                    if (fn) fn()
                }
            }, 30)
        }
    }








}




















class MGMObject {
    constructor(params) {

        let obj
        if (params.name) {
            obj = params._mgm.object[params.name]
        }

        if (!obj)
            if (params._new) obj = params
            else {
                console.log('ERROR - no original object:', params.name);
                return
            }

        if (params.isClone) this.isClone = true

        if (obj.scene === undefined) this.scene = ''
        else this.scene = obj.scene

        if (!obj.nocont && params._mgm.objects.length > 10000) return
        if (obj.nocont && params._mgm.noconts.length > 10000) return

        for (const j in obj) {
            const v = obj[j]
            if (j == 'pic' || j == 'pics' || j == '_pics' || j == 'picName' ||
                j == 'anim' || j == '_animName' ||
                j == 'name' || j == '_mgm' ||
                j == 'obj' ||
                typeof v == 'function') this[j] = v
            else if (j == 'sounds') {
                this[j] = {}
                for (const s in v) {
                    this[j][s] = v[s].cloneNode()
                    this[j][s]._setActPause = v[s]._setActPause
                    this[j][s]._setRunPause = v[s]._setRunPause
                    this[j][s].volume = v[s].volume
                    this[j][s].vol = v[s].vol
                    this[j][s].loop = v[s].loop
                }
            } else {
                if (this.isClone) this[j] = JSON.parse(JSON.stringify(v))
            }
        }


        this._mgm = params._mgm
        this._mgm.objectsId++
        this.objectId = this._mgm.objectsId

        if (params.active !== false) this.active = true
        if (!this.collider) this.collider = {}

        if (this._pics)
            for (const j in this._pics)
                if (this._pics[j].picName) {
                    if (this._pics[j].object)
                        this._pics[j]._pic = this._mgm.object[this._pics[j].object]._pics[this._pics[j].picName]
                    else
                        this._pics[j]._pic = this._pics[this._pics[j].picName]
                }

        if (this.anim && !this._anima) {
            this._anima = {
                frame: 0,
                sch: 0,
                name: undefined,
                pics: undefined,
                length: 0,
            }
            if (this.anim.speed === undefined) this.anim.speed = 5
        }

        if (!this.isClone && this.init) this.init(this)

        if (this.isClone) for (const j in params) this[j] = params[j]

        this._goStart = true


        this.#init()

        if (this.scene != params._mgm.scene) return

        if (!this.nocont) this._mgm.objects.push(this)
        else this._mgm.noconts.push(this)
    }


    #init() {

        if (this.x === undefined) this.x = 0
        if (this.y === undefined) this.y = 0
        if (this.z === undefined) this.z = 0
        this.#setZLayer()

        if (this.rotation === undefined) this.rotation = 0
        if (this.angle === undefined) this.angle = 0
        if (this.size === undefined) this.size = 1
        if (this.alpha === undefined) this.alpha = 1

        if (this.collider.width === undefined) this.collider.width = 1
        if (this.collider.height === undefined) this.collider.height = 1
        if (this.collider.x === undefined) this.collider.x = 0
        if (this.collider.y === undefined) this.collider.y = 0
        if (this.collider.px === undefined) this.collider.px = 0
        if (this.collider.py === undefined) this.collider.py = 0

        if (this.physics && this.mass) {
            if (!this.gravVel) this.gravVel = 0
            if (this.onGround === undefined) this.onGround = false
        }

        if (this.border && typeof this.border == 'string') {
            this.border = this.border.split(',')
            if (this.border[0]) this.border[0] = this.border[0].trim()
            if (this.border[1]) this.border[1] = this.border[1].trim()
        }

        if (this.cameraZX === undefined) this.cameraZX = 1
        if (this.cameraZY === undefined) this.cameraZY = 1
        if (this.cameraZ) {
            this.cameraZX = this.cameraZ
            this.cameraZY = this.cameraZ
        }

        if (this.flipXV === undefined) this.flipXV = 1
        if (this.flipYV === undefined) this.flipYV = 1

        if (this.picName === undefined)
            this.picName = this._mgm.firstJ(this.pics)

        this._wait = {}
        this._pressClick = true
        this._scope = true

        this.#setScope()
        this.#setPivot()
        this.#setCollider()

        this.collider._px = this.collider.px * this._width
        this.collider._py = this.collider.py * this._height

        this._oldScope = {
            x: this.x,
            y: this.y,
            picName: this.picName,
            size: this.size,
            width: this.width,
            height: this.height,
        }
    }


    #setZLayer() {
        if (this._mgm.zList.indexOf(this.z) == -1) {
            this._mgm.zList.push(this.z)
            this._mgm.zList.sort(function (a, b) {
                return a - b;
            })
        }
    }


    _update() {
        if (this._goStart) {
            if (this.start && !this.isClone) this.start(this)
            if (this.stClone && this.isClone) this.stClone(this)
            this.#setZLayer()
            this._noDrawS = true
        }

        this.#animaWork()
        this.#waitsWork()

        if (this.update && this.active) this.update(this)

        if (this.active) {
            if (this.update10 && this._mgm.sch10 == 0) this.update10(this)
            if (this.update100 && this._mgm.sch100 == 0) this.update100(this)
            if (this.update1000 && this._mgm.sch1000 == 0) this.update1000(this)
        }

        this.#work()

        if (this._goStart) delete this._goStart
        if (this._noDrawS) delete this._noDrawS
    }


    #work() {
        if (this.angle < -180) this.angle += 360
        if (this.angle > 180) this.angle -= 360
        if (this.anglePic) this.rotation = this.angle

        if (!this.nocont) {
            this._scope = false
            for (const j in this._oldScope)
                if (this[j] != this._oldScope[j]) {
                    this._scope = true
                    break
                }
        }
        this._scope = true
        this.#setScope()

        if (!this.nocont) {
            if (this.physics && this.mass) {
                if (!this.onGround) this.gravVel -= 0.5
                this.y += this.mass * this.gravVel
            }

            this.#setPivot()
            this.#setCollider()
            this.#physicWork()

            if (this.bounce) {
                this.bounceEv = false
                if (this.collider.right > this._mgm.canvCX
                    || this.collider.left < -this._mgm.canvCX
                ) {
                    this.angle = -this.angle
                    this.bounceEv = true
                }
                if (this.collider.top > this._mgm.canvCY
                    || this.collider.bottom < -this._mgm.canvCY
                ) {
                    this.angle = 180 - this.angle
                    this.bounceEv = true
                }
            }
        }

        this.collider._px = this.collider.px * this._width
        this.collider._py = this.collider.py * this._height

        if (this.atCamera) {
            this._mgm.camera.x = this.x
            this._mgm.camera.y = this.y
        }

        if (this.flipX)
            if (this.angle > 0) this.flipXV = 1
            else this.flipXV = -1
        if (this.flipY)
            if (this.angle > 0 && this.angle < 90) this.flipYV = 1
            else this.flipYV = -1

        if (this._scope)
            this._oldScope = {
                x: this.x,
                y: this.y,
                picName: this.picName,
                size: this.size,
                width: this.width,
                height: this.height,
            }
    }


    #animaWork(start) {
        if (!this._anima) return
        if (!this._anima.name) return
        if (this._drawing) {
            if (this._anima.sch == 0) {
                this._anima.sch = this.anim.speed - 1
                this._anima.frame++
                if (this._anima.frame >= this._anima.length) this._anima.frame = 0
                this.picName = this._anima.pics[this._anima.frame]
            } else this._anima.sch--
        }
    }


    setAnim(name, frame = 0) {
        if (!this._anima) return
        if (name == 'speed') return
        if (name == this._anima.name) return
        this._anima.name = name
        this._anima.frame = frame
        this._anima.pics = this.anim[name]
        this._anima.length = this.anim[name].length
        this.picName = this._anima.pics[frame]
        this._anima.sch = this.anim.speed - 1
    }


    getAnim() {
        return this._anima.name
    }

    #physicWork() {
        if (!this.physics) return
        if (this.active === false) return
        if (this.hidden) return
        if (this.physics == 'wall') return

        this.onGround = false
        let backs = []

        for (const obj of this._mgm._physMas) {
            let ok = true
            let cont = false

            if (this.objectId == obj.objectId) ok = false
            else if (this.physics == 'unit' && obj.physics == 'unit') ok = false
            else if (this.physics == 'unit2' && obj.physics == 'unit') ok = false

            if (ok &&
                this.collider.right > obj.collider.left &&
                this.collider.left < obj.collider.right &&
                this.collider.top > obj.collider.bottom &&
                this.collider.bottom < obj.collider.top
            ) cont = true

            if (ok && cont) {
                let vxRight = obj.collider.left - this.collider.right
                let vxLeft = obj.collider.right - this.collider.left
                let vyTop = obj.collider.bottom - this.collider.top
                let vyBottom = obj.collider.top - this.collider.bottom
                if (Math.abs(vxRight) < Math.abs(vxLeft)) vxLeft = 0
                else vxRight = 0
                if (Math.abs(vyTop) < Math.abs(vyBottom)) vyBottom = 0
                else vyTop = 0
                let backX = vxRight + vxLeft
                let backY = vyTop + vyBottom
                if (Math.abs(backX) < Math.abs(backY)) backY = 0
                else backX = 0
                backs.push([backX, backY])
            }
        }

        let nxR = 0, nxL = 0, nyT = 0, nyB = 0

        for (const m of backs) {
            if (m[0] < nxR) nxR = m[0]
            if (m[0] > nxL) nxL = m[0]
            if (m[1] < nyT) nyT = m[1]
            if (m[1] > nyB) nyB = m[1]
        }

        const nx = this.x + nxL + nxR
        const ny = this.y + nyT + nyB

        if (nx != this.x || ny != this.y) {
            this.x += nxL + nxR
            this.y += nyT + nyB
            this.#setCollider()
        }

        if (this.mass != 0)
            for (const obj of this._mgm.objects)
                if (obj.active && this.objectId != obj.objectId)
                    if (obj.physics == 'wall' || obj.physics == 'unit2')
                        if (this.collider.right - 5 > obj.collider.left &&
                            this.collider.left + 5 < obj.collider.right
                        ) {
                            if (this.collider.top > obj.collider.bottom &&
                                this.collider.bottom - 1 < obj.collider.top) {
                                this.onGround = true
                                this.gravVel = 0
                            }
                            if (this.collider.top + 1 > obj.collider.bottom &&
                                this.collider.bottom < obj.collider.top) {
                                this.gravVel = 0
                            }
                        }
    }


    #setScope() {
        if (!this._scope) return

        this._image = this.#getPic()

        if (this._image) {
            if (this.width === undefined) this._widthA = this._image.width
            else this._widthA = this.width
            if (this.height === undefined) this._heightA = this._image.height
            else this._heightA = this.height
        } else {
            if (this.width === undefined) this._widthA = 1
            else this._widthA = this.width
            if (this.height === undefined) this._heightA = 1
            else this._heightA = this.height
        }

        this._width = this._widthA * this.size
        this._height = this._heightA * this.size
        this._width2 = this._width / 2
        this._height2 = this._height / 2
    }


    #setPivot() {
        if (!this._scope) return

        this.collider._pivotXL = this._width * this.collider.width / 2 - this._width * this.collider.x
        this.collider._pivotXR = this._width * this.collider.width / 2 + this._width * this.collider.x
        this.collider._pivotYB = this._height * this.collider.height / 2 - this._height * this.collider.y
        this.collider._pivotYT = this._height * this.collider.height / 2 + this._height * this.collider.y
    }


    #setCollider() {
        if (!this._scope) return

        this.collider.left = this.x - this.collider._pivotXL
        this.collider.right = this.x + this.collider._pivotXR
        this.collider.top = this.y + this.collider._pivotYT
        this.collider.bottom = this.y - this.collider._pivotYB
    }


    _draw() {
        if (this.onCamera === undefined) {
            this._cameraZXm = - this._mgm.camera.x * this.cameraZX
            this._cameraZYm = this._mgm.camera.y * this.cameraZY
        } else {
            this._cameraZXm = 0
            this._cameraZYm = 0
        }

        this._mgm.context.save()
        this._mgm.context.translate(
            this.x + this._mgm.canvCX + this._cameraZXm,
            -this.y + this._mgm.canvCY + this._cameraZYm
        )

        this.#drawPrimitives(2)

        if (this.alpha !== undefined) this._mgm.context.globalAlpha = this.alpha
        else this._mgm.context.globalAlpha = 1
        if (this.rotation != 0) this._mgm.context.rotate(this.rotation * Math.PI / 180)
        this._mgm.context.scale(this.flipXV, this.flipYV)
        if (this.effect) this._mgm.context.filter = this.effect


        if (this._image && !this._image._pic)
            this._mgm.context.drawImage(this._image,
                -this._width / 2 + this.collider._px,
                -this._height / 2 + this.collider._py,
                this._width,
                this._height)
        else
            if (this._image && this._image._pic)
                this._mgm.context.drawImage(this._image._pic,
                    this._image.x,
                    this._image.y,
                    this._image.width,
                    this._image.height,
                    -this._width / 2 + this.collider._px,
                    -this._height / 2 + this.collider._py,
                    this._width,
                    this._height)

        this.#drawPrimitives(1)

        this._mgm.context.restore()

        if (this.border) this.#boardsShow(this.border)
        if (this._mgm.params.borders && !this.nocont) this.#boardsShow(this._mgm.params.borders)
    }


    #dot(x, y, col = '#ff0') {
        this._mgm.context.fillStyle = col
        this._mgm.context.fillRect(x - 1, y - 1, 3, 3)
    }


    #boardsShow(border) {
        const left = this.collider.left + this._mgm.canvCX + this._cameraZXm
        const right = this.collider.right + this._mgm.canvCX + this._cameraZXm
        const top = -this.collider.top + this._mgm.canvCY + this._cameraZYm
        const bottom = -this.collider.bottom + this._mgm.canvCY + this._cameraZYm

        this.#dot(this.x + this._mgm.canvCX + this._cameraZXm,
            -this.y + this._mgm.canvCY + this._cameraZYm)

        if (border[0] == 'dots') {
            this.#dot(left, top, border[1])
            this.#dot(right, top, border[1])
            this.#dot(left, bottom, border[1])
            this.#dot(right, bottom, border[1])
        }
        if (border[0] == 'line') {
            this._mgm.context.beginPath()
            this._mgm.context.strokeStyle = border[1]
            this._mgm.context.moveTo(left, top)
            this._mgm.context.lineTo(right, top)
            this._mgm.context.lineTo(right, bottom)
            this._mgm.context.lineTo(left, bottom)
            this._mgm.context.lineTo(left, top)
            this._mgm.context.stroke()
        }
        if (border[2] && border[2] == 'name') {
            this._mgm.context.fillText(this.name, left, bottom)
        }
    }


    #getPic(name = this.picName) {
        if (name == '') name = this.picName
        if (this._pics && this._pics[name]) return this._pics[name]
        return null
    }


    #drawPrimitives(pos) {
        if (this.drawLine)
            if (!Array.isArray(this.drawLine)) this.#drawLineFn(this.drawLine, pos)
            else for (const prm of this.drawLine) this.#drawLineFn(prm, pos)

        if (this.drawRect)
            if (!Array.isArray(this.drawRect)) this.#drawRectFn(this.drawRect, pos)
            else for (const prm of this.drawRect) this.#drawRectFn(prm, pos)

        if (this.drawCircle)
            if (!Array.isArray(this.drawCircle)) this.#drawCircleFn(this.drawCircle, pos)
            else for (const prm of this.drawCircle) this.#drawCircleFn(prm, pos)

        if (this.drawPolygon)
            if (!Array.isArray(this.drawPolygon)) this.#drawPolygonFn(this.drawPolygon, pos)
            else for (const prm of this.drawPolygon) this.#drawPolygonFn(prm, pos)

        if (this.drawText)
            if (!Array.isArray(this.drawText)) this.#drawTextFn(this.drawText, pos)
            else for (const prm of this.drawText) this.#drawTextFn(prm, pos)
    }


    #drawTextFn(prm, pos) {
        if (prm.absolute === true && pos == 1) return
        if (prm.absolute !== true && pos == 2) return
        if (prm.alpha !== undefined) this._mgm.context.globalAlpha = prm.alpha
        if (prm.color) this._mgm.context.fillStyle = prm.color
        else this._mgm.context.fillStyle = this._mgm._defCtxText.fontColor
        prm.fontSize = (prm.size || this._mgm._defCtxText.fontSize) + 'px'
        if (!prm.family) prm.family = this._mgm._defCtxText.fontFamily
        if (!prm.weight) prm.weight = this._mgm._defCtxText.fontWeight
        if (prm.align) this._mgm.context.textAlign = prm.align
        else this._mgm.context.textAlign = this._mgm._defCtxText.textAlign
        this._mgm.context.font = prm.weight + ' ' + prm.fontSize + ' ' + prm.family
        if (!prm.x) prm.x = 0
        if (!prm.y) prm.y = 0
        if (prm.text === undefined) prm.text = ''
        this._mgm.context.fillText(
            prm.text,
            prm.x + this.collider._px,
            -prm.y + this.collider._py
        )
    }


    #drawLineFn(prm, pos) {
        if (prm.absolute === true && pos == 1) return
        if (prm.absolute !== true && pos == 2) return
        if (prm.alpha !== undefined) this._mgm.context.globalAlpha = prm.alpha
        if (!prm.x1) prm.x1 = 0
        if (!prm.y1) prm.y1 = 0
        if (!prm.x2) prm.x2 = 0
        if (!prm.y2) prm.y2 = 0
        this._mgm.context.beginPath()
        if (prm.pattern) this._mgm.context.setLineDash(prm.pattern)
        else prm.pattern = []
        this._mgm.context.lineWidth = prm.width || 1
        this._mgm.context.strokeStyle = prm.color || 'black'
        this._mgm.context.moveTo(prm.x1 + this.collider._px, -prm.y1 + this.collider._py)
        this._mgm.context.lineTo(prm.x2 + this.collider._px, -prm.y2 + this.collider._py)
        this._mgm.context.stroke()
    }


    #drawRectFn(prm, pos) {
        if (prm.absolute === true && pos == 1) return
        if (prm.absolute !== true && pos == 2) return
        if (prm.alpha !== undefined) this._mgm.context.globalAlpha = prm.alpha
        if (!prm.x) prm.x = 0
        if (!prm.y) prm.y = 0
        this._mgm.context.beginPath()
        if (prm.pattern) this._mgm.context.setLineDash(prm.pattern)
        else prm.pattern = []
        this._mgm.context.rect(
            prm.x + this.collider._px,
            -prm.y + this.collider._py,
            prm.width,
            -prm.height
        )
        if (prm.fillColor && prm.fillColor != '') {
            this._mgm.context.fillStyle = prm.fillColor
            this._mgm.context.fill()
        }
        if (prm.fillPic !== undefined) {
            this._mgm.context.fillStyle = this._mgm.context.createPattern(this.#getPic(prm.fillPic), "repeat")
            this._mgm.context.fill()
        }
        if (prm.lineColor) {
            this._mgm.context.lineWidth = prm.lineWidth || 1
            this._mgm.context.strokeStyle = prm.lineColor || 'black'
            this._mgm.context.stroke()
        }
    }


    #drawCircleFn(prm, pos) {
        if (prm.absolute === true && pos == 1) return
        if (prm.absolute !== true && pos == 2) return
        if (prm.alpha !== undefined) this._mgm.context.globalAlpha = prm.alpha
        if (!prm.x) prm.x = 0
        if (!prm.y) prm.y = 0
        if (!prm.end) prm.end = 0
        this._mgm.context.beginPath()
        if (prm.pattern) this._mgm.context.setLineDash(prm.pattern)
        else prm.pattern = []
        this._mgm.context.arc(
            prm.x + this.collider._px,
            -prm.y + this.collider._py,
            prm.radius,
            prm.end * Math.PI / 180,
            2 * Math.PI
        )

        if (prm.fillColor && prm.fillColor != '') {
            this._mgm.context.fillStyle = prm.fillColor
            this._mgm.context.fill()
        }
        if (prm.fillPic !== undefined) {
            this._mgm.context.fillStyle = this._mgm.context.createPattern(this.#getPic(prm.fillPic), "repeat")
            this._mgm.context.fill()
        }
        if (prm.lineColor) {
            this._mgm.context.lineWidth = prm.lineWidth || 1
            this._mgm.context.strokeStyle = prm.lineColor || 'black'
            this._mgm.context.stroke()
        }
    }


    #drawPolygonFn(prm, pos) {
        if (prm.absolute === true && pos == 1) return
        if (prm.absolute !== true && pos == 2) return
        if (prm.alpha !== undefined) this._mgm.context.globalAlpha = prm.alpha
        this._mgm.context.beginPath()
        if (prm.pattern) this._mgm.context.setLineDash(prm.pattern)
        else prm.pattern = []
        let i = 0
        for (const v of prm.corners) {
            if (i == 0) this._mgm.context.moveTo(v[0] + this.collider._px, -v[1] + this.collider._py)
            else this._mgm.context.lineTo(v[0] + this.collider._px, -v[1] + this.collider._py)
            i++
        }
        if (prm.fillColor) {
            this._mgm.context.fillStyle = prm.fillColor
            this._mgm.context.fill()
        }
        if (prm.fillPic !== undefined) {
            this._mgm.context.fillStyle = this._mgm.context.createPattern(this.#getPic(prm.fillPic), "repeat")
            this._mgm.context.fill()
        }
        if (prm.lineColor || prm.lineWidth) {
            this._mgm.context.lineWidth = prm.lineWidth || 1
            this._mgm.context.strokeStyle = prm.lineColor || 'black'
            this._mgm.context.stroke()
        }
    }





    step(speed) {
        const rad = this.angle * Math.PI / 180;
        this.x += speed * Math.sin(rad)
        this.y += speed * Math.cos(rad)
    }


    stepA(speed, angle = 0) {
        const rad = angle * Math.PI / 180;
        this.x += speed * Math.sin(rad)
        this.y += speed * Math.cos(rad)
    }


    wasd(speed = 0) {
        if (this._mgm.keys.d) this.x += speed
        if (this._mgm.keys.a) this.x -= speed
        if (this._mgm.keys.w) this.y += speed
        if (this._mgm.keys.s) this.y -= speed
    }


    wasdA(speed = 0) {
        let angle = 0
        if (this._mgm.keys.w) angle = 0;
        if (this._mgm.keys.s) angle = 180;
        if (this._mgm.keys.d) angle = 90;
        if (this._mgm.keys.a) angle = -90;
        if (this._mgm.keys.w && this._mgm.keys.d) angle = 45;
        if (this._mgm.keys.w && this._mgm.keys.a) angle = -45;
        if (this._mgm.keys.s && this._mgm.keys.d) angle = 135;
        if (this._mgm.keys.s && this._mgm.keys.a) angle = -135;

        if (this._mgm.keys.w ||
            this._mgm.keys.s ||
            this._mgm.keys.a ||
            this._mgm.keys.d) this.stepA(speed, angle)

        return angle
    }


    arrows(speed = 0) {
        if (this._mgm.keys.right) this.x += speed
        if (this._mgm.keys.left) this.x -= speed
        if (this._mgm.keys.up) this.y += speed
        if (this._mgm.keys.down) this.y -= speed
    }


    moveTo(obj, speed) {
        let obj2 = obj
        if (typeof obj == 'string') obj2 = this._mgm.getObj(obj)
        if (this.x == obj.x && this.y == obj.y) return true

        const d = this.distanceTo(obj2)

        if (d >= speed) {
            this.angle = this.angleTo(obj)
            this.step(speed)
        } else {
            this.positionTo(obj2)
        }
    }


    delete(act = false) {
        this._toDel = true
        if (act) this.active = false
    }


    contactXY(x, y) {
        if (this.active && !this.hidden &&
            x > this.collider.left &&
            x < this.collider.right &&
            y > this.collider.bottom &&
            y < this.collider.top
        ) return true
        else return false
    }


    #contactObj(obj, In) {
        if (!In &&
            this.active && !this.hidden &&
            obj.active && !obj.hidden &&
            this.collider.top + 1 > obj.collider.bottom &&
            this.collider.bottom - 1 < obj.collider.top &&
            this.collider.right + 1 > obj.collider.left &&
            this.collider.left - 1 < obj.collider.right
        ) return obj

        if (In &&
            this.active && !this.hidden &&
            obj.active && !obj.hidden &&
            this.collider.bottom > obj.collider.bottom &&
            this.collider.top < obj.collider.top &&
            this.collider.left > obj.collider.left &&
            this.collider.right < obj.collider.right
        ) return obj
    }

    #contact(prm, key, In) {
        let ot, res

        if (prm)
            if (typeof prm == 'object') {
                if (res = this.#contactObj(prm, In))
                    ot = res
            } else
                for (const obj of this._mgm.objects)
                    if (obj.objectId != this.objectId &&
                        (res = this.#contactObj(obj, In)))
                        if (obj[key] == prm) {
                            ot = res
                            break
                        }

        if (!prm)
            for (const obj of this._mgm.objects)
                if (obj.objectId != this.objectId &&
                    (res = this.#contactObj(obj, In))) {
                    ot = res
                    break
                }

        return ot
    }

    contact(prm, key = 'name') {
        return this.#contact(prm, key, false)
    }


    contactIn(prm, key = 'name') {
        return this.#contact(prm, key, true)
    }


    #contacts(prm, key = 'name', In) {
        let ot = []
        let res

        if (prm)
            if (Array.isArray(prm)) {
                for (const obj of prm)
                    if (res = this.#contactObj(obj, In))
                        ot.push(res)
            } else
                for (const obj of this._mgm.objects)
                    if (obj.objectId != this.objectId)
                        if (obj[key] == prm)
                            if (res = this.#contactObj(obj, In))
                                ot.push(res)

        if (!prm)
            for (const obj of this._mgm.objects)
                if (obj.objectId != this.objectId)
                    if (res = this.#contactObj(obj, In))
                        ot.push(res)

        return ot
    }


    contacts(prm, key = 'name') {
        return this.#contacts(prm, key, false)
    }


    contactsIn(prm, key = 'name') {
        return this.#contacts(prm, key, true)
    }



    raycast(prm) {
        if (!prm) prm = {}
        if (!prm.angle) prm.angle = this.angle
        if (!prm.density) prm.density = 10
        if (!prm.steps) prm.steps = 40
        if (prm.distance) prm.steps = Math.round(prm.distance / prm.density)

        let x = this.x, y = this.y
        const rad = prm.angle * Math.PI / 180
        let ot = null
        if (prm.all) ot = []
        let col = '#f00'
        if (prm.visible && typeof prm.visible == 'string') col = prm.visible

        for (let i = 0; i < prm.steps; i++) {
            x += prm.density * Math.sin(rad)
            y += prm.density * Math.cos(rad)

            if (prm.visible) {
                this._mgm.context.beginPath()
                this._mgm.context.arc(
                    x + this._mgm.canvCX + this._cameraZXm,
                    -y + this._mgm.canvCY + this._cameraZYm,
                    3, 0, 2 * Math.PI)
                this._mgm.context.fillStyle = col
                this._mgm.context.fill()
                this._mgm.context.restore()
            }

            for (const obj of this._mgm.objects)
                if (this != obj &&
                    obj.active !== false &&
                    !obj.hidden &&
                    y > obj.collider.bottom &&
                    y < obj.collider.top &&
                    x > obj.collider.left &&
                    x < obj.collider.right) {
                    if (prm.all) {
                        if (!this._mgm._objInArr(obj, ot)) ot.push(obj)
                    } else {
                        ot = obj
                        break
                    }
                }
            if (ot && !prm.all) break
        }
        return ot
    }


    positionTo(obj) {
        if (typeof obj == 'string') obj = this._mgm.getObj(obj)
        if (!obj) return
        this.x = obj.x
        this.y = obj.y
    }


    angleTo(obj) {
        if (typeof obj == 'string') obj = this._mgm.getObj(obj)
        return this._mgm.angleObj(this, obj)
    }


    distanceTo(obj) {
        if (typeof obj == 'string') obj = this._mgm.getObj(obj)
        return this._mgm.distanceObj(this, obj)
    }


    getStep(angle, dist) {
        const coord = this._mgm.getStep(angle, dist)
        return {
            x: this.x + coord.x,
            y: this.y + coord.y,
        }
    }


    jump(v) {
        if (this.onGround) this.gravVel = v
    }


    lim(n, min, max) {
        if (this[n] < min) this[n] = min
        if (this[n] > max) this[n] = max
    }


    clone(prm) {
        if (!prm) prm = {}
        prm.name = this.name
        return this._mgm.clone(prm)
    }


    click() {
        if (!this._mgm.isMobile && this._mgm.mouse.down) {
            if (this._pressClick) {
                this._pressClick = false
                setTimeout(() => this._pressClick = true, 300)
                return this.contactXY(this._mgm.mouse.x, this._mgm.mouse.y)
            }
        }
        if (this._mgm.isMobile && this._mgm.touch.down) {
            if (this._pressClick) {
                this._pressClick = false
                setTimeout(() => this._pressClick = true, 300)
                return this.contactXY(this._mgm.touch.x, this._mgm.touch.y)
            }
        }
    }


    ondown() {
        if (!this._mgm.isMobile && this._mgm.mouse.down)
            return this.contactXY(this._mgm.mouse.x, this._mgm.mouse.y)
        if (this._mgm.isMobile && this._mgm.touch.down)
            return this.contactXY(this._mgm.touch.x, this._mgm.touch.y)
    }





    wait(name, frames, func) {
        if (frames == null) delete this._wait[name]
        else if (!this._wait[name]) {
            this._wait[name] = {}
            const wait = this._wait[name]
            wait.frames = Math.round(frames)
            wait.sch = wait.frames - 1
            wait.repeat = false
            wait.func = func
        }
    }


    repeat(name, frames, func) {
        if (frames == null) delete this._wait[name]
        else {
            if (!this._wait[name]) {
                this._wait[name] = {}
                const wait = this._wait[name]
                wait.frames = Math.round(frames)
                wait.sch = wait.frames - 1
                wait.repeat = true
                wait.func = func
                func()
            }
        }
    }


    #waitsWork() {
        for (const j in this._wait) {
            const wait = this._wait[j]
            if (wait.sch == 0) {
                if (wait.repeat) wait.sch = wait.frames - 1
                else delete this._wait[j]
                wait.func()
            } else wait.sch--
        }
    }



    audio(d, name, obj) {
        if (!name) name = '_one'
        const sound = this.sounds[name]
        if (!sound) {
            console.log('ERROR - no sound:', name);
            return
        }

        if (obj) {
            if (obj === true) obj = this._mgm.camera
            let vol = 1 + this.distanceTo(obj) / -this._mgm.volDist
            vol *= this._mgm.volume * sound.vol
            if (vol < 0) vol = 0
            if (vol > 1) vol = 1
            if (!vol) vol = 0
            sound.volume = vol
        }

        if (d == 'play') {
            if (!obj) sound.volume = this._mgm.volume * sound.vol
            sound.loop = false
            sound.play()
        }
        if (d == 'start') {
            if (!obj) sound.volume = this._mgm.volume * sound.vol
            sound.loop = false
            sound.currentTime = 0
            sound.play()
        }
        if (d == 'loop') {
            sound.loop = true
            sound.play()
        }
        if (d == 'stop') {
            sound.pause()
            sound.currentTime = 0
        }
        if (d == 'pause') {
            sound.pause()
        }
    }


    setVol(name, vol) {
        this.sounds[name].vol = vol
        this.sounds[name].volume = this._mgm.volume * this.sounds[name].vol
    }

}




















