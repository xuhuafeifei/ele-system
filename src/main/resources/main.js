import * as THREE from 'three';

// 初始化场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 5, 15);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 添加楼层（3层）
const floorHeight = 1;
const floorGap = 0.2;

for (let i = 0; i < 3; i++) {
    const geometry = new THREE.BoxGeometry(4, floorHeight, 4);
    const material = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
    const floor = new THREE.Mesh(geometry, material);
    floor.position.y = i * (floorHeight + floorGap);
    scene.add(floor);
}

// 创建电梯模型
const elevatorGeometry = new THREE.BoxGeometry(1, 1, 1);
const elevatorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const elevator = new THREE.Mesh(elevatorGeometry, elevatorMaterial);
elevator.position.x = 0;
scene.add(elevator);

// 实时渲染循环
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// WebSocket 连接
const socket = new WebSocket('ws://localhost:8080/elevator');

socket.addEventListener('open', () => {
    console.log('已连接到电梯服务');
});

socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'elevator-update') {
        const floor = data.floor;
        elevator.position.y = floor * (floorHeight + floorGap); // 映射楼层到Y轴
    }
});

// 窗口大小变化时调整
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});