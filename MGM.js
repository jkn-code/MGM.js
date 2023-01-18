

console.log('MGM.js 1.23');

class MGM {
    constructor(params) {
        this.params = params
        this.object = {}
        this._build = {}
        this.RUN = false
        this.frame = 0
        this.camera = { x: 0, y: 0 }
        this.tabActive = true
        this.objIds = 0

        window.onload = () => this._init()
    }


    _init() {

        if (this.params.autorun !== false) this.params.autorun = true
        if (this.params.fpsLimit === undefined) this.params.fpsLimit = 60
        this._fpsTm = 1000 / this.params.fpsLimit
        if (this.params.fontRatio === undefined) this.params.fontRatio = 1

        this._initHTML()
        this._initCanvasPlane()
        this._initMobileControl()
        this._initMouse()
        this._initKeys()

        this.resizeWin()
        window.onresize = () => this.resizeWin()

        if (this.params.borders) {
            this.params.borders = this.params.borders.split(',')
            if (this.params.borders[0]) this.params.borders[0] = this.params.borders[0].trim()
            if (this.params.borders[1]) this.params.borders[1] = this.params.borders[1].trim()
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
        if (!plOk) {
            this.curtainIn.innerHTML = plTxt
            return
        }

        this.fps = 0
        this._fpsSch = 0
        setInterval(() => {
            this.fps = this._fpsSch
            this._fpsSch = 0
        }, 1000)


        window.onfocus = () => {
            if (this.tabActive === false) {
                this.tabActive = true
                this._soundsPause(false, 'act')
            }
        }
        window.onblur = () => {
            if (this.tabActive === true) {
                this.tabActive = false
                this._soundsPause(true, 'act')
            }
        }

        window.oncontextmenu = function () {
            return false;
        }

        this._loadResources()
    }


    _initHTML() {
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
            opacity: 0.5; 
            display: `+ (this.params.log ? 'block' : 'none') + `; 
            padding: 10px;
            font-size: 11px; 
            color: #000;
            background-color: #fffa;
            word-wrap: break-word;
        `
        document.body.appendChild(this._consDiv)
        this._logs = []

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
            cursor: pointer;
            display: flex; 
            align-items: center; 
            justify-content: center;`
        this.curtainIn = document.createElement('div')
        this.curtain.appendChild(this.curtainIn)
        this.curtainIn.style.cssText = 'text-align: center;'
        this.curtainIn.innerHTML = 'Loading'
    }


    _initCanvasPlane() {
        this.canvas = document.createElement('canvas')
        this.canvas.classList.add('mgm-canvas')
        this.canvas.style.cssText = `
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
        `
        if (this.params.pixel) this.canvas.style.cssText += 'image-rendering: pixelated; image-rendering: crisp-edges;'

        this._defCtxText = {
            textAlign: 'left',
            fontColor: document.body.style.color,
            fontSize: 25,
            fontFamily: 'Tahoma',
            fontWeight: 'normal',
        }
        this.context = this.canvas.getContext('2d')
        if (this.params.canvasColor) this.canvas.style.backgroundColor = this.params.canvasColor
        document.body.appendChild(this.canvas)

        if (this.params.canvasFilter)
            this.canvas.style.filter = this.params.canvasFilter



        this.resizeWin()

    }


    _initMobileControl() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        if (!this.isMobile) return

        this.touch = {}
        this.touches = []
        this._touchBtns = []
        this._touchSticks = []

        if (!this.params.mobileStyle) this.params.mobileStyle = {}

        const toushFn = e => {
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

        document.addEventListener("contextmenu", e => e.preventDefault())
        document.addEventListener("touchstart", toushFn)
        document.addEventListener("touchend", toushFn)
        document.addEventListener("touchmove", toushFn)

        const color = this.params.mobileColor || 'gray'
        const styleBtn = 'position: absolute; background-color: ' + color + '; border: 2px solid ' + color + '; border-radius: 100px; z-index: 1000;'
        let control = this.params.mobileControl || 'stickL, br1, br2, br3, br4'
        if (this.params.mobileControl === false) control = ''

        control.split(',').forEach(c => {
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
                this._touchBtns.push({
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
                this._touchSticks.push({
                    el: stick,
                    name: name,
                    x1: left,
                    y1: top,
                    x2: left + cpos.width,
                    y2: top + cpos.height,
                    px: left + 60,
                    py: top + 60,
                    d1: 20,
                    d2: 60,
                })
            }
        })

        this._touchBtns.forEach(bt => {
            for (const j in this.params.mobileStyle)
                for (const k in this.params.mobileStyle[j])
                    if (bt.name == j)
                        bt.el.style[k] = this.params.mobileStyle[j][k]
        })
        this._touchSticks.forEach(st => {
            for (const j in this.params.mobileStyle)
                for (const k in this.params.mobileStyle[j])
                    if (st.name == j)
                        st.el.style[k] = this.params.mobileStyle[j][k]
        })
    }


    _initMouse() {
        if (this.isMobile) return

        this.mouse = { x: 0, y: 0, px: 0, py: 0, }

        this.canvas.onmousemove = e => {
            this.mouse.px = e.pageX - this.canvas.cpos.left
            this.mouse.py = e.pageY - this.canvas.cpos.top
            this.mouse.x = this.mouse.px / this.kfHeight - this.canvCX + this.camera.x
            this.mouse.y = -this.mouse.py / this.kfHeight + this.canvCY + this.camera.y
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
    }

    _initKeys() {
        this.keys = {}
        this.press = {}


        let keyNums = {
            38: 'up', 40: 'down', 37: 'left', 39: 'right',
            32: 'space', 13: 'enter', 27: 'escape', 16: 'shift', 17: 'ctrl', 8: 'backspace',
            65: 'a', 66: 'b', 67: 'c', 68: 'd', 69: 'e', 70: 'f', 71: 'g', 72: 'h', 73: 'i', 74: 'j', 75: 'k', 76: 'l', 77: 'm', 78: 'n', 79: 'o', 80: 'p', 81: 'q', 82: 'r', 83: 's', 84: 't', 85: 'u', 86: 'v', 87: 'w', 88: 'x', 89: 'y', 90: 'z',
            48: 'n0', 49: 'n1', 50: 'n2', 51: 'n3', 52: 'n4', 53: 'n5', 54: 'n6', 55: 'n7', 56: 'n8', 57: 'n9',
        }
        for (let j in keyNums) this.keys[keyNums[j]] = false
        document.onkeydown = (e) => {
            e = e || window.event
            let k = keyNums[e.keyCode]
            this.keys[k] = true

        }
        document.onkeyup = (e) => {
            e = e || window.event
            this.keys[keyNums[e.keyCode]] = false
        }
    }


    _loadResources() {

        this._build.resAll = 0
        this._build.resLoad = 0

        for (const j in this.object)
            if (this.object[j].pic) {
                this.object[j]._pics = {}
                for (const k in this.object[j].pic) {
                    if (typeof this.object[j].pic[k] == 'string')
                        this.object[j]._pics[k] = this._loadPic(this.object[j].pic[k])
                    if (typeof this.object[j].pic[k] == 'object')
                        this.object[j]._pics[k] = this.object[j].pic[k]
                }
            }

        for (const j in this.object)
            if (this.object[j].sounds)
                for (let k in this.object[j].sounds)
                    this.object[j].sounds[k] = this._loadSound(this.object[j].sounds[k])

        let loadWait = setInterval(() => {
            this.curtainIn.innerHTML = '<b>MGM.js</b><br><br><br>Loading<br><br>' + this._build.resLoad + " / " + this._build.resAll
            if (this._build.resAll == this._build.resLoad) {
                clearInterval(loadWait)
                setTimeout(() => {
                    this._build.isLoad = true
                    if (this.params.autorun !== false) this._run()
                    else {
                        this.curtainIn.innerHTML = this.params.startText || '<center><b>Start1</b><br><br><small>click to run</small></center>'
                        this.curtain.onclick = () => {
                            if (!this.STOP) this._run()
                        }
                    }
                }, 1000)
            }
        }, 10)
    }


    _run() {
        if (this.params.fullscreen && this.params.autorun === false)
            this._toggleFullScreen()
        this.curtainIn.innerHTML = ''
        if (this.params.cursor === false) document.body.style.cursor = 'none'
        this.objects = []
        this.noconts = []
        this.RUN = true
        this.zList = []
        this.objectsId = 0
        this.resizeWin()

        setTimeout(() => {
            this._initObjs()
            this.curtain.style.display = 'none'
            this._loopItv = setInterval(() => {
                this._loop()
            }, this._fpsTm)
        }, 0)
    }


    reload(url) {
        if (!url || url.trim() == '') return
        let w = setInterval(() => {
            if (this._build.isLoad) {
                clearInterval(w)
                this._reload(url)
            }
        }, 0)

    }

    _reload(url) {
        console.log('reload');
        this.stop()

        this.object = {}
        this.clearGame(false)

        let urls = []
        let scrAll = 0
        let scrLoad = 0

        if (!Array.isArray(url)) urls[0] = url
        else urls = url

        urls.forEach(u => {
            scrAll++
            const s = document.createElement('script')
            document.head.appendChild(s)
            s.src = u + '?' + this.random(111, 999)
            s.onload = () => scrLoad++
        })

        let w = setInterval(() => {
            if (scrAll == scrLoad) {
                clearInterval(w)
                this._loadResources()
            }
        }, 0)
    }


    clearGame(reObj = true) {
        this.objects = []
        this.noconts = []
        this.camera = { x: 0, y: 0 }
        if (reObj) this._initObjs()

    }




    _loadPic(src) {
        this._build.resAll++
        const img = new Image()
        img.src = src
        img.onload = () => {
            this._build.resLoad++
        }
        return img
    }


    _loadSound(prm) {
        let src = prm
        if (typeof prm == 'object') src = prm.src

        this._build.resAll++

        const sound = new Audio()
        sound.src = src

        if (prm.volume !== undefined) sound.volume = prm.volume
        if (prm.loop !== undefined) sound.loop = prm.loop
        if (prm.onended !== undefined) sound.onended = prm.onended

        sound.onloadstart = () => {
            this._build.resLoad++
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
        sound.stop = () => {
            sound.pause()
            sound.currentTime = 0
        }
        sound.start = function () {
            this.pause()
            this.currentTime = 0
            this.play()
        }

        return sound
    }


    resizeWin() {
        this.params.ratio = this.params.ratio || 1
        if (this.params.ratio == 'auto') this.params.ratio = innerWidth / innerHeight

        let width = 0, height = 0

        height = innerHeight
        width = innerHeight * this.params.ratio
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
        let kh = cpos.height / this.params.quality

        document.querySelectorAll('.mgm').forEach(el => {
            el.style.position = 'absolute'
            if (el.style.zIndex == '') el.style.zIndex = 1
            if (el.style.boxSizing == '') el.style.boxSizing = 'border-box'

            let left = parseFloat(el.getAttribute('mgm-left'))
            let right = parseFloat(el.getAttribute('mgm-right'))
            let top = parseFloat(el.getAttribute('mgm-top'))
            let bottom = parseFloat(el.getAttribute('mgm-bottom'))
            let x = parseFloat(el.getAttribute('mgm-x'))
            let y = parseFloat(el.getAttribute('mgm-y'))
            let w = parseFloat(el.getAttribute('mgm-width'))
            let h = parseFloat(el.getAttribute('mgm-height'))
            
            if (w != NaN) el.style.width = (w * kh) + 'px'
            if (h != NaN) el.style.height = (h * kh) + 'px'

            const elPos = el.getBoundingClientRect()
            
            if (left != NaN) el.style.left = (cpos.left + left * kh) + 'px'
            if (right != NaN) el.style.left = (cpos.right - right * kh - elPos.width) + 'px'
            if (top != NaN) el.style.top = (cpos.top + top * kh) + 'px'
            if (bottom != NaN) el.style.top = (cpos.bottom - bottom * kh - elPos.height) + 'px'
            if (x != NaN) el.style.left = (cpos.left + this.canvCX * kh + x * kh) + 'px'
            if (y != NaN) el.style.top = (cpos.top + this.canvCY * kh + y * kh) + 'px'
            if (el.style.padding != '') {
                if (!el.mgmPadding) el.mgmPadding = parseInt(el.style.padding.replace('px', ''))
                el.style.padding = (el.mgmPadding * kh) + 'px'
            }
        })



    }




    _firstV(m) {
        for (let v in m) return m[v]
    }


    _firstJ(m) {
        for (let j in m) return j
    }


    _initObjs() {
        this.context.font = '20px Tahoma'

        for (const j in this.object)
            this.object[j] = this.clone({
                name: j,
                _isObj: true,
            })

        this._build.isInitAll = true

    }

    _touchLoop() {
        if (!this.touch) return

        this._touchBtns.forEach(btn => this.touch[btn.name] = false)
        this._touchSticks.forEach(stick => this.touch[stick.name] = false)
        let joy = false
        let html = false

        for (let i = 0; i < this.touches.length; i++) {
            const ti = this.touches[i]

            this._touchBtns.forEach(btn => {
                if (ti.px > btn.x1 && ti.px < btn.x2 && ti.py > btn.y1 && ti.py < btn.y2) {
                    this.touch[btn.name] = true
                    joy = true
                }
            })

            this._touchSticks.forEach(stick => {
                if (ti.px > stick.x1 && ti.px < stick.x2 && ti.py > stick.y1 && ti.py < stick.y2) {
                    const d = this.distanceXY(ti.px, ti.py, stick.px, stick.py)
                    if (d > stick.d1 && d < stick.d2)
                        this.touch[stick.name] = -this.angleXY(stick.px, stick.py, ti.px, ti.py) + 180
                    if (this.touch[stick.name] > 180) this.touch[stick.name] -= 360
                    if (d < stick.d2) joy = true
                }
            })

        }

        if (joy || html) this.touch.down = false
    }





    _loop() {
        if (!this.RUN) return
        if (!this.tabActive) return

        if (this.params.log) this._consDiv.innerHTML = ''

        this._touchLoop()

        if (!this.params.noClear) this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

        this._loopDraw()
        this._loopUpdate()

        for (let j in this.press) this.press[j] = false
        this.frame++
        this._fpsSch++

        if (this.params.log) {
            this._logs = this._logs.splice(-300)
            this._consDiv.innerHTML = '> ' + this._logs.join('<br>> ')
                + '<br><br>fps: ' + this.fps + ', frame: ' + this.frame
                + '<br><br>objs: ' + this.objects.length + ', nocons: ' + this.noconts.length
            this._consDiv.scrollTop = 10000
        }

    }

    _loopDraw() {
        const mas = []
        const gr = 0
        for (const obj of this.objects) {
            let ok = true
            let draw = false
            if (obj.hidden) ok = false
            else if (obj.active === false) ok = false
            else if (obj._toDel === false) ok = false
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
            } else obj._drawing = false
        }

        for (const obj of this.noconts) {
            let ok = true
            let draw = false
            if (obj.hidden) ok = false
            else if (obj.active === false) ok = false
            else if (obj._toDel === false) ok = false
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
            } else obj._drawing = false
        }

        if (this.params.orderY) mas.sort(this._orderY)

        for (const z of this.zList)
            for (const obj of mas)
                if (obj.z == z)
                    obj._draw()
    }

    _loopUpdate() {
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

    _soundsPause(paused, tip) {
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

    _orderY(a, b) {
        if (a.y < b.y) return 1;
        if (a.y > b.y) return -1;
        return 0;
    }

    _toggleFullScreen() {
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
            if (a === obj) return true
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
        this._soundsPause(true, 'run')

    }


    run() {
        this.RUN = true
        this._soundsPause(false, 'run')

    }


    stop(txt) {
        console.log('stop');
        this.RUN = false
        this.STOP = true
        if (txt || this.params.stopText) {
            this.curtainIn.innerHTML = txt || this.params.stopText
            this.curtain.style.display = 'flex'
        }
        clearInterval(this._loopItv)
        this._soundsPause(true, 'run')

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
        this._logs.push(s)

    }










}




















class MGMObject {
    constructor(params) {

        let obj

        if (params._isObj == true) {
            obj = params._mgm.object[params.name]
        } else {
            this.isClone = true
            if (params._obj) obj = params._obj
            else obj = params._mgm.object[params.name]
        }
        if (obj === undefined) {
            obj = params
        }

        if (!obj.nocont && params._mgm.objects.length > 10000) return
        if (obj.nocont && params._mgm.noconts.length > 10000) return


        for (const j in obj) {
            const v = obj[j]
            if (j == 'pic' || j == '_pics' || j == 'picName' ||
                j == 'anim' || j == '_animName' || j == 'sounds111' ||
                j == 'name' || j == '_mgm' || j == '_obj' ||
                j == 'obj' ||
                typeof v == 'function') this[j] = v
            else if (j == 'sounds') {
                this[j] = {}
                for (const s in v) {
                    this[j][s] = v[s].cloneNode()
                    this[j][s].start = v[s].start
                    this[j][s].stop = v[s].stop
                    this[j][s]._setActPause = v[s]._setActPause
                    this[j][s]._setRunPause = v[s]._setRunPause
                    this[j][s].volume = v[s].volume
                    this[j][s].loop = v[s].loop
                }
            } else {
                if (this.isClone) this[j] = JSON.parse(JSON.stringify(v))
            }
        }

        this._mgm = params._mgm

        this._mgm.objIds++
        this._objId = params._mgm.objIds

        if (params.active !== false) this.active = true
        if (!this.collider) this.collider = {}

        if (this._pics)
            for (const j in this._pics)
                if (this._pics[j].pic) {
                    if (this._pics[j].object)
                        this._pics[j]._pic = this._mgm.object[this._pics[j].object]._pics[this._pics[j].pic]
                    else
                        this._pics[j]._pic = this._pics[this._pics[j].pic]
                }

        if (this.anim && !this._anima)
            this._anima = {
                frame: 0,
                sch: 0,
                name: undefined,
                pics: undefined,
                length: 0,
                func: null
            }

        if (!this.isClone && this.init) this.init(this)

        if (!this.isClone) this.name = params.name
        else for (const j in params)
            if (j != '_object')
                this[j] = params[j]

        this._goStart = true

        this._init()

        if (!this.nocont) this._mgm.objects.push(this)
        else this._mgm.noconts.push(this)
    }


    _init() {

        this._mgm.objectsId++
        this.objectId = this._mgm.objectsId

        if (this.x === undefined) this.x = 0
        if (this.y === undefined) this.y = 0
        if (this.z === undefined) this.z = 0
        this._setZLayer()

        if (this.rotation === undefined) this.rotation = 0
        if (this.angle === undefined) this.angle = 0
        if (this.size === undefined) this.size = 1

        if (this.collider.width == undefined) this.collider.width = 1
        if (this.collider.height == undefined) this.collider.height = 1
        if (this.collider.x == undefined) this.collider.x = 0
        if (this.collider.y == undefined) this.collider.y = 0
        if (this.collider.px == undefined) this.collider.px = 0
        if (this.collider.py == undefined) this.collider.py = 0

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

        if (typeof this.pic != 'string')
            if (!this.picName)
                this.picName = this._mgm._firstJ(this.pic)

        this._wait = {}
        this._pressK = true

        this._setScope()
        this._setPivot()
        this._setCollider()
    }


    _setZLayer() {
        if (this._mgm.zList.indexOf(this.z) == -1) {
            this._mgm.zList.push(this.z)
            this._mgm.zList.sort(function (a, b) {
                return a - b;
            })
        }
    }


    _update() {
        if (this.update && this.active)
            this.update(this)

        this._work()
        this._waitsWork()

        if (this._goStart && this.start) {
            this.start(this)
            this._setZLayer()
            delete this._goStart
        }
    }


    _work() {
        if (this.angle < -180) this.angle += 360
        if (this.angle > 180) this.angle -= 360
        if (this.anglePic) this.rotation = this.angle

        this._setScope()

        if (!this.nocont) {
            if (this.physics && this.mass) {
                if (!this.onGround) this.gravVel -= 0.5
                this.y += this.mass * this.gravVel
            }

            this._setPivot()
            this._setCollider()
            this._physicWork()

            if (this.bounce) {
                if (this.collider.right > this._mgm.canvCX || this.collider.left < -this._mgm.canvCX) this.angle = -this.angle
                if (this.collider.top > this._mgm.canvCY || this.collider.bottom < -this._mgm.canvCY) this.angle = 180 - this.angle
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

        if (this._anima && this._anima.name && this._drawing) {
            if (this._anima.sch == this.anim.speed) {
                this._anima.sch = 0
                this._anima.frame++
                if (this._anima.frame >= this._anima.length) this._anima.frame = 0
                if (this._anima.func) this._anima.func()
            }
            if (this._anima.sch == 0) this.picName = this._anima.pics[this._anima.frame]
            this._anima.sch++
        }
    }


    _physicWork() {
        if (!this.physics) return
        if (this.active === false) return
        if (this.hidden) return
        if (this.physics == 'wall') return

        this.onGround = false
        let backs = []

        for (const obj of this._mgm.objects) {
            let ok = true
            let cont = false

            if (obj.active === false) ok = false
            else if (this._objId == obj._objId) ok = false
            else if (!obj.physics) ok = false
            else if (obj.hidden) ok = false
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
            this._setCollider()
        }

        if (this.mass != 0)
            for (const obj of this._mgm.objects)
                if (obj.active && this.objectId != obj.objectId)
                    if (obj.physics == 'wall' || obj.physics == 'unit2')
                        if (this.collider.right - 5 > obj.collider.left &&
                            this.collider.left + 5 < obj.collider.right) {
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


    _setScope() {
        this._image = this._getPic()

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


    _setPivot() {
        this.collider._pivotXL = this._width * this.collider.width / 2 - this._width * this.collider.x
        this.collider._pivotXR = this._width * this.collider.width / 2 + this._width * this.collider.x
        this.collider._pivotYB = this._height * this.collider.height / 2 - this._height * this.collider.y
        this.collider._pivotYT = this._height * this.collider.height / 2 + this._height * this.collider.y
    }


    _setCollider() {
        this.collider.left = this.x - this.collider._pivotXL
        this.collider.right = this.x + this.collider._pivotXR
        this.collider.top = this.y + this.collider._pivotYT
        this.collider.bottom = this.y - this.collider._pivotYB
    }


    setAnim(name, frame = 0) {
        if (name == 'speed') return
        if (name == this._anima.name) return
        this._anima.name = name
        this._anima.frame = frame
        this._anima.sch = 0
        this._anima.pics = this.anim[name]
        this._anima.length = this.anim[name].length
    }


    getAnim() {
        return this._anima.name
    }


    _draw() {
        if (this.onCamera === undefined) {
            this._cameraZXm = - this._mgm.camera.x * this.cameraZX
            this._camersZYm = this._mgm.camera.y * this.cameraZY
        } else {
            this._cameraZXm = 0
            this._camersZYm = 0
        }

        this._mgm.context.save()
        this._mgm.context.translate(
            this.x + this._mgm.canvCX + this._cameraZXm + this.collider._px,
            -this.y + this._mgm.canvCY + this._camersZYm + this.collider._py
        )

        this._drawPrimitives(2)

        if (this.alpha !== undefined) this._mgm.context.globalAlpha = this.alpha
        else this._mgm.context.globalAlpha = 1
        if (this.rotation != 0) this._mgm.context.rotate(this.rotation * Math.PI / 180)
        this._mgm.context.scale(this.flipXV, this.flipYV)
        if (this.effect) this._mgm.context.filter = this.effect

        if (this._image && !this._image.pic)
            this._mgm.context.drawImage(this._image,
                -this._width / 2,
                -this._height / 2,
                this._width,
                this._height)
        else
            if (this._image && this._image.pic) {
                this._mgm.context.drawImage(this._image._pic,
                    this._image.x,
                    this._image.y,
                    this._image.width,
                    this._image.height,
                    -this._width / 2,
                    -this._height / 2,
                    this._width,
                    this._height)
            }

        this._drawPrimitives(1)
        this._mgm.context.restore()

        if (this.border) this._boardsShow(this.border)
        if (this._mgm.params.borders && !this.nocont) this._boardsShow(this._mgm.params.borders)
    }


    _dot(x, y, col = '#ff0') {
        this._mgm.context.fillStyle = col
        this._mgm.context.fillRect(x - 1, y - 1, 3, 3)
    }


    _boardsShow(border) {
        const left = this.collider.left + this._mgm.canvCX + this._cameraZXm
        const right = this.collider.right + this._mgm.canvCX + this._cameraZXm
        const top = -this.collider.top + this._mgm.canvCY + this._camersZYm
        const bottom = -this.collider.bottom + this._mgm.canvCY + this._camersZYm

        this._dot(this.x + this._mgm.canvCX + this._cameraZXm,
            -this.y + this._mgm.canvCY + this._camersZYm)

        if (border[0] == 'dots') {
            this._dot(left, top, border[1])
            this._dot(right, top, border[1])
            this._dot(left, bottom, border[1])
            this._dot(right, bottom, border[1])
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
    }


    _getPic(name = this.picName) {
        if (name == '') name = this.picName
        if (this._pics) return this._pics[name]
        return null
    }


    _drawPrimitives(pos) {
        if (this.drawLine)
            if (!Array.isArray(this.drawLine)) this._drawLineFn(this.drawLine, pos)
            else for (const prm of this.drawLine) this._drawLineFn(prm, pos)

        if (this.drawRect)
            if (!Array.isArray(this.drawRect)) this._drawRectFn(this.drawRect, pos)
            else for (const prm of this.drawRect) this._drawRectFn(prm, pos)

        if (this.drawCircle)
            if (!Array.isArray(this.drawCircle)) this._drawCircleFn(this.drawCircle, pos)
            else for (const prm of this.drawCircle) this._drawCircleFn(prm, pos)

        if (this.drawPolygon)
            if (!Array.isArray(this.drawPolygon)) this._drawPolygonFn(this.drawPolygon, pos)
            else for (const prm of this.drawPolygon) this._drawPolygonFn(prm, pos)

        if (this.drawText)
            if (!Array.isArray(this.drawText)) this._drawTextFn(this.drawText, pos)
            else for (const prm of this.drawText) this._drawTextFn(prm, pos)
    }


    _drawTextFn(prm, pos) {
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
        this._mgm.context.fillText(prm.text, prm.x, -prm.y)
    }


    _drawLineFn(prm, pos) {
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
        this._mgm.context.moveTo(prm.x1, -prm.y1)
        this._mgm.context.lineTo(prm.x2, -prm.y2)
        this._mgm.context.stroke()
    }


    _drawRectFn(prm, pos) {
        if (prm.absolute === true && pos == 1) return
        if (prm.absolute !== true && pos == 2) return
        if (prm.alpha !== undefined) this._mgm.context.globalAlpha = prm.alpha
        if (!prm.x) prm.x = 0
        if (!prm.y) prm.y = 0
        this._mgm.context.beginPath()
        if (prm.pattern) this._mgm.context.setLineDash(prm.pattern)
        else prm.pattern = []
        this._mgm.context.rect(prm.x, -prm.y, prm.width, -prm.height)
        if (prm.fillColor && prm.fillColor != '') {
            this._mgm.context.fillStyle = prm.fillColor
            this._mgm.context.fill()
        }
        if (prm.fillPic !== undefined) {
            this._mgm.context.fillStyle = this._mgm.context.createPattern(this._getPic(prm.fillPic), "repeat")
            this._mgm.context.fill()
        }
        if (prm.lineColor) {
            this._mgm.context.lineWidth = prm.lineWidth || 1
            this._mgm.context.strokeStyle = prm.lineColor || 'black'
            this._mgm.context.stroke()
        }
    }


    _drawCircleFn(prm, pos) {
        if (prm.absolute === true && pos == 1) return
        if (prm.absolute !== true && pos == 2) return
        if (prm.alpha !== undefined) this._mgm.context.globalAlpha = prm.alpha
        if (!prm.x) prm.x = 0
        if (!prm.y) prm.y = 0
        this._mgm.context.beginPath()
        if (prm.pattern) this._mgm.context.setLineDash(prm.pattern)
        else prm.pattern = []
        this._mgm.context.arc(prm.x, -prm.y,
            prm.radius, 0, 2 * Math.PI)
        if (prm.fillColor && prm.fillColor != '') {
            this._mgm.context.fillStyle = prm.fillColor
            this._mgm.context.fill()
        }
        if (prm.fillPic !== undefined) {
            this._mgm.context.fillStyle = this._mgm.context.createPattern(this._getPic(prm.fillPic), "repeat")
            this._mgm.context.fill()
        }
        if (prm.lineColor) {
            this._mgm.context.lineWidth = prm.lineWidth || 1
            this._mgm.context.strokeStyle = prm.lineColor || 'black'
            this._mgm.context.stroke()
        }
    }


    _drawPolygonFn(prm, pos) {
        if (prm.absolute === true && pos == 1) return
        if (prm.absolute !== true && pos == 2) return
        if (prm.alpha !== undefined) this._mgm.context.globalAlpha = prm.alpha
        this._mgm.context.beginPath()
        if (prm.pattern) this._mgm.context.setLineDash(prm.pattern)
        else prm.pattern = []
        let i = 0
        for (const v of prm.corners) {
            if (i == 0) this._mgm.context.moveTo(v[0], -v[1])
            else this._mgm.context.lineTo(v[0], -v[1])
            i++
        }
        if (prm.fillColor) {
            this._mgm.context.fillStyle = prm.fillColor
            this._mgm.context.fill()
        }
        if (prm.fillPic !== undefined) {
            this._mgm.context.fillStyle = this._mgm.context.createPattern(this._getPic(prm.fillPic), "repeat")
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


    wasd(speed = 0, LR = true) {
        if (this._mgm.keys.d) this.x += speed
        if (this._mgm.keys.a) this.x -= speed
        if (!LR) return
        if (this._mgm.keys.w) this.y += speed
        if (this._mgm.keys.s) this.y -= speed
    }


    wasdA(speed = 0, LR = true) {
        let angle = 0
        if (this._mgm.keys.w) angle = 0;
        if (this._mgm.keys.s) angle = 180;
        if (LR) {
            if (this._mgm.keys.d) angle = 90;
            if (this._mgm.keys.a) angle = -90;
            if (this._mgm.keys.w && this._mgm.keys.d) angle = 45;
            if (this._mgm.keys.w && this._mgm.keys.a) angle = -45;
            if (this._mgm.keys.s && this._mgm.keys.d) angle = 135;
            if (this._mgm.keys.s && this._mgm.keys.a) angle = -135;
        }
        if (this._mgm.keys.w ||
            this._mgm.keys.s ||
            this._mgm.keys.a ||
            this._mgm.keys.d) this.stepA(speed, angle)
    }


    arrows(speed = 0, LR = true) {
        if (this._mgm.keys.right) this.x += speed
        if (this._mgm.keys.left) this.x -= speed
        if (!LR) return
        if (this._mgm.keys.up) this.y += speed
        if (this._mgm.keys.down) this.y -= speed
    }


    moveTo(obj, speed) {
        let obj2 = obj
        if (typeof obj == 'string') obj2 = this._mgm.getObj(obj)
        if (this.x == obj.x && this.y == obj.y) return
        const d = this.distanceTo(obj2)
        if (d >= speed) {
            this.angle = this.angleTo(obj)
            this.step(speed)
        } else {
            this.positionTo(obj2)
        }
    }


    delete() {
        this._toDel = true
    }


    contactXY(x, y) {
        if (x > this.collider.left &&
            x < this.collider.right &&
            y > this.collider.bottom &&
            y < this.collider.top) return true
        else return false
    }


    contactObj(obj) {
        if (obj.active !== false &&
            !obj.hidden &&
            this.collider.top + 1 > obj.collider.bottom &&
            this.collider.bottom - 1 < obj.collider.top &&
            this.collider.right + 1 > obj.collider.left &&
            this.collider.left - 1 < obj.collider.right) return obj
    }


    contact(prm, key = 'name') {
        let ot, res

        if (prm)
            for (const obj of this._mgm.objects)
                if (obj != this && (res = this.contactObj(obj)))
                    if (obj[key] == prm) {
                        ot = res
                        break
                    }

        if (!prm)
            for (const obj of this._mgm.objects)
                if (obj != this && (res = this.contactObj(obj))) {
                    ot = res
                    break
                }

        return ot
    }


    contacts(prm, key = 'name') {
        let mas = []
        let ot = []
        let res

        for (const obj of this._mgm.objects)
            if (obj != this)
                if (res = this.contactObj(obj))
                    mas.push(res)

        if (prm)
            for (const obj of mas)
                if (obj[key] == prm) ot.push(obj)

        if (prm === undefined) ot = mas

        return ot
    }


    contactsIn(prm, key = 'name') {
        const mas = []
        const ot = []
        let res

        for (const obj of this._mgm.objects)
            if (obj != this)
                if (res = this.contactObjIn(obj))
                    mas.push(res)

        if (prm)
            for (const obj of mas)
                if (obj[key] == prm) ot.push(obj)

        if (prm === undefined) ot = mas

        return ot
    }


    contactObjIn(obj) {
        if (obj.active !== false &&
            obj.hidden !== true &&
            this.collider.bottom > obj.collider.bottom &&
            this.collider.top < obj.collider.top &&
            this.collider.left > obj.collider.left &&
            this.collider.right < obj.collider.right) return obj
    }


    contactIn(prm, key = 'name') {
        let ot = null

        for (const obj of this._mgm.objects)
            if (this.contactObjIn(obj))
                if (obj[key] == prm) {
                    ot = obj
                    break
                }

        return ot
    }


    raycast(prm) {
        if (!prm) prm = {}
        if (!prm.angle) prm.angle = 0
        if (!prm.steps) prm.steps = 40
        if (!prm.density) prm.density = 10

        let x = this.x, y = this.y
        const rad = -(prm.angle - 90) * Math.PI / 180;
        let ot = null
        if (prm.all) ot = []

        for (let i = 0; i < prm.steps; i++) {
            x += prm.density * Math.cos(rad)
            y += prm.density * Math.sin(rad)

            if (prm.visible) {
                this._mgm.context.beginPath()
                this._mgm.context.arc(
                    x + this._mgm.canvCX + this._cameraZXm,
                    -y + this._mgm.canvCY + this._camersZYm,
                    5, 0, 2 * Math.PI)
                this._mgm.context.fillStyle = 'red'
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


    positionTo(prm) {
        let obj = prm
        if (typeof prm == 'string') obj = this._mgm.getObj(prm)
        if (!obj) return
        this.x = obj.x
        this.y = obj.y
    }


    angleTo(prm) {
        let obj = prm
        if (typeof prm == 'string') obj = this._mgm.getObj(prm)
        return this._mgm.angleObj(this, obj)
    }


    distanceTo(prm) {
        let obj = prm
        if (typeof prm == 'string') obj = this._mgm.getObj(prm)
        return this._mgm.distanceObj(this, obj)
    }


    limit(n, min, max) {
        if (this[n] < min) this[n] = min
        if (this[n] > max) this[n] = max
    }


    clone(prm) {
        if (!prm) prm = {}
        prm._obj = this
        prm.name = this.name
        return this._mgm.clone(prm)
    }


    click() {
        if (this._mgm.mouse && this._mgm.mouse.down) {
            if (this._pressK) {
                this._pressK = false
                setTimeout(() => this._pressK = true, 100)
                return this.contactXY(this._mgm.mouse.x, this._mgm.mouse.y)
            }
        }
        if (this._mgm.touch && this._mgm.touch.down) {
            if (this._pressK) {
                this._pressK = false
                setTimeout(() => this._pressK = true, 100)
                return this.contactXY(this._mgm.touch.x, this._mgm.touch.y)
            }
        }
    }


    ondown() {
        if (this._mgm.mouse && this._mgm.mouse.down)
            return this.contactXY(this._mgm.mouse.x, this._mgm.mouse.y)
        if (this._mgm.touch && this._mgm.touch.down)
            return this.contactXY(this._mgm.touch.x, this._mgm.touch.y)
    }




    wait(name, frames, func) {
        if (frames == null) delete this._wait[name]
        else if (!this._wait[name]) {
            this._wait[name] = {}
            const wait = this._wait[name]
            wait.sch = 0
            wait.frames = Math.round(frames)
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
                wait.sch = 0
                wait.frames = Math.round(frames)
                wait.repeat = true
                wait.func = func
                func()
            }
        }
    }


    _waitsWork() {
        for (const j in this._wait) {
            const wait = this._wait[j]
            if (wait.sch == wait.frames) {
                wait.func()
                if (wait.repeat) wait.sch = 0
                else delete this._wait[j]
            } else wait.sch++
        }
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

}




















