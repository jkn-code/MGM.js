

console.log('MGM 1.8');

class MGM {
    constructor(params) {
        this.params = params
        this.object = {}
        this._build = {}
        this.RUN = false
        this.frame = 0
        this.camera = { x: 0, y: 0 }
        this.tabActive = true

        window.onload = () => this._init()
    }


    _init() {

        if (this.params.autorun !== false) this.params.autorun = true


        this._initHTML()
        this._initCanvasPlane()
        this._initMobileControl()
        this._initMouse()
        this._initKeys()

        this._resizeWin()
        window.onresize = () => this._resizeWin()

        if (this.params.borders) {
            this.params.borders = this.params.borders.split(',')
            if (this.params.borders[0]) this.params.borders[0] = this.params.borders[0].trim()
            if (this.params.borders[1]) this.params.borders[1] = this.params.borders[1].trim()
        }


        if (location.protocol != 'file:') {
            this.audioCtx = new AudioContext()
            this._audioCtxOk = true
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

        if (this.params.editor) this._editor = new MGMMapEditor({ mgm: this })

        window.onfocus = () => {
            if (this.tabActive === false) {
                this.tabActive = true
                this._soundsMute(false)
            }
        }
        window.onblur = () => {
            if (this.tabActive === true) {
                this.tabActive = false
                this._soundsMute(true)
            }
        }

        console.log('init ok');
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
            font-size: 10px;
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


        this.curtain = document.createElement('div')
        document.body.appendChild(this.curtain)
        this.curtain.classList.add('mgm-curtain')
        this.curtain.style.cssText = `
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
            height: 100vh; 
            width: 100vw; 
            background: ` + document.body.style.backgroundColor + `; 
            z-index: 999; 
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

        this._defaultContext = {
            textAlign: 'left',
            fontColor: document.body.style.color,
            fontSize: 20,
            fontFamily: 'Tahoma',
            fontWeight: 'normal',
        }
        this.context = this.canvas.getContext('2d')
        this.context.font = '48px serif'
        if (this.params.canvasColor) this.canvas.style.backgroundColor = this.params.canvasColor
        document.body.appendChild(this.canvas)

        if (this.params.canvasFilter) this.canvas.style.filter = this.params.canvasFilter

        this.plane = document.createElement('div')
        this.plane.classList.add('mgm-plane')
        this.plane.style.cssText = `
            display: flex; 
            align-items: center; 
            justify-content: center; 
            position: absolute;
        `
        document.body.appendChild(this.plane)

        let allMgms = document.querySelectorAll('.mgm')
        for (const e of allMgms)
            this.plane.appendChild(e)

        this._crtHtmlId(this.plane)
        this._resizeWin()

        this._htmls = []
        for (const e of allMgms) {
            const cpos = e.getBoundingClientRect()
            const left = cpos.left - this.plane.cpos.left
            const top = cpos.top - this.plane.cpos.top
            this._htmls.push({
                el: e,
                x1: left,
                y1: top,
                x2: left + cpos.width,
                y2: top + cpos.height,
            })
        }
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
                ti.px = ti.clientX - this.plane.cpos.left
                ti.py = ti.clientY - this.plane.cpos.top
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
                const left = cpos.left - this.plane.cpos.left
                const top = cpos.top - this.plane.cpos.top
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
                const left = cpos.left - this.plane.cpos.left
                const top = cpos.top - this.plane.cpos.top
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
        this.mouse = {}
        this.plane.onmousemove = e => {
            this.mouse.px = e.pageX - this.plane.cpos.left
            this.mouse.py = e.pageY - this.plane.cpos.top
            this.mouse.x = this.mouse.px / this.kfHeight - this.canvCX + this.camera.x
            this.mouse.y = -this.mouse.py / this.kfHeight + this.canvCY + this.camera.y
        }
        this.plane.onmousedown = e => {
            this.mouse.down = true
            this.mouse.up = false
        }
        this.plane.onmouseup = e => {
            this.mouse.down = false
            this.mouse.up = true
        }
    }

    _initKeys() {
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
        for (let j in keyNums) this.pressK[keyNums[j]] = true
        document.onkeydown = (e) => {
            e = e || window.event
            let k = keyNums[e.keyCode]
            this.keys[k] = true

            if (this.pressK[k]) {
                this.press[k] = true
                this.pressK[k] = false
                setTimeout(() => {
                    this.pressK[k] = true
                }, 100)
            }
        }
        document.onkeyup = (e) => {
            e = e || window.event
            this.keys[keyNums[e.keyCode]] = false
        }
    }


    _loadResources() {

        this._build.resAll = 0
        this._build.resLoad = 0

        for (let j in this.object)
            if (this.object[j].pic) {
                this.object[j]._pics = {}
                if (typeof this.object[j].pic == 'string') {
                    this.object[j].picName = '_one'
                    this.object[j]._pics[this.object[j].picName] = this._loadPic(this.object[j].pic)
                } else
                    for (let k in this.object[j].pic)
                        this.object[j]._pics[k] = this._loadPic(this.object[j].pic[k])
            }

        if (this._audioCtxOk === undefined) {
            for (let j in this.object)
                if (this.object[j].sounds)
                    for (let k in this.object[j].sounds)
                        this.object[j].sounds[k] = this._loadSound(this.object[j].sounds[k])
        } else {
            for (let j in this.object)
                if (this.object[j].sounds) {
                    if (!this.object[j].sounds) this.object[j].sounds = {}
                    for (let k in this.object[j].sounds)
                        this._loadSoundCtx(this.object[j].sounds[k], j, k)
                }
        }

        let loadWait = setInterval(() => {
            this.curtainIn.innerHTML = '<b>MGM.js</b><br><br><br>Loading<br><br>' + this._build.resLoad + " / " + this._build.resAll
            if (this._build.resAll == this._build.resLoad) {
                clearInterval(loadWait)
                console.log('load ok');
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
        console.log('run');
        if (this.params.fullscreen && this.params.autorun === false)
            this._toggleFullScreen()
        this.curtainIn.innerHTML = ''
        this.curtain.style.display = 'none'
        if (this.params.cursor === false) this.plane.style.cursor = 'none'
        this.objects = []
        this.noconts = []
        this.RUN = true
        this.zList = []
        this.objectsId = 0
        this._resizeWin()

        setTimeout(() => {
            this._initObjs()
            if (this.params.editor) this._editor.loadObj()
            else this._loop()
        }, 0)
    }


    reload(url) {
        let w = setInterval(() => {
            if (this._build.isLoad) {
                clearInterval(w)
                this._reload(url)
            }
        }, 0)
    }

    _reload(url) {
        console.log('reload');
        Mgm.stop()

        this.object = {}
        this.objects = []
        this.noconts = []
        this.camera = { x: 0, y: 0 }

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


    _crtHtmlId(el) {
        let chel = el.childNodes
        let th = this
        for (let i = 0; i < chel.length; i++) {
            if (chel[i].id && chel[i].id != '') {
                this[chel[i].id] = chel[i]
                this[chel[i].id].show = function () {
                    this.style.display = 'block'
                    th._getHtmlBorders()
                }
                this[chel[i].id].hide = function () {
                    this.style.display = 'none'
                    th._getHtmlBorders()
                }
            }
            this._crtHtmlId(chel[i])
        }
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


    _loadSound(src) {
        this._build.resAll++
        const snd = new Audio()
        snd.src = src
        snd.onloadstart = () => {
            this._build.resLoad++
        }
        return snd
    }


    _loadSoundCtx(src, j, k) {
        this._build.resAll++

        let request = new XMLHttpRequest()
        request.open('GET', src, true)
        request.responseType = 'arraybuffer'
        request.onload = () => {
            this.audioCtx.decodeAudioData(request.response, buffer => {
                const sound = {
                    buffer: buffer,
                    end: true,
                    muteVol: 0,
                    muted: false,
                    src: src,
                    duration: buffer.duration
                }

                sound._setMuted = muted => {
                    sound.muted = muted
                    if (!sound.gainNode) return
                    if (muted) {
                        sound.muteVol = sound.gainNode.gain.value
                        sound.gainNode.gain.value = 0
                    } else {
                        sound.gainNode.gain.value = sound.muteVol
                    }
                }

                this.object[j].sounds[k] = sound
                this._build.resLoad++

            }, function (error) {
                console.error('decodeAudioData error', error)
            });
        }
        request.send()
    }


    _resizeWin() {
        this.params.ratio = this.params.ratio || 1
        if (this.params.ratio == 'auto') this.params.ratio = innerWidth / innerHeight

        let w = 0, h = 0

        h = innerHeight
        w = innerHeight * this.params.ratio
        if (w > innerWidth) {
            h = innerWidth / this.params.ratio
            w = innerWidth
        }

        this.canvas.style.width = w + 'px'
        this.canvas.style.height = h + 'px'
        this.params.quality = this.params.quality || 1000
        this.canvas.width = this.params.quality * this.params.ratio
        this.canvas.height = this.params.quality
        this.kfHeight = h / this.params.quality
        this.canvCX = this.canvas.width / 2
        this.canvCY = this.canvas.height / 2

        const cpos = this.canvas.getBoundingClientRect()
        this.plane.cpos = cpos
        this.plane.style.top = cpos.top + 'px'
        this.plane.style.left = cpos.left + 'px'
        this.plane.style.width = cpos.width + 'px'
        this.plane.style.height = cpos.height + 'px'


        document.body.style.fontSize = (this.params.fontSize || (h / 40)) + 'px'

        this._getHtmlBorders()
    }


    _getHtmlBorders() {
        if (this.touch) {
            this._touchSticks.forEach(stick => {
                const cpos = stick.el.getBoundingClientRect()
                const left = cpos.left - this.plane.cpos.left
                const top = cpos.top - this.plane.cpos.top
                stick.x1 = left
                stick.y1 = top
                stick.x2 = left + cpos.width
                stick.y2 = top + cpos.height
                stick.px = left + 60
                stick.py = top + 60
            })
            this._touchBtns.forEach(btn => {
                const cpos = btn.el.getBoundingClientRect()
                const left = cpos.left - this.plane.cpos.left
                const top = cpos.top - this.plane.cpos.top
                btn.x1 = left
                btn.y1 = top
                btn.x2 = left + cpos.width
                btn.y2 = top + cpos.height
            })
        }
        if (this._htmls) this._htmls.forEach(ht => {
            const cpos = ht.el.getBoundingClientRect()
            const left = cpos.left - this.plane.cpos.left
            const top = cpos.top - this.plane.cpos.top
            ht.x1 = left
            ht.y1 = top
            ht.x2 = left + cpos.width
            ht.y2 = top + cpos.height
        })
    }


    _classInf() {
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
                isClone: false,
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
                        this.touch[stick.name] = this.angleXY(stick.px, stick.py, ti.px, ti.py)
                    if (d < stick.d2) joy = true
                }
            })

            this._htmls.forEach(ht => {
                if (ti.px > ht.x1 && ti.px < ht.x2 && ti.py > ht.y1 && ti.py < ht.y2)
                    html = true
            })
        }

        if (joy || html) this.touch.down = false
    }

    _mouseLoop() {
        if (!this.mouse) return

        let html = false

        this._htmls.forEach(ht => {
            if (this.mouse.px > ht.x1 && this.mouse.px < ht.x2 && this.mouse.py > ht.y1 && this.mouse.py < ht.y2)
                html = true
        })

        if (html) this.mouse.down = false
    }

    _loop() {
        this._consDiv.innerHTML = ''

        this._touchLoop()
        this._mouseLoop()

        if (this.params.orderY) this.objects.sort(this._orderY)

        if (!this.params.noClear) this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

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

        for (const z of this.zList) {
            for (let obj of this.objects)
                if (z == obj.z)
                    obj._draw()

            for (let obj of this.noconts)
                if (z == obj.z)
                    obj._draw()
        }

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


        if (this.RUN) requestAnimationFrame(() => this._loop())
        else this._soundsStop()
    }

    _soundsStop() {
        for (const obj of this.objects) {
            if (obj.stop) obj.stop()
            obj._soundStopAll()
        }
        for (const obj of this.noconts) {
            if (obj.stop) obj.stop()
            obj._soundStopAll()
        }
    }

    _soundsMute(muted) {
        if (!this.objects && !this.noconts) return

        for (const obj of this.objects) if (obj.sounds) {
            if (!this._audioCtxOk) {
                for (const j in obj.sounds)
                    obj.sounds[j].muted = muted
            } else {
                for (const j in obj.sounds)
                    obj.sounds[j]._setMuted(muted)
            }
        }

        for (const obj of this.noconts) if (obj.sounds) {
            if (!this._audioCtxOk) {
                for (const j in obj.sounds)
                    obj.sounds[j].muted = muted
            } else {
                for (const j in obj.sounds)
                    obj.sounds[j]._setMuted(muted)
            }
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

    _loadMap(url) {
        if (!url) return
        const s = document.createElement('script')
        document.head.appendChild(s)
        s.src = url
        s.onload = () => {
            console.log('load map: ' + url)
            console.log(Map);
            for (const obj of Map.map) {
                console.log(obj);
                const prm = {
                    name: obj.objName,
                    _mgm: this,
                    active: true,
                }
                for (const k in obj)
                    prm[k] = obj[k]
                console.log(prm);
            }
        }
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
    }

    run() {
        this.RUN = true
        this._loop()
    }

    stop(txt) {
        console.log('stop');
        this.RUN = false
        this.STOP = true
        if (txt || this.params.stopText) {
            this.curtainIn.innerHTML = txt || this.params.stopText
            this.curtain.style.display = 'flex'
        }
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
        if (min !== undefined && max !== undefined) return Math.floor(Math.random() * (max - min + 1)) + min;
        else if (Math.random() >= 0.5) return true
        else return false
    }

    angleXY(x1, y1, x2, y2) {
        let angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI
        if (angle > 180) angle -= 360
        if (angle < -180) angle += 360
        return angle
    }

    angleObj(obj1, obj2) {
        if (obj1.active === false) return
        if (obj2.active === false) return
        return this.angleXY(obj1.x, obj1.y, obj2.x, obj2.y)
    }

    distanceXY(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
    }

    distanceObj(obj1, obj2) {
        if (obj1.active === false) return
        if (obj2.active === false) return
        return this.distanceXY(obj1.x, obj1.y, obj2.x, obj2.y)
    }

    clone(prm) {
        if (this.objects.length > 10000) return
        if (this.noconts.length > 10000) return
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

        for (const obj of this.objects)
            if (obj.active !== false)
                if (!prm) ot.push(obj)
                else if (obj[key] == prm) ot.push(obj)

        return ot
    }

    getStep(angle, dist) {
        const rad = angle * Math.PI / 180;
        return {
            x: dist * Math.cos(rad),
            y: dist * Math.sin(rad)
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

    loadMap(map) {
        if (this.params.editor) return

        let w = setInterval(() => {
            if (this._build.isInitAll) {
                clearInterval(w)
                this._loadMap(map)
            }
        }, 0)

    }

    _loadMap(map) {
        console.log('_loadMap ', map);
    }

    log(s) {
        this._logs.push(s)
    }

}




















class MGMObject {
    constructor(params) {

        if (params.isClone !== false) params.isClone = true
        let obj

        if (!params.isClone) obj = params._mgm.object[params.name]
        if (params.isClone) {
            if (params._obj) obj = params._obj
            else obj = params._mgm.object[params.name]
        }

        for (const j in obj) {
            const v = obj[j]
            if (j == 'pic' || j == '_pics' || j == 'picName' ||
                j == 'sounds' ||
                j == 'name' || j == '_mgm' || j == '_obj' ||
                typeof v == 'function') this[j] = v
            else {
                if (params.isClone) this[j] = JSON.parse(JSON.stringify(v))
            }
        }

        this._mgm = params._mgm
        if (!this.collider) this.collider = {}
        if (params.active !== false) this.active = true

        if (!params.isClone && this.init) this.init(this)

        if (!params.isClone) this.name = params.name
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
        if (this._mgm.zList.indexOf(this.z) == -1) {
            this._mgm.zList.push(this.z)
            this._mgm.zList.sort(function (a, b) {
                return a - b;
            })
        }

        if (this.rotation === undefined) this.rotation = 0
        if (this.angle === undefined) this.angle = 0
        if (this.size === undefined) this.size = 1
        if (this.alpha === undefined) this.alpha = 1


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

        if (this.width !== undefined) this._prmWidth = this.width
        if (this.height !== undefined) this._prmHeight = this.height

        if (typeof this.pic != 'string')
            this.picName = this._mgm._firstJ(this.pic)


        this._wait = {}
        this._pressK = true

    }


    _update() {

        this._work()
        this._waitsWork()

        if (this._goStart && this.start) {
            this.start(this)
            delete this._goStart
        }

        if (this.update && this.active) this.update(this)
    }





    _work() {
        if (this.angle < -180) this.angle += 360
        if (this.angle > 180) this.angle -= 360
        if (this.anglePic) this.rotation = this.angle

        if (this.atCamera) {
            this._mgm.camera.x = this.x
            this._mgm.camera.y = this.y
        }

        this._image = this._getPic()

        if (this._image) {
            if (this._prmWidth === undefined) this.width = this._image.width
            if (this._prmHeight === undefined) this.height = this._image.height
        } else {
            if (this.width === undefined) this.width = 1
            if (this.height === undefined) this.height = 1
        }

        this._width = this.width * this.size
        this._height = this.height * this.size
        this._width2 = this._width / 2
        this._height2 = this._height / 2

        if (!this.nocont) {
            if (this.physics && this.mass) {
                if (!this.onGround) this.gravVel -= 0.5
                this.y += this.mass * this.gravVel
                this.onGround = false
            }

            this.collider._pivotXL = this._width * this.collider.width / 2 - this._width * this.collider.x
            this.collider._pivotXR = this._width * this.collider.width / 2 + this._width * this.collider.x
            this.collider._pivotYB = this._height * this.collider.height / 2 - this._height * this.collider.y
            this.collider._pivotYT = this._height * this.collider.height / 2 + this._height * this.collider.y

            this.collider.left = this.x - this.collider._pivotXL
            this.collider.right = this.x + this.collider._pivotXR
            this.collider.top = this.y + this.collider._pivotYT
            this.collider.bottom = this.y - this.collider._pivotYB

            if (this.bounce) {
                if (this.collider.right > this._mgm.canvCX || this.collider.left < -this._mgm.canvCX) this.angle = 180 - this.angle
                if (this.collider.top > this._mgm.canvCY || this.collider.bottom < -this._mgm.canvCY) this.angle = -this.angle
            }

            this._physicWork()
        }

        this.collider._px = this.collider.px * this._width
        this.collider._py = this.collider.py * this._height

        if (this.flipX)
            if (this.angle > -90 && this.angle < 90) this.flipXV = 1
            else this.flipXV = -1
        if (this.flipY)
            if (this.angle > 0) this.flipYV = 1
            else this.flipYV = -1
    }

    _physicWork() {
        if (this.hidden) return
        if (!this.physics) return
        if (this.active === false) return

        if (this.physics == 'unit' || this.physics == 'unit2') {
            let nextX = 0
            let nextY = 0
            this.onGround = false
            for (const obj of this._mgm.objects)
                if (this.objectId != obj.objectId && !obj.hidden && obj.active)
                    if (obj.physics == 'wall'
                        || (this.physics == 'unit' && obj.physics == 'unit2')
                        || (this.physics == 'unit2' && obj.physics == 'unit'))
                        if (this.collider.right > obj.collider.left &&
                            this.collider.left < obj.collider.right &&
                            this.collider.top > obj.collider.bottom &&
                            this.collider.bottom < obj.collider.top
                        ) {
                            let vx = 0, vy = 0

                            if (this.collider.right > obj.collider.left && this.collider.left < obj.collider.left)
                                vx = this.collider.right - obj.collider.left
                            if (this.collider.left < obj.collider.right && this.collider.right > obj.collider.right)
                                vx = this.collider.left - obj.collider.right
                            if (this.collider.top > obj.collider.bottom && this.collider.bottom < obj.collider.bottom)
                                vy = this.collider.top - obj.collider.bottom
                            if (this.collider.bottom < obj.collider.top && this.collider.top > obj.collider.top)
                                vy = this.collider.bottom - obj.collider.top

                            if (vx != 0 || vy != 0) {
                                if (Math.abs(vx) < Math.abs(vy) || vy == 0)
                                    nextX = vx

                                if (Math.abs(vx) > Math.abs(vy) || vx == 0) {
                                    nextY = vy
                                    this.gravVel = 0
                                }
                            }
                        }

            this.x -= nextX
            this.y -= nextY

            for (const obj of this._mgm.objects) if (this.objectId != obj.objectId && obj.active)
                if (obj.physics == 'wall' || obj.physics == 'unit2')
                    if (this.x + this.collider._pivotXR > obj.collider.left &&
                        this.x - this.collider._pivotXL < obj.collider.right &&
                        this.y + this.collider._pivotYT > obj.collider.bottom &&
                        this.y - this.collider._pivotYB - 1 < obj.collider.top
                    ) this.onGround = true
        }
    }


    _draw() {
        if (this.hidden) return
        if (this.active === false) return
        if (this._toDel === false) return

        const gr = 0
        if (this.inDraw === undefined && this.onCamera === undefined)
            if (this.y - this.collider._py + this._height2 < this._mgm.camera.y - this._mgm.canvCY + gr ||
                this.y - this.collider._py - this._height2 > this._mgm.camera.y + this._mgm.canvCY - gr ||
                this.x + this.collider._px - this._width2 > this._mgm.camera.x + this._mgm.canvCX - gr ||
                this.x + this.collider._px + this._width2 < this._mgm.camera.x - this._mgm.canvCX + gr
            ) return

        if (this.onCamera === undefined) {
            this._cameraZXm = - this._mgm.camera.x * this.cameraZX
            this._camersZYm = this._mgm.camera.y * this.cameraZY
        } else {
            this._cameraZXm = 0
            this._camersZYm = 0
        }

        this._mgm.context.save()
        this._mgm.context.translate(
            Math.round(this.x + this._mgm.canvCX + this._cameraZXm + this.collider._px),
            Math.round(-this.y + this._mgm.canvCY + this._camersZYm + this.collider._py)
        )
        this._drawPrimitives(2)

        if (this.alpha < 1) this._mgm.context.globalAlpha = this.alpha
        else this._mgm.context.globalAlpha = 1
        if (this.rotation != 0) this._mgm.context.rotate(this.rotation * Math.PI / 180)
        this._mgm.context.scale(this.flipXV, this.flipYV)
        if (this.effect) this._mgm.context.filter = this.effect

        if (this._image) this._mgm.context.drawImage(this._image,
            -this._width / 2,
            -this._height / 2,
            this._width,
            this._height)

        this._drawPrimitives(1)
        this._mgm.context.restore()

        if (this.border) this._boardsShow(this.border)
        if (this._mgm.params.borders) this._boardsShow(this._mgm.params.borders)


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
        else this._mgm.context.fillStyle = this._mgm._defaultContext.fontColor
        prm.fontSize = (prm.size || this._mgm._defaultContext.fontSize) + 'px'
        if (!prm.family) prm.family = this._mgm._defaultContext.fontFamily
        if (!prm.weight) prm.weight = this._mgm._defaultContext.fontWeight
        if (prm.align) this._mgm.context.textAlign = prm.align
        else this._mgm.context.textAlign = this._mgm._defaultContext.textAlign
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
        const rad = -this.angle * Math.PI / 180;
        this.x += speed * Math.cos(rad)
        this.y += speed * Math.sin(rad)
    }

    stepA(speed, angle = 0) {
        this.angle = angle
        const rad = -this.angle * Math.PI / 180;
        this.x += speed * Math.cos(rad)
        this.y += speed * Math.sin(rad)
    }

    wasd(speed = 0, LR = true) {
        if (this._mgm.keys.d) this.x += speed
        if (this._mgm.keys.a) this.x -= speed
        if (!LR) return
        if (this._mgm.keys.w) this.y += speed
        if (this._mgm.keys.s) this.y -= speed
    }

    wasdA(speed = 0, LR = true) {
        let down = false
        if (this._mgm.keys.w) this.angle = -90;
        if (this._mgm.keys.s) this.angle = 90;
        if (LR) {
            if (this._mgm.keys.d) this.angle = 0;
            if (this._mgm.keys.a) this.angle = 180;
            if (this._mgm.keys.w && this._mgm.keys.d) this.angle = -45;
            if (this._mgm.keys.w && this._mgm.keys.a) this.angle = -135;
            if (this._mgm.keys.s && this._mgm.keys.d) this.angle = 45;
            if (this._mgm.keys.s && this._mgm.keys.a) this.angle = 135;
        }
        if (this._mgm.keys.w ||
            this._mgm.keys.s ||
            this._mgm.keys.a ||
            this._mgm.keys.d) this.step(speed)
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
            this.collider.top > obj.collider.bottom &&
            this.collider.bottom < obj.collider.top &&
            this.collider.right > obj.collider.left &&
            this.collider.left < obj.collider.right) return obj
    }

    contact(prm, key = 'name') {
        let ot, res

        for (const obj of this._mgm.objects)
            if (res = this.contactObj(obj))
                if (obj[key] == prm) {
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

        if (prm) for (const obj of mas)
            if (obj[key] == prm) ot.push(obj)

        if (prm === undefined) ot = mas

        return ot
    }

    contacts2() {
        const ot = []
        let res

        for (const obj of this._mgm.objects)
            if (obj != this)
                if (res = this.contactObj(obj))
                    ot.push(res)


        if (ot.length > 0) return ot
    }

    contactObjIn(obj) {
        if (obj.active !== false &&
            !obj.hidden &&
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

        if (ot.length > 0) return ot
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
        this.x = obj.x
        this.y = obj.y
    }

    angleTo(prm) {
        let obj = prm
        if (typeof prm == 'string') obj = this._mgm.getObj(prm)
        return -this._mgm.angleObj(this, obj)
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




    soundPlay(prm = {}) {
        if (prm.volume === undefined) prm.volume = 1
        if (prm.volume < 0) prm.volume = 0

        const sound = this._getSound(prm)

        if (this._mgm._audioCtxOk) this._soundPlayCtx(prm, sound)
        else this._soundPlay(prm, sound)
    }

    _getSound(prm) {
        let sound

        if (!prm.name) sound = this._mgm._firstV(this.sounds)
        else sound = this.sounds[prm.name]

        return sound
    }

    _soundPlay(prm, sound) {
        if (!prm.loop) {
            if (prm.toend)
                if (sound.currentTime == 0 || sound.currentTime >= sound.duration)
                    this._soundStart(sound, prm.volume)
            if (!prm.toend) this._soundStart(sound, prm.volume)
        }
        else {
            if (!sound.mloop) {
                this._soundStart(sound, prm.volume)
                sound.mloop = setInterval(() => this._soundStart(sound, prm.volume), sound.duration * 1000)
            }
        }
    }

    _soundStart(sound, vol) {
        sound.pause();
        sound.volume = vol;
        sound.currentTime = 0;
        sound.play()
    }

    soundStop(name) {

        const sound = this._getSound(prm)

        if (sound.mloop) {
            clearInterval(sound.mloop)
            sound.mloop = null
        }

        sound.pause()
        sound.currentTime = 0
    }

    _soundPlayCtx(prm, sound) {
        if (prm.pan === undefined) prm.pan = 0

        sound.source = this._mgm.audioCtx.createBufferSource()
        sound.source.buffer = sound.buffer

        const panNode = this._mgm.audioCtx.createStereoPanner()
        panNode.pan.setValueAtTime(prm.pan, this._mgm.audioCtx.currentTime)
        panNode.connect(this._mgm.audioCtx.destination)
        sound.panNode = panNode

        let gainNode = this._mgm.audioCtx.createGain()
        gainNode.gain.value = prm.volume
        gainNode.connect(panNode)
        sound.source.connect(gainNode)
        sound.gainNode = gainNode

        if (sound.muted) sound._setMuted(true)

        if (prm.loop) sound.source.loop = true

        sound.source.onended = () => {
            sound.end = true
        }

        if (prm.toend && sound.end) {
            sound.source.start(0)
            sound.on = true
            sound.end = false
        }
        if (!prm.toend) {
            sound.source.start(0)
            sound.on = true
        }
    }

    soundPrm(prm) {
        console.log(prm);
        if (prm.name === undefined) return

        if (prm.volume !== undefined) {
            if (this._mgm._audioCtxOk) this.sounds[prm.name].gainNode.gain.value = prm.volume
            else this.sounds[prm.name].volume = prm.volume
        }

        if (prm.pan !== undefined) {
            if (this._mgm._audioCtxOk) this.sounds[prm.name].panNode.pan.setValueAtTime(prm.pan, this._mgm.audioCtx.currentTime)
        }
    }


    _soundStopAll() {
        if (!this.sounds) return

        if (!this._mgm._audioCtxOk) {
            for (const j in this.sounds)
                this.sounds[j].pause()
        } else {
            for (const j in this.sounds)
                if (this.sounds[j].on)
                    this.sounds[j].source.stop(0)
        }
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


















class MGMMapEditor {
    constructor(params) {
        console.log('MAP> ', params);
        this.params = params
        this.params.mgm.params.ratio = 'auto'
        this.params.mgm._resizeWin()
        this.initHtml()
        this.initVar()
        this.changeGrid()
    }

    initHtml() {
        const style = document.createElement('style')
        style.type = 'text/css'
        const css = `
        .mgm-map {
            position: absolute;
            top: 0;
            right: 0;
            z-index: 999;
            width: 400px;
            height: 100vh;
            1border: 1px solid #0005;
            background-color: #000c;
            1box-shadow: 0 0 20px #0005;
            color: #fff;
            font-size: 12px;
            padding: 0 10px;
            box-sizing: border-box;
        }
        .mgmm-bline {
            display: flex;
            1justify-content: space-between;
            align-items: center;
            padding: 7px 0;
            1border-bottom: 1px solid #555;
            white-space: nowrap;
        }
        .mgm-map input[type="text"],
        .mgm-map input[type="number"], 
        .mgm-map input[type="number"], 
        .mgm-map textarea {
            border: 1px solid #aaa;
            background-color: #555;
            color: #fff;
            width: 100%;
            margin: 0 15px 0 5px;
        }
        .mgm-map .btn {
            border: 1px solid #555;
            padding: 2px 10px;
            cursor: pointer;
            border-radius: 3px;
            background-color: #222;
            transition: 0.3s;
        }
        .mgm-map-move .btn {
            padding: 2px 15px;
            line-height: 30px;
            font-size: 18px;
        }
        .mgm-map .btn:hover {
            background-color: rgb(73, 73, 73);
            1box-shadow: 0 0 10px #fff;
            border: 1px solid #aaa;
        }
        .mgm-map .btn.psel {
            border: 1px solid #555;
        }
        .mgm-map .btn.psel.sel {
            border: 1px solid #ccc;
            box-shadow: 0 0 10px #fffa;
        }
        .mgm-map .btn.vdl {
            border: 1px solid #555;
        }
        .mgm-map-move {
            position: absolute;
            top: 0px;
            right: 400px;
            text-align: center;
            z-index: 999;
            user-select: none;
            background-color: #000c;
            padding: 15px;
            padding-right: 5;
            border-bottom-left-radius: 30px;
            white-space: nowrap;
        }
        .mgm-map hr {
            height: 1px;
            border: none;
            background: #333;
        }

        #mgmmUList {
            padding: 10px 0;
            display: flex;
            flex-wrap: wrap;
        }
        #mgmmUList div {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 5px;
            margin-right: 10px;
            margin-bottom: 10px;
            border: 1px solid #555;
            border-radius: 5px;
            height: 50px;
            1vertical-align: bottom;
            cursor: pointer;
        }
        #mgmmUList div span {
            display: block;
        }
        #mgmmUList div img {
            height: 30px;
            margin-bottom: 5px;
        }
        .mgmmObjSel {
            border: 1px solid #fff!important;
            box-shadow: 0 0 10px #fff;
        }

        #mgmmPlane {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 900;
        }
        #mgmmGrid {
            background-size: 20px 10px;
            background-image:
                linear-gradient(to right, #fff1 1px, transparent 1px),
                linear-gradient(to bottom, #fff1 1px, transparent 1px);
            z-index: 900;
            position: absolute;
            width: 100vw;
            height: 100vh;
        }
        #mgmmHover {
            position: absolute;
            top: -10px;
            width: 4px;
            height: 4px;
            transform: translate(-1px, -1px);
            background-color: red;
            z-index: 910;
            pointer-events: none;
        }
        `
        style.appendChild(document.createTextNode(css))
        document.head.appendChild(style)

        this.mplane = document.createElement('div')
        document.body.appendChild(this.mplane)
        this.mplane.innerHTML = `
        <div class="mgm-map">
            <div class="mgmm-bline">
                Load file <input type="text" id="mgmmLoadFile">
                <span class="btn" onclick="MgmMap.clearMap()">Clear</span>
            </div>
            <div class="mgmm-bline">
                Map code: <input type="text" id="mgmmJstext">
                <span class="btn" id="mgmmCopy">Copy</span>
            </div>
            <div class="mgmm-bline">
                Layer-Z: <input type="number" id="mgmmLayerZ" value="0" style="width: 50px">
                Alpha.: <input type="range" id="mgmmLayersOpacity" min="0" max="10" value="10">
            </div>
            <div class="mgmm-bline">
                Grid: &nbsp;
                <label>on/off<input type="checkbox" id="mgmmGridOn" checked></label>&nbsp;&nbsp;
                width: <input type="number" id="mgmmGridWidth" style="width: 50px" value="20">
                height: <input type="number" id="mgmmGridHeight" style="width: 50px" value="20">
            </div>
            <div class="mgm-map-move">
                <span class="btn" id="mgmmTUp">&#9650;</span><br>
                <span class="btn" id="mgmmTLeft">&#9668;</span>
                <span class="btn" id="mgmmTRight">&#9658;</span><br>
                <span class="btn" id="mgmmTDown">&#9660;</span>
            </div>
            <hr>
            <div class="mgmm-bline">
                <span class="btn psel" id="mgmmCfg">Cfg</span> &nbsp;
                <span class="btn psel" id="mgmmEraser">Eraser</span>
            </div>
            <div id="mgmmUList"></div>
        </div>

        <div id="mgmmPlane"></div>
        <div id="mgmmGrid"></div>
        <div id="mgmmHover"></div>
        `
    }

    initVar() {
        this.mmap = []
        this.mapCX = 0
        this.mapCY = 0
        this.idObjs = 1
        this.itemSel = {
            obj: undefined,
            type: undefined
        }

        mgmmJstext.onclick = e => e.target.select()
        mgmmCopy.onclick = e => navigator.clipboard.writeText(mgmmJstext.value)
        mgmmGrid.onclick = e => this.clickGrid()
        mgmmCfg.onclick = e => this.objItemClick(null, 'cfg')
        mgmmEraser.onclick = e => this.objItemClick(null, 'eraser')
        mgmmPlane.onclick = e => this.mgmmPlaneClick(e)
        mgmmGridWidth.onchange = e => this.changeGrid()
        mgmmGridHeight.onchange = e => this.changeGrid()
        mgmmGridOn.onchange = e => {
            this.grid.on = !this.grid.on
            this.changeGrid()
        }

        this.mouse = { x: 0, y: 0 }
        document.onmousemove = e => {
            this.mouse.x = e.clientX
            this.mouse.y = e.clientY
            this.setHover()
        }

        this.hover = {}

        this.grid = {
            on: true,
            x: 0,
            y: 0,
        }

        const save = JSON.parse(localStorage['MgmMapSave'] || '{}')
        this.save = save[decodeURI(location.pathname)] || {}
        this.selObjName = this.save.selObjName
        this.eraser = this.save.eraser || false
        this.cfg = this.save.cfg || false
        this.layersOpacity = this.save.layersOpacity
        this.mapCX = this.save.mapCX || '0'
        this.mapCY = this.save.mapCY || '0'
    }

    loadObj() {
        console.log(this.params.mgm.object);
        for (const j in this.params.mgm.object) {
            const obj = this.params.mgm.object[j]
            console.log(obj);
            const objItem = document.createElement('div')
            objItem.setAttribute('name-obj', obj.name)
            objItem.onclick = e => this.objItemClick(obj, 'obj')
            if (obj._pics) objItem.appendChild(obj._pics[obj.picName])
            objItem.innerHTML += '<span>' + obj.name + '</span>'
            mgmmUList.appendChild(objItem)
        }
    }

    objItemClick(obj, type) {
        this.itemSel.obj = obj
        this.itemSel.type = type
        document.querySelectorAll('#mgmmUList div').forEach(e => e.classList.remove('mgmmObjSel'))
        mgmmCfg.classList.remove('mgmmObjSel')
        mgmmEraser.classList.remove('mgmmObjSel')
        if (type == 'obj') document.querySelector('#mgmmUList div[name-obj="' + obj.name + '"]').classList.add('mgmmObjSel')
        if (type == 'cfg') mgmmCfg.classList.add('mgmmObjSel')
        if (type == 'eraser') mgmmEraser.classList.add('mgmmObjSel')
    }

    mgmmPlaneClick(e) {
        console.log(e);
    }

    changeGrid() {
        console.log(this.grid);
        if (this.grid.on) {
            this.grid.x = this.mapCX % mgmmGridWidth.value
            this.grid.y = this.mapCY % mgmmGridHeight.value
            mgmmGrid.style.backgroundSize = mgmmGridWidth.value + 'px ' + mgmmGridHeight.value + 'px'
            mgmmGrid.style.backgroundPosition = this.grid.x + 'px ' + this.grid.y + 'px'
        } else {
        }
        this.saveMap()
    }

    setHover() {
        if (this.grid.on) {
            this.hover.px = Math.floor((this.mouse.x - this.grid.x) / mgmmGridWidth.value) * mgmmGridWidth.value + this.grid.x
            mgmmHover.style.left = this.hover.px + 'px'
            this.hover.py = Math.floor((this.mouse.y - this.grid.y) / mgmmGridHeight.value) * mgmmGridHeight.value + this.grid.y
            mgmmHover.style.top = this.hover.py + 'px'
        } else {
            this.hover.px = this.mouse.x
            mgmmHover.style.left = this.hover.px + 'px'
            this.hover.py = this.mouse.y
            mgmmHover.style.top = this.hover.py + 'px'
        }
    }

    clickGrid() {
        let x = this.hover.px - this.mapCX
        let y = this.hover.py - this.mapCY
        console.log(x, y);

        if (this.itemSel.type == 'obj') {
            this.mmap.push({
                idObj: this.idObjs++,
                objName: this.itemSel.obj.name,
                x: x,
                y: y,
                layerZ: mgmmLayerZ.value
            })
        }

        if (this.eraser) {
            this.mmap.forEach((mobj, i) => {
                if (mobj.x == x && mobj.y == y && mobj.layerZ == mgmmLayerZ.value) {
                    console.log('delete ', mobj);
                    mobj._imgMap.remove()
                    mobj._pivot.remove()
                    this.mmap.splice(i, 1)
                }
            })
        }

        this.printMMap()
    }

    printMMap() {

        console.log(this.mmap);



        this.saveMap()
    }

    saveMap() {
        console.log('-savePrj-');
        const save = JSON.parse(localStorage['MgmMapSave'] || '{}')
        this.save = save[decodeURI(location.pathname)]
        if (!this.save) this.save = {}
        this.save.gridOn = mgmmGridOn.checked
        this.save.gridWidth = mgmmGridWidth.value
        this.save.gridHeight = mgmmGridHeight.value
        this.save.layerZ = mgmmLayerZ.value
        this.save.layersOpacity = mgmmLayersOpacity.value
        this.save.mapCX = this.mapCX
        this.save.mapCY = this.mapCY
        this.save.map = this.mmap
        mgmmJstext.value = 'const Map = ' + JSON.stringify(this.save)
        save[decodeURI(location.pathname)] = this.save
        localStorage['MgmMapSave'] = JSON.stringify(save)
    }
}








