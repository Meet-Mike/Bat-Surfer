import Game from '.';
import {GAME_STATUS, Obstacal, playerStatus} from './const';
import Environment, {roadLength, roadWidth} from './environment';
import * as THREE from 'three';
import {EventEmitter} from 'events';
import Player from './player';
// @ts-ignore
import showToast from '../components/Toast/index.js';
import { soundManager } from './audio';

enum Side {
    FRONT,
    BACK,
    LEFT,
    RIGHT,
    DOWN,
    FRONTDOWN,
    UP
}

export class ControlPlayer extends EventEmitter {
    model: THREE.Group;
    mixer: THREE.AnimationMixer;
    status!: string;
    renderer!: THREE.WebGLRenderer;
    score: number = 0;
    coin: number = 0;
    allAnimate: Record<string, THREE.AnimationAction>;
    runVelocity: number;
    jumpHight: number;
    targetPosition!: number;
    way!: number;
    lastPosition!: number;
    isJumping: boolean = false;
    capsule!: THREE.Mesh<THREE.CapsuleGeometry, THREE.MeshNormalMaterial>;
    game: Game;
    player: Player;
    scene: THREE.Scene = new THREE.Scene();
    smallMistake!: number;
    far: number;
    key!: string;
    originLocation!: THREE.Vector3;
    removeHandle: boolean = true;
    lastAnimation!: string;
    roll!: boolean;
    runlookback!: boolean;
    playerRunDistance!: number;
    environement: Environment = new Environment();
    currentPlane: number = -1;
    isAddPlane: boolean = false;
    fallingSpeed: number = 0;
    downCollide: boolean = false;

    gameStatus: GAME_STATUS = GAME_STATUS.READY;
    gameStart: boolean = false;
    raycasterDown: THREE.Raycaster;
    raycasterFrontDown: THREE.Raycaster;
    raycasterFront: THREE.Raycaster;
    raycasterRight: THREE.Raycaster;
    raycasterLeft: THREE.Raycaster;
    frontCollide: boolean;
    firstFrontCollide: Record<string, any> = {isCollide: true, collideInfo: null};
    frontCollideInfo: any;
    leftCollide: boolean;
    rightCollide: boolean;
    upCollide: boolean;

    constructor(
        model: THREE.Group,
        mixer: THREE.AnimationMixer,
        currentAction: string = 'run',
        allAnimate: Record<string, THREE.AnimationAction>
    ) {
        super();
        this.model = model;
        this.mixer = mixer;
        this.game = new Game();
        this.player = new Player();
        this.scene = this.game.scene;
        this.allAnimate = allAnimate;

        // Tuned run & jump parameters for high-fidelity Subway Surfers arcade feel
        this.runVelocity = 22;
        this.jumpHight = 9.5; // High jump impulse so character leaps cleanly over hurdles
        this.gameStart = false;
        this.far = 2.5;

        this.raycasterDown = new THREE.Raycaster();
        this.raycasterFrontDown = new THREE.Raycaster();
        this.raycasterFront = new THREE.Raycaster();
        this.raycasterRight = new THREE.Raycaster();
        this.raycasterLeft = new THREE.Raycaster();
        this.frontCollide = false;
        this.leftCollide = false;
        this.rightCollide = false;
        this.downCollide = true;
        this.upCollide = false;
        this.isJumping = false;
        this.startGame(currentAction, model);
        this.addAnimationListener();
        this.initRaycaster();
    }

    startGame(currentAction: string, model: THREE.Group) {
        this.status = currentAction;
        this.allAnimate[currentAction].play();
        this.lastAnimation = currentAction;
        this.way = 2;
        this.roll = false;
        this.runlookback = false;
        this.playerRunDistance = model.position.z;
        this.smallMistake = 0;
        this.key = '';
        this.originLocation = model.position;
        this.lastPosition = model.position.x;
        this.targetPosition = 0;
    }

    initRaycaster() {
        const initialDirection = new THREE.Vector3(0, -1, 0);
        const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 6);
        const direction = initialDirection.clone().applyQuaternion(rotation).normalize();

        this.raycasterFrontDown.ray.direction = new THREE.Vector3(0, 1, 0);
        this.raycasterDown.ray.direction = new THREE.Vector3(0, -1, 0);
        this.raycasterFrontDown.ray.direction = direction;
        this.raycasterLeft.ray.direction = new THREE.Vector3(-1, 0, 0);
        this.raycasterRight.ray.direction = new THREE.Vector3(1, 0, 0);

        this.raycasterDown.far = 5.8;
        this.raycasterFrontDown.far = 3;
    }

    private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
    private touchStartHandler: ((e: TouchEvent) => void) | null = null;
    private touchEndHandler: ((e: TouchEvent) => void) | null = null;
    private touchStartX: number = 0;
    private touchStartY: number = 0;

    start() {
        if (!this.gameStart) {
            this.gameStart = true;
            this.gameStatus = GAME_STATUS.START;
            this.game.emit('gameStatus', this.gameStatus);
        }
    }

    restart() {
        this.gameStatus = GAME_STATUS.READY;
        this.game.emit('gameStatus', this.gameStatus);
        this.smallMistake = 0;
        this.score = 0;
        this.coin = 0;
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        this.environement.startGame();
        this.player.createPlayer(false);
    }

    jump() {
        if (!this.gameStart || this.status === playerStatus.DIE) return;
        if (this.status !== playerStatus.JUMP && this.status !== playerStatus.FALL && this.downCollide) {
            this.key = 'w';
            this.downCollide = false;
            this.isJumping = true;
            soundManager.playJump();
            setTimeout(() => {
                this.isJumping = false;
            }, 100);
            this.fallingSpeed = 0.55; // Strong immediate launch velocity
        }
    }

    slide() {
        if (!this.gameStart || this.status === playerStatus.DIE) return;
        if (!this.roll && this.status !== playerStatus.ROLL) {
            this.roll = true;
            soundManager.playSlide();
            setTimeout(() => {
                this.roll = false;
            }, 620);
            this.key = 's';
            this.fallingSpeed = -0.6;
        }
    }

    moveLeft() {
        if (!this.gameStart || this.status === playerStatus.DIE) return;
        if (this.way === 1) {
            this.runlookback = true;
            this.emit('collision');
            soundManager.playCrash();
            showToast('Wall obstacle hit!');
            setTimeout(() => {
                this.runlookback = false;
            }, 1040);
            this.smallMistake += 1;
            return;
        }
        this.way -= 1;
        this.originLocation = this.model.position.clone();
        this.lastPosition = this.model.position.clone().x;
        this.targetPosition -= roadWidth / 3;
    }

    moveRight() {
        if (!this.gameStart || this.status === playerStatus.DIE) return;
        if (this.way === 3) {
            this.runlookback = true;
            this.emit('collision');
            soundManager.playCrash();
            showToast('Wall obstacle hit!');
            setTimeout(() => {
                this.runlookback = false;
            }, 1040);
            this.smallMistake += 1;
            return;
        }
        this.originLocation = this.model.position.clone();
        this.lastPosition = this.model.position.clone().x;
        this.targetPosition += roadWidth / 3;
        this.way += 1;
    }

    addAnimationListener() {
        this.keydownHandler = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const code = e.code;

            if (key === 'p' || key === 'enter' || code === 'Space') {
                if (!this.gameStart) {
                    this.start();
                    e.preventDefault();
                    return;
                } else if (this.gameStatus === GAME_STATUS.END && key === 'enter') {
                    this.restart();
                    e.preventDefault();
                    return;
                }
            }

            if (key === 'r') {
                this.restart();
                e.preventDefault();
                return;
            }

            if (key === 'w' || key === 'arrowup' || code === 'Space') {
                if (this.gameStart && this.gameStatus !== GAME_STATUS.END) {
                    this.jump();
                    e.preventDefault();
                }
            } else if (key === 's' || key === 'arrowdown') {
                if (this.gameStart && this.gameStatus !== GAME_STATUS.END) {
                    this.slide();
                    e.preventDefault();
                }
            } else if (key === 'a' || key === 'arrowleft') {
                if (this.gameStart && this.gameStatus !== GAME_STATUS.END) {
                    this.moveLeft();
                    e.preventDefault();
                }
            } else if (key === 'd' || key === 'arrowright') {
                if (this.gameStart && this.gameStatus !== GAME_STATUS.END) {
                    this.moveRight();
                    e.preventDefault();
                }
            }
        };

        this.touchStartHandler = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            }
        };

        this.touchEndHandler = (e: TouchEvent) => {
            if (!this.touchStartX || !this.touchStartY || e.changedTouches.length === 0) return;
            const diffX = e.changedTouches[0].clientX - this.touchStartX;
            const diffY = e.changedTouches[0].clientY - this.touchStartY;
            const threshold = 25;

            if (!this.gameStart) {
                this.start();
                return;
            }

            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > threshold) {
                    this.moveRight();
                } else if (diffX < -threshold) {
                    this.moveLeft();
                }
            } else {
                if (diffY < -threshold) {
                    this.jump();
                } else if (diffY > threshold) {
                    this.slide();
                }
            }
            this.touchStartX = 0;
            this.touchStartY = 0;
        };

        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('touchstart', this.touchStartHandler);
        window.addEventListener('touchend', this.touchEndHandler);
    }

    dispose() {
        if (this.keydownHandler) {
            window.removeEventListener('keydown', this.keydownHandler);
            this.keydownHandler = null;
        }
        if (this.touchStartHandler) {
            window.removeEventListener('touchstart', this.touchStartHandler);
            this.touchStartHandler = null;
        }
        if (this.touchEndHandler) {
            window.removeEventListener('touchend', this.touchEndHandler);
            this.touchEndHandler = null;
        }
    }

    handleLeftRightMove() {
        const targetPosition = this.targetPosition;
        const lastPosition = this.lastPosition;
        if (Math.abs(targetPosition - lastPosition) < 1) {
            this.removeHandle = true;
        }
        if (targetPosition !== lastPosition) {
            if ((this.leftCollide || this.rightCollide) && this.removeHandle) {
                this.smallMistake += 1;
                this.emit('collision');
                soundManager.playCrash();
                showToast('Hit obstacle! Watch out!');
                this.targetPosition = this.originLocation.x;
                this.removeHandle = false;
                if (targetPosition > lastPosition) {
                    this.way -= 1;
                } else {
                    this.way += 1;
                }
            }
            const moveSpeed = 0.22;
            const diff = targetPosition - lastPosition;
            if (Math.abs(diff) > 0.0001) {
                this.model.position.x += diff * moveSpeed;
                this.lastPosition += diff * moveSpeed;
            }
        }
    }

    collideCheckAll() {
        const position = this.model.position.clone();
        try {
            this.collideCheck(Side.DOWN, position, 5);
            this.collideCheck(Side.FRONTDOWN, position, 3);
            this.collideCheck(Side.FRONT, position, 2);
            this.collideCheck(Side.LEFT, position, 1);
            this.collideCheck(Side.RIGHT, position, 1);
        } catch (error) {
            console.log(error);
        }
    }

    collideCheck(
        side: Side,
        position: THREE.Vector3,
        far: number = 2.5
    ) {
        const {x, y, z} = position;
        switch (side) {
            case Side.DOWN:
                this.raycasterDown.ray.origin = new THREE.Vector3(x, y + 4, z + 0.5);
                this.raycasterDown.far = far;
                break;
            case Side.FRONTDOWN:
                this.raycasterFrontDown.ray.origin = new THREE.Vector3(x, y + 2, z);
                this.raycasterFrontDown.far = far;
                break;
            case Side.FRONT:
                // Move front raycaster origin up dynamically with character height
                this.raycasterFront.ray.origin = new THREE.Vector3(x, y + 1.2, z - 1);
                this.raycasterFront.far = far;
                break;
            case Side.LEFT:
                this.raycasterLeft.ray.origin = new THREE.Vector3(x + 0.5, y + 2, z);
                this.raycasterLeft.far = far;
                break;
            case Side.RIGHT:
                this.raycasterRight.ray.origin = new THREE.Vector3(x - 0.5, y + 2, z);
                this.raycasterRight.far = far;
                break;
        }

        const ds = this.playerRunDistance;
        const nowPlane = Math.floor(ds / roadLength);
        const intersectPlane = this.environement.plane?.[nowPlane];
        const intersectObstacal = this.environement.obstacal?.[nowPlane];
        const intersectCoin = this.environement.coin?.[nowPlane];
        if (!intersectObstacal && !intersectPlane) {
            return;
        }

        const origin = new THREE.Vector3(x, position.y + 1.5, z);
        const originDown = new THREE.Vector3(x, position.y + 4.6, z - 0.5);

        switch (side) {
            case Side.DOWN: {
                if (!intersectPlane) return;
                const c1 = this.raycasterDown.intersectObjects([intersectPlane, intersectObstacal])[0]?.object.name;
                this.raycasterDown.ray.origin = originDown;
                const c2 = this.raycasterDown.intersectObjects([intersectPlane, intersectObstacal])[0]?.object.name;

                if (position.y <= 0.1) {
                    this.downCollide = true;
                } else {
                    c1 || c2 ? (this.downCollide = true) : (this.downCollide = false);
                }
                break;
            }
            case Side.FRONT: {
                const r1 = this.raycasterFront.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r1Name = r1?.object.name;
                if (r1Name === 'coin' && r1.object.visible) {
                    r1.object.visible = false;
                    this.coin += 1;
                    soundManager.playCoin();
                }
                const c1 = r1Name && r1Name !== 'coin';
                this.raycasterFront.far = 1.5;
                const r2 = this.raycasterFront.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r2Name = r2?.object.name;
                if (r2Name === 'coin' && r2.object.visible) {
                    r2.object.visible = false;
                    this.coin += 1;
                    soundManager.playCoin();
                }
                const c2 = r2Name && r2Name !== 'coin';
                this.frontCollideInfo = (r1Name && r1Name !== 'coin' ? r1 : null) || (r2Name && r2Name !== 'coin' ? r2 : null);

                // When jumping, if character elevation is above low hurdle height (1.2m), bypass collision
                if (position.y > 1.2) {
                    this.frontCollide = false;
                } else {
                    c1 || c2 ? (this.frontCollide = true) : (this.frontCollide = false);
                }
                break;
            }
            case Side.FRONTDOWN: {
                const r1 = this.raycasterFrontDown.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r1Name = r1?.object.name;
                if (r1Name === 'coin') {
                    r1.object.visible = false;
                    this.coin += 1;
                }
                const c1 = r1Name && r1Name !== 'coin';
                if (position.y > 1.2) {
                    this.frontCollide = false;
                } else {
                    c1 ? (this.frontCollide = true) : (this.frontCollide = false);
                }
                break;
            }
            case Side.LEFT: {
                const r1 = this.raycasterLeft.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r1Name = r1?.object.name;
                if (r1Name === 'coin' && r1.object.visible) {
                    r1.object.visible = false;
                    this.coin += 1;
                }
                const c1 = r1Name && r1Name !== 'coin';
                this.raycasterLeft.ray.origin = origin;
                const r2 = this.raycasterLeft.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r2Name = r2?.object.name;
                if (r2Name === 'coin' && r2.object.visible) {
                    r2.object.visible = false;
                    this.coin += 1;
                }
                const c2 = r2Name && r2Name !== 'coin';
                c1 || c2 ? (this.leftCollide = true) : (this.leftCollide = false);
                break;
            }
            case Side.RIGHT: {
                const r1 = this.raycasterRight.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r1Name = r1?.object.name;
                if (r1Name === 'coin' && r1.object.visible) {
                    r1.object.visible = false;
                    this.coin += 1;
                }
                const c1 = r1Name && r1Name !== 'coin';
                this.raycasterRight.ray.origin = origin;
                const r2 = this.raycasterRight.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r2Name = r2?.object.name;
                if (r2Name === 'coin' && r2.object.visible) {
                    r2.object.visible = false;
                    this.coin += 1;
                }
                const c2 = r2Name && r2Name !== 'coin';
                c1 || c2 ? (this.rightCollide = true) : (this.rightCollide = false);
                break;
            }
        }
    }

    changeStatus(delta: number) {
        if (!this.gameStart) return;

        const moveZ = this.runVelocity * delta;
        if (!this.frontCollide) {
            if (this.status !== playerStatus.DIE) {
                this.playerRunDistance += moveZ;
                this.model.position.z -= moveZ;
            }
        }

        if (this.status === playerStatus.DIE) {
            this.status = playerStatus.DIE;
        } else if (this.fallingSpeed > 0) {
            this.status = playerStatus.JUMP;
        } else if (this.fallingSpeed < 0 && this.key !== 's') {
            this.status = playerStatus.FALL;
        } else if (this.roll) {
            this.status = playerStatus.ROLL;
        } else if (this.key === 'p') {
            this.status = playerStatus.RUN;
        } else if (!this.roll && this.fallingSpeed === 0 && !this.runlookback) {
            this.status = playerStatus.RUN;
        } else if (this.runlookback) {
            this.status = playerStatus.RUNLOOKBACK;
        }

        if (this.status === this.lastAnimation) return;

        this.lastAnimation && this.allAnimate[this.lastAnimation].fadeOut(0.1);
        this.allAnimate[this.status].reset().fadeIn(0.1).play();
        this.lastAnimation = this.status;
    }

    checkPlayerDistance() {
        const ds = this.playerRunDistance;
        const nowPlane = Math.floor(ds / roadLength) + 1;
        const runToLength = (ds - roadLength * (nowPlane - 1)) / roadLength;

        if (runToLength > 0.45 && this.currentPlane !== nowPlane) {
            this.currentPlane = nowPlane;
            this.environement.z -= roadLength;
            const newZ = this.environement.z;
            this.environement.setGroupScene(newZ, -5 - nowPlane * roadLength, false);
        }
    }

    frontCollideCheckStatus() {
        if (this.frontCollide && this.firstFrontCollide.isCollide) {
            const {object} = this.frontCollideInfo;
            const {y} = this.frontCollideInfo.point;
            const point = Number(y - 2);
            const obstacal = Number(Obstacal[object.name]?.y);
            const locateObstacal = point / obstacal;

            this.firstFrontCollide = {isCollide: false, name: object.name};

            if (locateObstacal < 0.75) {
                this.status = playerStatus.DIE;
                this.gameStatus = GAME_STATUS.END;
                soundManager.playGameOver();
                showToast('Game Over! Press R or Enter to restart!');
                this.game.emit('gameStatus', this.gameStatus);
            } else {
                this.fallingSpeed += 0.4;
                this.model.position.y += obstacal * (1 - locateObstacal);
                this.smallMistake += 1;
                this.emit('collision');
                soundManager.playCrash();
                showToast('Hit obstacle! Watch out!');
                this.firstFrontCollide.isCollide = false;
                setTimeout(() => {
                    this.firstFrontCollide.isCollide = true;
                }, 400);
            }
        }
    }

    coinRotate() {
        const ds = this.playerRunDistance;
        const nowPlane = Math.floor(ds / roadLength);
        const nowPlane1 = nowPlane + 1;
        const intersectCoin = this.environement.coin?.[nowPlane];
        const intersectCoin1 = this.environement.coin?.[nowPlane1];

        intersectCoin && intersectCoin.traverse(mesh => {
            if (mesh.name === 'coin') {
                mesh.rotation.z += Math.random() * 0.1;
            }
        });
        intersectCoin1 && intersectCoin1.traverse(mesh => {
            if (mesh.name === 'coin') {
                mesh.rotation.z += Math.random() * 0.1;
            }
        });
    }

    checkGameStatus() {
        const mistake = this.smallMistake;
        if (mistake >= 2 && this.gameStatus !== GAME_STATUS.END) {
            this.status = playerStatus.DIE;
            this.gameStatus = GAME_STATUS.END;
            soundManager.playGameOver();
            this.game.emit('gameStatus', this.gameStatus);
        }
    }

    update(delta: number) {
        this.changeStatus(delta);
        this.handleLeftRightMove();
        this.checkPlayerDistance();
        this.collideCheckAll();
        this.frontCollideCheckStatus();
        this.coinRotate();
        this.checkGameStatus();

        if (this.gameStatus === GAME_STATUS.START) {
            this.game.emit('gameData', {score: this.score += 20, coin: this.coin, mistake: this.smallMistake});
        }

        // Tuned gravity & jump loop
        if (this.isJumping || !this.downCollide || this.model.position.y > 0) {
            const gravity = 1.4;
            this.fallingSpeed -= gravity * delta;
            this.model.position.y += this.fallingSpeed;

            if (this.model.position.y <= 0) {
                this.model.position.y = 0;
                this.fallingSpeed = 0;
                this.downCollide = true;
            }
        } else {
            this.fallingSpeed = 0;
            this.model.position.y = 0;
        }
    }
}
