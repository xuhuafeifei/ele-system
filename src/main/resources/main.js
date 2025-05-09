import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Constants  from './Constants';

let runningPath = "";
const p = document.createElement('p');

// 1. 创建 WebSocket 连接
const socket = new WebSocket('ws://localhost:8080/elevator');

// 等待连接后发送启动通知
socket.onopen = () => {
    console.log('WebSocket 连接已建立');
    // 连接建立后再发送启动通知
    callElevator(Constants.START, {});
};

// 2. 监听电梯位置更新
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.event === Constants.ELEVATOR_MOVING_TO_NEXT) {
        let floor = data.message;
        console.log('elevator moving to floor ', floor);
        moveElevatorToFloor(floor);
    } else if (data.event === Constants.FLOOR_REQUEST_GENERATE) {
        let { floor, destFloor } = data.message;
        console.log(`楼层 ${floor} 请求到达目标楼层 ${destFloor}`)
        generateFloorRequest(floor, destFloor);
    } else if (data.event === Constants.PRINT_BALL) {
        console.log('打印小球: ' + data.message);
        runningPath = data.message;
        p.textContent = 'RunningPath: ' + runningPath;
    }
};

// 3. 发送楼层呼叫请求
function callElevator(e, data) {
    socket.send(JSON.stringify({
        event: e,
        message: data
    }));
}

// 4. 错误处理
socket.onerror = (error) => {
    console.error('WebSocket 错误:', error);
};

// 初始化场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// 初始化相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 10, 15);
camera.lookAt(0, 0, 0);

// 初始化渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 添加轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 添加光源
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// 建筑物参数
const floorCount = 3;
const floorHeight = 3;
const buildingWidth = 8;
const buildingDepth = 6;

// 创建建筑物
function createBuilding() {
    const building = new THREE.Group();

    // 创建楼层
    for (let i = 0; i < floorCount; i++) {
        // 楼层地板
        const floorGeometry = new THREE.BoxGeometry(buildingWidth, 0.2, buildingDepth);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = i * floorHeight;
        building.add(floor);

        // 楼层标识
        const floorText = createFloorText(i + 1);
        floorText.position.set(-buildingWidth/2 + 0.5, i * floorHeight + 0.1, -buildingDepth/2 + 0.5);
        building.add(floorText);
    }

    // 创建电梯井
    const shaftGeometry = new THREE.BoxGeometry(2, floorCount * floorHeight, 2);
    const shaftMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        transparent: true,
        opacity: 0.7
    });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = (floorCount * floorHeight) / 2 - floorHeight / 2;
    building.add(shaft);

    return building;
}

// 创建楼层文字
function createFloorText(floorNumber) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.fillStyle = '#000000';
    context.font = 'Bold 40px Arial';
    context.fillText(`${floorNumber}F`, 10, 45);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true
    });
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 0.5),
        material
    );
    mesh.rotation.x = -Math.PI / 2;

    return mesh;
}

// 创建电梯
function createElevator() {
    const elevator = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 2.5, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x3498db })
    );

    // 电梯状态
    elevator.userData = {
        currentFloor: 1, // 1-3层
        targetFloor: 1,
        isMoving: false
    };

    return elevator;
}

// 创建建筑物和电梯
const building = createBuilding();
scene.add(building);

const elevator = createElevator();
scene.add(elevator);

// 初始位置
updateElevatorPosition();

// 更新电梯位置
function updateElevatorPosition() {
    elevator.position.y = (elevator.userData.currentFloor - 1) * floorHeight;
}

// 电梯移动动画
function moveElevatorToFloor(targetFloor) {
    if (elevator.userData.isMoving) return;

    const currentFloor = elevator.userData.currentFloor;
    // if (currentFloor === targetFloor) return;

    elevator.userData.targetFloor = targetFloor;
    elevator.userData.isMoving = true;

    console.log(`电梯从 ${currentFloor}层 移动到 ${targetFloor}层`);
}

function generateFloorRequest(floor, destFloor) {
    // 1. 创建红色小球
    const sphereGeometry = new THREE.SphereGeometry(0.8, 32, 32); // 增大小球尺寸
    const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.8
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // 设置小球位置（基于楼层高度）
    const floorHeight = 3;
    sphere.position.set(
        2, // X轴位置
        (floor - 1) * floorHeight + 0.8, // Y轴位置（提高一点）
        0   // Z轴居中
    );

    // 2. 创建更大的目标楼层文字（显示在右侧）
    const createTextSprite = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256; // 增大画布尺寸
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // 文字样式
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = 'Bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 计算文字宽度
        const text = `${destFloor}F`;
        const textWidth = ctx.measureText(text).width;

        // 绘制背景圆角矩形
        const padding = 20;
        ctx.beginPath();
        ctx.roundRect(
            128 - textWidth/2 - padding,
            64 - 36,
            textWidth + padding*2,
            72,
            10
        );
        ctx.fill();

        // 绘制文字
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, 128, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 1, 1); // 调整文字精灵大小

        // 将文字定位在小球右侧
        sprite.position.copy(sphere.position);
        sprite.position.x += 1.5; // 向右偏移

        return sprite;
    };

    const textSprite = createTextSprite();

    // 3. 添加到场景
    scene.add(sphere);
    scene.add(textSprite);

    // 4. 动画效果（1秒后消失）
    let startTime = Date.now();

    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / 1000, 1);

        // 消失动画：向右移动并淡出
        if (progress > 0.5) {
            const fadeProgress = (progress - 0.5) * 2;
            sphere.position.x += 0.05;
            textSprite.position.x += 0.05;
            sphereMaterial.opacity = 0.8 * (1 - fadeProgress);
            textSprite.material.opacity = 1 - fadeProgress;
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            scene.remove(sphere);
            scene.remove(textSprite);
            // 释放内存...
        }
    };

    // 初始弹跳动画
    sphere.scale.set(0.1, 0.1, 0.1);
    textSprite.scale.set(0.1, 0.05, 0.1);

    const grow = () => {
        sphere.scale.x += (1 - sphere.scale.x) * 0.2;
        sphere.scale.y = sphere.scale.x;
        sphere.scale.z = sphere.scale.x;

        textSprite.scale.x = sphere.scale.x * 2;
        textSprite.scale.y = sphere.scale.x;

        if (sphere.scale.x < 0.95) {
            requestAnimationFrame(grow);
        } else {
            startTime = Date.now();
            requestAnimationFrame(animate);
        }
    };

    grow();
}

// 创建控制界面
function createUI() {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '20px';
    container.style.left = '20px';
    container.style.backgroundColor = 'rgba(255,255,255,0.7)';
    container.style.padding = '10px';
    container.style.borderRadius = '5px';

    // document创建一个段落文字, 用于显示RunningPath
    p.textContent = 'RunningPath: ' + runningPath;
    p.style.margin = '0';
    container.appendChild(p);

    document.body.appendChild(container);

    // for (let i = 1; i <= floorCount; i++) {
    //     const button = document.createElement('button');
    //     button.textContent = `呼叫电梯到 ${i}层`;
    //     button.style.display = 'block';
    //     button.style.margin = '5px';
    //     button.onclick = () => moveElevatorToFloor(i);
    //     container.appendChild(button);
    // }
    //
    // document.body.appendChild(container);
}

// 创建UI
createUI();

// 动画循环
function animate() {
    requestAnimationFrame(animate);

    // 电梯移动逻辑
    if (elevator.userData.isMoving) {
        const targetY = (elevator.userData.targetFloor - 1) * floorHeight;
        const direction = Math.sign(targetY - elevator.position.y);
        const speed = 0.05;

        elevator.position.y += speed * direction;

        // 检查是否到达目标楼层
        if (Math.abs(elevator.position.y - targetY) < 0.01) {
            elevator.position.y = targetY;
            elevator.userData.currentFloor = elevator.userData.targetFloor;
            elevator.userData.isMoving = false;
            console.log(`电梯已到达 ${elevator.userData.currentFloor}层`);
            // todo: 通知后端
            callElevator(Constants.ELEVATOR_RENDER_DONE, null);
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

// 处理窗口大小变化
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 启动动画
animate();