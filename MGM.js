
console.log('Created with http://mgm.innercat.ru');
console.log('MGM v. 1.0');

class MGM {
    constructor(prm) {
        this.prm = prm
        this._loadPage()
    }

    _classInf() {
        // console.log(Object.getOwnPropertyNames(this));
        // console.log(Object.getOwnPropertyNames(this.__proto__));
    }

    _loadPage() {
        this.object = {}
        this.names = {}
        this._build = {}

        if (this.prm.vars)
            for (const j in this.prm.vars)
                this[j] = this.prm.vars[j]

        if (this.prm.scripts) {
            this.prm.scripts.forEach(script => {
                const s = document.createElement('script')
                document.head.appendChild(s)
                s.src = script
                s.onload = () => {
                    console.log('ok ' + script);
                }
            })
        }

        window.onload = () => this._loadResourses()
    }

    _loadResourses() {
        // CFG HTML
        {
            let viewPortTag = document.createElement('meta');
            viewPortTag.id = "viewport";
            viewPortTag.name = "viewport";
            viewPortTag.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0";
            document.head.appendChild(viewPortTag)

            document.body.style.backgroundColor = this.prm.bgPage || '#eee'
            document.body.style.fontFamily = this.prm.fontFamily || 'Tahoma';
            document.body.style.color = this.prm.fontColor || '#555'
            document.body.style.overflow = 'hidden'

            this._consDiv = document.createElement('div')
            this._consDiv.style.cssText = `position: absolute; z-index: 999; top: 0px; left: 0px; max-height: 50vh; width: 50vw; overflow-y: auto; opacity: 1; display: none; font-size: 11px; word-wrap: break-word;`
            document.body.appendChild(this._consDiv)

            if (this.prm.icon) {
                let link = document.createElement('link')
                link.rel = 'icon'
                link.href = this.prm.icon
                document.head.appendChild(link)
            }
            if (this.prm.name) {
                if (!document.createElement('title')) document.createElement('title')
                document.title = this.prm.name
            }

            this.curtain = document.createElement('div')
            document.body.appendChild(this.curtain)
            this.curtain.style.cssText = 'position: absolute; top: 0; left: 0; height: 100vh; width: 100vw; background: ' + document.body.style.backgroundColor + '; z-index: 999; cursor: pointer;'
            this.curtainIn = document.createElement('div')
            this.curtain.appendChild(this.curtainIn)
            this.curtainIn.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center;'
            this.curtainIn.innerHTML = 'Загрузка'
        }


        // LOAD IMAGES & SOUNDS
        {
            this._build.resAll = 0
            this._build.resLoad = 0

            for (let j in this.object)
                if (this.object[j].pics)
                    for (let k in this.object[j].pics)
                        this.object[j].pics[k] = this._loadPic(this.object[j].pics[k])
                else
                    if (this.object[j].pic)
                        this.object[j].pic = this._loadPic(this.object[j].pic)

            for (let j in this.object)
                if (this.object[j].sounds)
                    for (let k in this.object[j].sounds)
                        this.object[j].sounds[k] = this._loadSound(this.object[j].sounds[k])
                else
                    if (this.object[j].sound)
                        this.object[j].sound = this._loadSound(this.object[j].sound)


            let loadWait = setInterval(() => {
                this.curtainIn.innerHTML = 'Загрузка<br><br>' + this._build.resLoad + " / " + this._build.resAll
                if (this._build.resAll == this._build.resLoad) {
                    clearInterval(loadWait)
                    // console.log('load ok');
                    setTimeout(() => this._init(), 300)
                }
            }, 10)
        }
    }

    _init() {
        this.RUN = false
        this.frame = 0
        this.camera = { x: 0, y: 0 }

        // console.log(this);

        // CREATE CANVAS & PLANE
        {
            this.canvas = document.createElement('canvas')
            this.canvas.style.cssText = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);`
            this._defaultContext = {
                textAlign: 'left',
                fontColor: '#000',
                fontSize: '20px',
                fontFamily: 'Tahoma',
                fontWeight: 'normal',
            }
            this.context = this.canvas.getContext('2d')
            this.context.font = '48px serif'
            this.canvas.style.backgroundColor = this.prm.bgCanvas || '#fff'
            document.body.appendChild(this.canvas)

            this.plane = document.createElement('div')
            this.plane.style.position = 'absolute'
            document.body.appendChild(this.plane)

            this._resizeWin()
            window.onresize = () => this._resizeWin()

            // HTML MGM TO PLANE
            let amgm = document.querySelectorAll('.mgm')
            for (const e of amgm) 
                this.plane.appendChild(e)

            this._crtHtmlId(this.plane)

            this._htmls = []
            for (const e of amgm) {
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


        // MOBILE CONTROL
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        if (this.isMobile) {
            this.touch = {}
            this.touches = []
            this._touchBtns = []
            this._touchSticks = []

            const toushFn = e => {
                this.touch.down = true
                this.touches = e.touches
                for (let i = 0; i < this.touches.length; i++) {
                    const ti = this.touches[i]
                    // plane
                    ti.px = ti.clientX - this.plane.cpos.left
                    ti.py = ti.clientY - this.plane.cpos.top
                    // center
                    ti.x = ti.px / this.kfHeight - this.canvCX + this.camera.x
                    ti.y = -ti.py / this.kfHeight + this.canvCY + this.camera.y
                }
                this.touch.px = this.touches[0].px // plane
                this.touch.py = this.touches[0].py
                this.touch.x = this.touches[0].x // center
                this.touch.y = this.touches[0].y
            }

            document.addEventListener("contextmenu", e => e.preventDefault()) // disable popup
            document.addEventListener("touchstart", toushFn)
            document.addEventListener("touchend", e => {
                this.touch.down = false
                this.touches = e.touches
            })
            document.addEventListener("touchmove", toushFn)

            const color = this.prm.mobileColor || 'gray'
            const styleBtn = 'position: absolute; background-color: ' + color + '; border: 2px solid ' + color + '; border-radius: 100px; z-index: 5;'
            const control = this.prm.mobileControl || 'stickL, br1, br2, br3, br4'
            let cm = control.split(',')
            cm.forEach(c => {
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
                if (name == 'stickL') bst = 'left: 20px; bottom: 40px;'
                if (name == 'stickR') bst = 'right: 20px; bottom: 40px;'

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
        }



        // MOUSE
        if (!this.isMobile) {
            this.mouse = {}
            this.plane.onmousemove = e => {
                // plane
                this.mouse.px = e.pageX - this.plane.cpos.left
                this.mouse.py = e.pageY - this.plane.cpos.top
                // center
                this.mouse.x = this.mouse.px / this.kfHeight - this.canvCX + this.camera.x
                this.mouse.y = -this.mouse.py / this.kfHeight + this.canvCY + this.camera.y
            }
            this.plane.onmousedown = e => this.mouse.down = true
            this.plane.onmouseup = e => this.mouse.down = false
        }



        // KEYS
        {
            this.keys = {}
            /* let s = {}
            for (let i = 48; i <= 57; i++)
                s[i] = 'n' + (String.fromCharCode(i)).toLowerCase()
            console.log(s);*/
            let keyNums = {
                38: 'up', 40: 'down', 37: 'left', 39: 'right',
                32: 'space', 13: 'enter', 27: 'escape', 16: 'shift', 17: 'ctrl', 8: 'backspace',
                65: 'a', 66: 'b', 67: 'c', 68: 'd', 69: 'e', 70: 'f', 71: 'g', 72: 'h', 73: 'i', 74: 'j', 75: 'k', 76: 'l', 77: 'm', 78: 'n', 79: 'o', 80: 'p', 81: 'q', 82: 'r', 83: 's', 84: 't', 85: 'u', 86: 'v', 87: 'w', 88: 'x', 89: 'y', 90: 'z',
                48: 'n0', 49: 'n1', 50: 'n2', 51: 'n3', 52: 'n4', 53: 'n5', 54: 'n6', 55: 'n7', 56: 'n8', 57: 'n9',
            }
            for (let j in keyNums) this.keys[keyNums[j]] = false
            document.onkeydown = (e) => {
                e = e || window.event
                this.keys[keyNums[e.keyCode]] = true
            }
            document.onkeyup = (e) => {
                e = e || window.event
                this.keys[keyNums[e.keyCode]] = false
            }
        }


        // AUDIO
        // this.audioCtx = new AudioContext()
        // this._loadSounds()

        if (this.prm.autorun) this._run()
        else {
            this.curtainIn.innerHTML = this.prm.startTxt || '<center><b>Start</b><br><br><small>click to run</small></center>'
            this.curtain.onclick = () => {
                if (!this.RUN && !this.STOP)
                    this._run()
            }
        }

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

    _resizeWin() {
        this.prm.ratio = this.prm.ratio || 1

        let w = 0, h = 0

        if (innerWidth < innerHeight) { // if mobile v screen
            this.canvas.style.top = '0px'
            this.canvas.style.transform = 'translate(-50%, 0%)'
        } else {
            this.canvas.style.top = '50%'
            this.canvas.style.transform = 'translate(-50%, -50%)'
        }
        h = innerHeight
        w = innerHeight * this.prm.ratio
        if (w > innerWidth) {
            h = innerWidth / this.prm.ratio
            w = innerWidth
        }

        this.canvas.style.width = w + 'px'
        this.canvas.style.height = h + 'px'
        this.prm.quality = this.prm.quality || 1000
        this.canvas.width = this.prm.quality * this.prm.ratio
        this.canvas.height = this.prm.quality
        this.kfHeight = h / this.prm.quality
        this.canvCX = this.canvas.width / 2
        this.canvCY = this.canvas.height / 2

        const cpos = this.canvas.getBoundingClientRect()
        this.plane.cpos = cpos
        this.plane.style.top = cpos.top + 'px'
        this.plane.style.left = cpos.left + 'px'
        this.plane.style.width = cpos.width + 'px'
        this.plane.style.height = cpos.height + 'px'

        this.curtain.style.top = cpos.top + 'px'
        this.curtain.style.left = cpos.left + 'px'
        this.curtain.style.width = cpos.width + 'px'
        this.curtain.style.height = cpos.height + 'px'

        // console.log(w / 50);
        document.body.style.fontSize = this.prm.fontSize || (w / 50) + 'px'

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
        if (this.mouse) {
            this._htmls.forEach(ht => {
                const cpos = ht.el.getBoundingClientRect()
                const left = cpos.left - this.plane.cpos.left
                const top = cpos.top - this.plane.cpos.top
                ht.x1 = left
                ht.y1 = top
                ht.x2 = left + cpos.width
                ht.y2 = top + cpos.height
            })
        }
    }

    _firstV(m) {
        for (let v in m) return m[v]
    }

    _firstJ(m) {
        for (let j in m) return j
    }

    _run() {
        console.log('run');
        let ok = true
        if (!this.prm.platform) this.prm.platform = 'pc'
        this.prm.platform = this.prm.platform.split(',')
        if (this.isMobile && this.prm.platform.indexOf('mobile') == -1) {
            alert('Мобильное использование отключено')
            ok = false
        }
        if (!this.isMobile && this.prm.platform.indexOf('pc') == -1) {
            alert('Использование на ПК отключено')
            ok = false
        }

        if (ok) {
            if (this.prm.fullscreen) this._toggleFullScreen()
            this.curtainIn.innerHTML = ''
            this.curtain.style.display = 'none'
            if (this.prm.cursor === false) this.plane.style.cursor = 'none'
            this.objects = []
            this.RUN = true
            this.zList = []
            setTimeout(() => this._crtObjs(), 0)
        }
    }

    _crtObjs() {
        this.context.font = '20px Tahoma'// dont work in _init (?)
        for (const j in this.object) {
            this.object[j].name = j
            this.objects.push(new MGMObject({ name: j, _mgm: this }))
        }

        for(const v of this.objects)
            if (v.awake) v.awake(v)

        this._loop()
    }

    _loop() {
        if (this.touch) {
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

        if (this.mouse) {
            let html = false

            this._htmls.forEach(ht => {
                if (this.mouse.px > ht.x1 && this.mouse.px < ht.x2 && this.mouse.py > ht.y1 && this.mouse.py < ht.y2)
                    html = true
            })

            if (html) this.mouse.down = false
        }

        if (this.prm.orderY) this.objects.sort(this._orderY)

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

        for (const v of this.zList)
            for (const e of this.objects)
                if (v == e.z) {
                    e._update()
                    if (!e._toDel) e._draw()
                }

        let i = 0
        for (let v of this.objects) {
            if (v._toDel) this.objects.splice(i, 1)
            i++
        }


        if (this._consoleTxt) {
            if (this._consoleTxt != '') {
                let s = this._consoleTxt + this._consDiv.innerHTML
                s = s.substring(0, 1000)
                this._consDiv.innerHTML = s
                this._consDiv.style.display = 'block'
            }
            else this._consDiv.style.display = 'none'
        }

        this.frame++
        if (this.RUN) requestAnimationFrame(() => this._loop())
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




    console(txt) {
        if (typeof txt == 'object') this._consoleTxt = JSON.stringify(txt)
        else this._consoleTxt = txt
    }

    pause() {
        this.RUN = false
    }

    run() {
        this.RUN = true
        this._loop()
    }

    stop(txt) {
        if (this.isMobile) this._toggleFullScreen()
        console.log('stop');
        this.RUN = false
        this.STOP = true
        if (txt || this.prm.stopText) {
            this.curtainIn.innerHTML = this.prm.stopText || txt || 'The end'
            this.curtain.style.display = 'block'
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
        return this.angleXY(obj1.x, obj1.y, obj2.x, obj2.y)
    }

    distanceXY(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
    }

    distanceObj(obj1, obj2) {
        return this.distanceXY(obj1.x, obj1.y, obj2.x, obj2.y)
    }

    clone(prm) {
        if (!this.object[prm.name]) return
        if (this.objects.length < 10000) {
            prm._mgm = this
            const obj = new MGMObject(prm)
            this.objects.push(obj)
            return obj
        }
    }

    getObj(name) {
        for (const v of this.objects)
            if (v.active !== false && v.name == name)
                return v

        return null
    }

    getObjs(name) {
        let ot = []
        for (const v of this.objects)
            if (v.active !== false) {
                if (name && v.name == name) ot.push(v)
                if (!name) ot.push(v)
            }

        if (ot.length > 0) return ot
        return null
    }

    getStep(angle, dist) {
        const rad = -angle * Math.PI / 180;
        return {
            x: dist * Math.cos(rad),
            y: dist * Math.sin(rad)
        }
    }
}













class MGMObject {
    constructor(prm) {
        // console.log(prm);
        for (const j in prm._mgm.object[prm.name]) {
            const v = prm._mgm.object[prm.name][j]
            if (j != 'pic' && j != 'pics' &&
                j != 'sound' && j != 'sounds' &&
                j != '_mgm' &&
                typeof v == 'object') {
                this[j] = JSON.parse(JSON.stringify(v))
                // this[j] = structuredClone(v)
            }
            else {
                this[j] = v
            }
        }
        for (const j in prm) this[j] = prm[j]
        // console.log(this);
        this._init()
    }

    _classInf() {
        // console.log(Object.getOwnPropertyNames(this));
        // console.log(Object.getOwnPropertyNames(this.__proto__));
    }

    _init() {
        // console.log(this);

        if (!this.x) this.x = 0
        if (!this.y) this.y = 0
        if (!this.z) this.z = 0
        if (this._mgm.zList.indexOf(this.z) == -1) {
            this._mgm.zList.push(this.z)
            this._mgm.zList.sort(function (a, b) {
                return a - b;
            })
        }
        if (this.rotation == undefined) this.rotation = 0
        if (this.angle == undefined) this.angle = 0
        if (this.size == undefined) this.size = 1
        if (this.alpha == undefined) this.alpha = 1

        if (this.pivotY === undefined) this.pivotY = 0
        if (this.pivotX === undefined) this.pivotX = 0

        if (this.pics && !this.pic) this.pic = this._mgm._firstJ(this.pics)

        if (!this.collider) this.collider = {}
        if (this.collider.width == undefined) this.collider.width = 1
        if (this.collider.height == undefined) this.collider.height = 1
        if (this.collider.x == undefined) this.collider.x = 0
        if (this.collider.y == undefined) this.collider.y = 0

        if (this.physics && this.mass) {
            if (!this.gravVel) this.gravVel = 1
            if (this.onGround === undefined) this.onGround = false
        }

        this._mgm.names[this.name] = this

        if (this.border) {
            if (typeof this.border == 'string') this.border = this.border.split(',')
            if (this.border[0]) this.border[0] = this.border[0].trim()
            if (this.border[1]) this.border[1] = this.border[1].trim()
        }

        if (this.cameraZX == undefined) this.cameraZX = 1
        if (this.cameraZY == undefined) this.cameraZY = 1
        if (this.cameraZ) {
            this.cameraZX = this.cameraZ
            this.cameraZY = this.cameraZ
        }

        if (this.flipXValue == undefined) this.flipXValue = 1
        if (this.flipYValue == undefined) this.flipYValue = 1

        if (this.width) this._prmWidth = this.width
        if (this.height) this._prmHeight = this.height

        // console.log(this);
        if (this.start) this.start(this)
        // this._classInf()
    }

    _update() {
        if (this.active === false) return
        this._waitWork()
        this._work()
        if (this.update) this.update(this)
    }

    _work() {
        if (this.anglePic) this.rotation = this.angle

        if (this.camera) {
            this._mgm.camera.x = this.x
            this._mgm.camera.y = this.y
        }

        if (this.physics && this.mass) {
            this.gravVel += 0.5
            this.y -= this.mass * this.gravVel
            this.onGround = false
        }

        this._pic = this._getPic()

        if (!this._pic) {
            if (!this._prmWidth) this._prmWidth = 1
            if (!this._prmHeight) this._prmHeight = 1
        }

        // if (!this.width) this.width = this._pic.width
        // if (!this.height) this.height = this._pic.height

        if (this._prmWidth) this.width = this._prmWidth
        else this.width = this._pic.width
        if (this._prmHeight) this.height = this._prmHeight
        else this.height = this._pic.height

        this._width = this.width * this.size
        this._height = this.height * this.size

        this.collider._pivotXL = this._width * this.collider.width / 2 - this._width * this.collider.x
        this.collider._pivotXR = this._width * this.collider.width / 2 + this._width * this.collider.x
        this.collider._pivotYB = this._height * this.collider.height / 2 + this._height * this.collider.y
        this.collider._pivotYT = this._height * this.collider.height / 2 - this._height * this.collider.y
        this.collider.left = this.x - this.collider._pivotXL
        this.collider.right = this.x + this.collider._pivotXR
        this.collider.top = this.y + this.collider._pivotYT
        this.collider.bottom = this.y - this.collider._pivotYB

        if (this.physics > 0) for (const obj of this._mgm.objects) if (obj.physics == 1) {
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
                    if (Math.abs(vx) < Math.abs(vy) || vy == 0) this.x -= vx
                    if (Math.abs(vx) > Math.abs(vy) || vx == 0) this.y -= vy
                }
            }
            if (this.x + this.collider._pivotXR - 1 > obj.collider.left + 1 &&
                this.x - this.collider._pivotXL + 1 < obj.collider.right - 1 &&
                this.y + this.collider._pivotYT > obj.collider.bottom &&
                this.y - this.collider._pivotYB - 1 < obj.collider.top
            ) {
                this.onGround = true
                this.gravVel = 1
            }
        }

        if (this.flipX)
            if (this.angle > -90 && this.angle < 90) this.flipXValue = 1
            else this.flipXValue = -1
        if (this.flipY)
            if (this.angle > 0) this.flipYValue = 1
            else this.flipYValue = -1
    }

    _draw() {
        if (this.hidden) return
        if (this.active === false) return

        // this._cameraZXm = 0
        // this._camersZYm = 0
        // if (!this.noCamera) {
        //     this._cameraZXm = - this._mgm.camera.x * this.cameraZX
        //     this._camersZYm = this._mgm.camera.y * this.cameraZY
        // }
        this._cameraZXm = - this._mgm.camera.x * this.cameraZX
        this._camersZYm = this._mgm.camera.y * this.cameraZY

        this._mgm.context.save()
        this._mgm.context.translate(
            this.x + this._mgm.canvCX + this._cameraZXm,
            -this.y + this._mgm.canvCY + this._camersZYm
        )
        this._drawPrimitives(2) // absolute
        if (this.alpha < 1) this._mgm.context.globalAlpha = this.alpha
        else this._mgm.context.globalAlpha = 1
        if (this.rotation != 0) this._mgm.context.rotate(this.rotation * Math.PI / 180)
        this._mgm.context.scale(this.flipXValue, this.flipYValue)
        if (this.effect) this._mgm.context.filter = this.effect
        if (this._pic) this._mgm.context.drawImage(this._pic,
            -this._width / 2 + this._width * this.pivotX,
            -this._height / 2 - this._height * this.pivotY,
            this._width, this._height)
        this._drawPrimitives(1) // relative
        this._mgm.context.restore()

        if (this.border) this._boardsShow()
    }

    _dot(x, y, col = '#ff0') {
        this._mgm.context.fillStyle = col
        this._mgm.context.fillRect(x - 1, y - 1, 3, 3)
    }

    _boardsShow() {
        const left = this.collider.left + this._mgm.canvCX + this._cameraZXm
        const right = this.collider.right + this._mgm.canvCX + this._cameraZXm
        const top = -this.collider.top + this._mgm.canvCY + this._camersZYm
        const bottom = -this.collider.bottom + this._mgm.canvCY + this._camersZYm

        this._dot(this.x + this._mgm.canvCX + this._cameraZXm,
            -this.y + this._mgm.canvCY + this._camersZYm)

        if (this.border[0] == 'dots') {
            this._dot(left, top, this.border[1])
            this._dot(right, top, this.border[1])
            this._dot(left, bottom, this.border[1])
            this._dot(right, bottom, this.border[1])
        }
        if (this.border[0] == 'line') {
            this._mgm.context.beginPath()
            this._mgm.context.strokeStyle = this.border[1]
            this._mgm.context.moveTo(left, top)
            this._mgm.context.lineTo(right, top)
            this._mgm.context.lineTo(right, bottom)
            this._mgm.context.lineTo(left, bottom)
            this._mgm.context.lineTo(left, top)
            this._mgm.context.stroke()
        }
    }

    _getPic() {
        if (this.pics) return this.pics[this.pic]
        else if (this.pic) return this.pic
        else return null
    }

    _drawPrimitives(pos) {
        if (this.drawText)
            if (!Array.isArray(this.drawText)) this._drawTextFn(this.drawText, pos)
            else for (const prm of this.drawText) this._drawTextFn(prm, pos)

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
    }

    _drawTextFn(prm, pos) {
        if (prm.absolute === true && pos == 1) return
        if (prm.absolute !== true && pos == 2) return
        if (prm.alpha) this._mgm.context.globalAlpha = prm.alpha
        if (prm.color) this._mgm.context.fillStyle = prm.color
        else this._mgm.context.fillStyle = this._mgm._defaultContext.fontColor
        prm.fontSize = prm.size + 'px' || this._mgm._defaultContext.fontSize
        if (!prm.family) prm.fontFamily = this._mgm._defaultContext.fontFamily
        if (!prm.weight) prm.fontWeight = this._mgm._defaultContext.fontWeight
        if (prm.align) this._mgm.context.textAlign = prm.align
        else this._mgm.context.textAlign = this._mgm._defaultContext.textAlign
        this._mgm.context.font = prm.fontWeight + ' ' + prm.fontSize + ' ' + prm.fontFamily
        if (!prm.x) prm.x = 0
        if (!prm.y) prm.y = 0
        this._mgm.context.fillText(prm.text, prm.x, -prm.y)
    }

    _drawLineFn(prm, pos) {
        if (prm.absolute === true && pos == 1) return
        if (prm.absolute !== true && pos == 2) return
        if (prm.alpha) this._mgm.context.globalAlpha = prm.alpha
        if (!prm.x1) prm.x1 = 0
        if (!prm.y1) prm.y1 = 0
        if (!prm.x2) prm.x2 = 0
        if (!prm.y2) prm.y2 = 0
        this._mgm.context.beginPath();
        if (prm.pattern) this._mgm.context.setLineDash(prm.pattern)
        this._mgm.context.lineWidth = prm.width || 1
        this._mgm.context.strokeStyle = prm.color || 'black'
        this._mgm.context.moveTo(prm.x1, -prm.y1)
        this._mgm.context.lineTo(prm.x2, -prm.y2)
        this._mgm.context.stroke()
    }

    _drawRectFn(prm, pos) {
        if (prm.absolute === true && pos == 1) return
        if (prm.absolute !== true && pos == 2) return
        if (prm.alpha) this._mgm.context.globalAlpha = prm.alpha
        if (!prm.x) prm.x = 0
        if (!prm.y) prm.y = 0
        this._mgm.context.beginPath();
        if (prm.pattern) this._mgm.context.setLineDash(prm.pattern)
        this._mgm.context.rect(prm.x, -prm.y, prm.width, -prm.height)
        if (prm.fillColor && prm.fillColor != '') {
            this._mgm.context.fillStyle = prm.fillColor
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
        if (prm.alpha) this._mgm.context.globalAlpha = prm.alpha
        if (!prm.x) prm.x = 0
        if (!prm.y) prm.y = 0
        this._mgm.context.beginPath();
        if (prm.pattern) this._mgm.context.setLineDash(prm.pattern)
        this._mgm.context.arc(prm.x, prm.y, prm.radius, 0, 2 * Math.PI);
        if (prm.fillColor && prm.fillColor != '') {
            this._mgm.context.fillStyle = prm.fillColor
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
        if (prm.alpha) this._mgm.context.globalAlpha = prm.alpha
        this._mgm.context.beginPath();
        if (prm.pattern) this._mgm.context.setLineDash(prm.pattern)
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

    wasd(speed) {
        if (this._mgm.keys.w) this.y += speed
        if (this._mgm.keys.s) this.y -= speed
        if (this._mgm.keys.d) this.x += speed
        if (this._mgm.keys.a) this.x -= speed
    }

    arrows(speed) {
        if (this._mgm.keys.up) this.y += speed
        if (this._mgm.keys.down) this.y -= speed
        if (this._mgm.keys.right) this.x += speed
        if (this._mgm.keys.left) this.x -= speed
    }

    bounce() {
        if (this.collider.right > this._mgm.canvCX || this.collider.left < -this._mgm.canvCX) this.angle = -this.angle
        if (this.collider.top > this._mgm.canvCY || this.collider.bottom < -this._mgm.canvCY) this.angle = 180 - this.angle
    }

    stepTo(obj, speed) {
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

    contact(prm) {
        let ot = null

        if (typeof prm == 'string') {
            for (const v of this._mgm.objects)
                if (v.active !== false &&
                    !v.hidden &&
                    !v.noContact &&
                    v.name == prm &&
                    this.collider.top > v.collider.bottom &&
                    this.collider.bottom < v.collider.top &&
                    this.collider.right > v.collider.left &&
                    this.collider.left < v.collider.right) {
                    ot = v
                    break
                }
        } else if (Array.isArray(prm)) {
            for (const v of prm)
                if (v.active !== false &&
                    !v.hidden &&
                    !v.noContact &&
                    this.collider.top > v.collider.bottom &&
                    this.collider.bottom < v.collider.top &&
                    this.collider.right > v.collider.left &&
                    this.collider.left < v.collider.right) {
                    ot = v
                    break
                }
        } else if (typeof prm == 'object') {
            if (prm.active !== false &&
                !prm.hidden &&
                !v.noContact &&
                this.collider.top > prm.collider.bottom &&
                this.collider.bottom < prm.collider.top &&
                this.collider.right > prm.collider.left &&
                this.collider.left < prm.collider.right)
                ot = prm
        }

        return ot
    }

    contacts() {
        let ot = []
        for (const e of this._mgm.objects) {
            // this._mgm.objects.forEach(e => { // to for of
            if (!e.active) return
            if (!e.noContact) return
            if (this.collider.top > e.collider.bottom &&
                this.collider.bottom < e.collider.top &&
                this.collider.right > e.collider.left &&
                this.collider.left < e.collider.right) ot.push(e)
        }
        return ot
    }

    contactXY(x, y) {
        if (x > this.collider.left &&
            x < this.collider.right &&
            y > this.collider.bottom &&
            y < this.collider.top) return true
        else return false
    }

    contactIn(prm) {
        let ot = null

        if (typeof prm == 'string') {
            for (const v of this._mgm.objects)
                if (v.active !== false &&
                    !v.hidden &&
                    !v.noContact &&
                    v.name == prm &&
                    this.collider.bottom > v.collider.bottom &&
                    this.collider.top < v.collider.top &&
                    this.collider.left > v.collider.left &&
                    this.collider.right < v.collider.right) {
                    ot = v
                    break
                }
        } else if (Array.isArray(prm)) {
            for (const v of prm)
                if (v.active !== false &&
                    !v.hidden &&
                    !v.noContact &&
                    this.collider.bottom > v.collider.bottom &&
                    this.collider.top < v.collider.top &&
                    this.collider.left > v.collider.left &&
                    this.collider.right < v.collider.right) {
                    ot = v
                    break
                }
        } else if (typeof prm == 'object') {
            if (prm.active !== false &&
                !prm.hidden &&
                !prm.noContact &&
                this.collider.bottom > prm.collider.bottom &&
                this.collider.top < prm.collider.top &&
                this.collider.left > prm.collider.left &&
                this.collider.right < prm.collider.right)
                ot = prm
        }

        return ot
    }

    raycast(angle, steps, all = false, density = 10) {
        const rad = -(angle - 90) * Math.PI / 180;
        let x = this.x, y = this.y

        if (!all) {
            let ot = null

            for (let i = 0; i < steps; i++) {
                x += density * Math.cos(rad)
                y += density * Math.sin(rad)

                for (const v of this._mgm.objects)
                    if (this != v &&
                        v.active !== false &&
                        !v.hidden &&
                        !v.noContact &&
                        y > v.collider.bottom &&
                        y < v.collider.top &&
                        x > v.collider.left &&
                        x < v.collider.right) {
                        ot = v
                        break
                    }
                if (ot) break
            }

            return ot
        } else {
            let ot = []

            for (let i = 0; i < steps; i++) {
                x += density * Math.cos(rad)
                y += density * Math.sin(rad)

                for (const v of this._mgm.objects)
                    if (this != v &&
                        v.active !== false &&
                        !v.hidden &&
                        !v.noContact &&
                        y > v.collider.bottom &&
                        y < v.collider.top &&
                        x > v.collider.left &&
                        x < v.collider.right) {
                        ot.push(v)
                    }
            }

            if (ot.length > 0) return ot
            else return null
        }
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

    /*
        soundPlay3(nm, obj) { 
            let source = context.createBufferSource();
            source.buffer = sounds2[nm];
            let gain = context.createGain();
            gain.connect(context.destination);
            gain.gain.value = v
            source.connect(gain);
            // source.loop = true;
            source.start(0);
        }
    */

    soundPlay(...args) {
        let vol = 1
        let name = null
        let toend = true
        args.forEach(a => {
            if (typeof a == 'number') vol = a
            if (typeof a == 'string') name = a
            if (typeof a == 'boolean') toend = a
        })

        let sound
        if (!name) {
            if (this.sound) sound = this.sound
            else if (this.sounds) sound = this._mgm._firstV(this.sounds)
        } else sound = this.sounds[name]

        if (toend) if (sound.currentTime == 0 || sound.currentTime >= sound.duration) this._soundPlay(sound, vol)
        if (!toend) this._soundPlay(sound, vol)
    }

    soundLoop(...args) {
        let vol = 1
        let name = null
        args.forEach(a => {
            if (typeof a == 'number') vol = a
            if (typeof a == 'string') name = a
        })

        let sound
        if (!name) {
            if (this.sound) sound = this.sound
            else if (this.sounds) sound = this._mgm._firstV(this.sounds)
        } else sound = this.sounds[name]

        if (!sound.mloop) {
            this._soundPlay(sound, vol)
            sound.mloop = setInterval(() => this._soundPlay(sound, vol), sound.duration * 1000)
        }
    }

    _soundPlay(sound, vol) {
        sound.pause();
        sound.volume = vol;
        sound.currentTime = 0;
        sound.play()
    }

    soundStop(name) {
        let sound
        if (!name) {
            if (this.sound) sound = this.sound
            else if (this.sounds) sound = this._mgm._firstV(this.sounds)
        } else sound = this.sounds[name]

        if (this.sound.mloop) {
            clearInterval(this.sound.mloop)
            this.sound.mloop = null
        }

        sound.pause()
        sound.currentTime = 0
    }

    clone(prm) {
        if (this.active === false) {
            if (!prm) prm = {}
            prm.name = this.name
            prm.active = true
            return this._mgm.clone(prm)
        }
    }

    wait(frames, func, loop = false) {
        if (frames == null) this._waitSch = undefined
        else if (!this._waitSch) {
            this._waitSch = 0
            this._waitFrames = frames
            this._waitFunc = func
            this._waitLoop = loop
        }
    }

    _waitWork() {
        if (this._waitSch !== undefined) {
            if (this._waitSch == this._waitFrames) {
                this._waitFunc()
                if (this._waitLoop) this._waitSch = 0
                else this._waitSch = undefined
            } else this._waitSch++
        }
    }
}



