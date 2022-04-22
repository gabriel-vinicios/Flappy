class Game {
    constructor(fps, usarRede, render, networkData) {
        this.reset();
        this.bird = null;
        this.pipes = [];
        this.updateInterval = null;
        this.showInterval = null;
        this.frameCount = 0;
        this.points = 0;
        this.rede = Rede.criar();
        if (networkData) this.rede = Rede.import(networkData);
        this.render = render;
        this.usarRede = usarRede;
        this.fps = fps;
        this.isOver = false;
        if(this.render && this.usarRede){
            this.sensors = new Sensors(this);
        }
    }

    reset() {
        let birds = document.getElementsByClassName('bird');
        for (let i = 0; i < birds.length; i++) birds[0].remove();
        document.getElementById('pipes').innerHTML = '';
        document.getElementById('score').innerHTML = '';
    }


    load(onStop) {
        this.onStop = onStop;
        var divBird = document.createElement('div');
        if (this.render) document.body.appendChild(divBird);
        divBird.className = 'bird';
        this.bird = new Bird(divBird, this);

        if (this.render) {
            this.updateInterval = setInterval(() => this.update(), 1000 / this.fps);
            this.showInterval = setInterval(() => this.show(), 1000 / this.fps);
        } else {
            while (!this.isOver) {
                this.update();
            }
        }
    }

    upOnce = false;
    downOnce = false;

    update() {
        this.frameCount++;

        if (this.usarRede) {
            let frameInfo = this.getFrameInfo();
            let acoes = this.rede.checar(frameInfo);
            this.bird.upKeyIsPressed = acoes.indexOf(Acao.cima);
            this.bird.downKeyIsPressed = acoes.indexOf(Acao.baixo);
            if(this.render){
                this.sensors.update(this.frameInfoPipeReference);
            }
        }

        this.upOnce = (this.bird.upKeyIsPressed && !this.bird.downKeyIsPressed) || this.upOnce;
        this.downOnce = (this.bird.downKeyIsPressed && !this.bird.upKeyIsPressed) || this.downOnce;

        this.bird.update();

        if (this.points > 10000) {
            this.stop();
        }

        if (this.frameCount % 180 == 0) {
            this.pipes.push(new Pipe(this));
        }

        for (var i = this.pipes.length - 1; i >= 0; i--) {
            this.pipes[i].update();
        }
    }

    show() {
        this.bird.show();
        for (var i = this.pipes.length - 1; i >= 0; i--) {
            this.pipes[i].show();
        }
        document.getElementById('score').innerHTML = this.points;
        this.sensors.show();
    }

    addPoint() {
        this.points++;
    }

    stop(newOnStop) {
        clearInterval(this.updateInterval);
        clearInterval(this.showInterval);
        this.isOver = true;
        let frameInfo = this.getFrameInfo();
        let multi = 1; //0.3 + (this.upOnce ? 0.1 : 0) + (this.downOnce ? 0.1 : 0);
        this.points += ((innerHeight - frameInfo.distanciaFrontTop) / innerHeight) * multi;
        if (this.render) {
            this.show();
            setTimeout(() => {
                this.stopEvent(newOnStop);
            }, 300);
        } else {
            setTimeout(() => {
                this.stopEvent(newOnStop);
            }, 0);
        }
    }

    stopEvent(newOnStop) {
        if (newOnStop) {
            newOnStop();
        } else if (this.onStop) {
            this.onStop();
        }
    }

    frameInfoPipeReference = null;
    getFrameInfo() {
        let nextPipes = this.pipes.filter(x => x.x + x.w > this.bird.x);
        if (nextPipes.length == 0) return new FrameInfo(0, 0, 0, 0);
        let pipe = nextPipes[0];
        this.frameInfoPipeReference = pipe;

        let s = (v) => v * v;

        let distanciaFrontX = pipe.x - this.bird.x;
        let distanciaBackX = distanciaFrontX + pipe.w;
        let distanciaTopY = pipe.top - this.bird.y;
        let distanciaBottomY = pipe.bottom - this.bird.y;

        let distanciaFrontTop = Math.sqrt(s(distanciaFrontX) + s(distanciaTopY));
        let distanciaFrontBot = Math.sqrt(s(distanciaFrontX) + s(distanciaBottomY));
        let distanciaBackTop = Math.sqrt(s(distanciaBackX) + s(distanciaTopY));
        let distanciaBackBot = Math.sqrt(s(distanciaBackX) + s(distanciaBottomY));

        return new FrameInfo(distanciaFrontTop, distanciaFrontBot, distanciaBackTop, distanciaBackBot);
    }
}
