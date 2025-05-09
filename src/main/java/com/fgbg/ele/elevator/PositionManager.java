package com.fgbg.ele.elevator;

import java.util.Objects;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

import com.fgbg.ele.controller.MyWebSocketHandler;
import com.fgbg.ele.entity.Response;
import com.fgbg.ele.utils.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class PositionManager {


    static class RedBlueBall {
        String color;
        Integer position;
        RedBlueBall next;

        public RedBlueBall(Integer position, String color) {
            this.position = position;
            this.color = color;
            this.next = null;
        }
    }

    private final Lock lock = new ReentrantLock();
    // 虚拟头节点
    private final RedBlueBall dummyHead;
    private RunningSystem rs;

    public PositionManager() {
        this.dummyHead = new RedBlueBall(null, null);
    }

    public void setRunningSystem(RunningSystem runningSystem) {
        this.rs = runningSystem;
    }

    public void inserts(FloorRequest... requests) {
        lock.lock();
        try {
            for (var request : requests) {
                insert(request);
            }
        } finally {
            lock.unlock();
        }
    }
    /**
     * 插入请求
     * 插入算法 + 颜色判别
     * @param request 楼层请求对象
     */
    public void insert(FloorRequest request) {
        lock.lock();
        try {
            RedBlueBall current = dummyHead;

            int floorId = request.getFloorId();

            // 先暂时继承FloorRequest的color属性
            String color = request.getColor();
            // String color = calculateColor(floorId);
            if (Objects.equals(color, Constants.DARK)) {
                return; // 如果是暗色，则废弃该请求
            }

            RedBlueBall ball = new RedBlueBall(floorId, color);

            // 找到相同颜色的小球的第一个位置
            while (current.next != null && !current.next.color.equals(color)) {
                current = current.next;
            }

            if (current.next == null) {
                current.next = ball;
            } else {
                // 插入排序：找到合适的位置插入
                while (current.next != null && current.next.position < floorId) {
                    current = current.next;
                }
                if (current.next == null) {
                    current.next = ball;
                } else if (current.next.position > floorId) {
                    ball.next = current.next;
                    current.next = ball;
                }
            }
            // 真正插入新的小球后, 再通知前端渲染打印
            MyWebSocketHandler.broadcast(Response.toJson(printBall(), Constants.PRINT_BALL));
        } finally {
            lock.unlock();
        }
    }

    /**
     * 暂不考虑计算小球颜色. 因为最近的commit中再Request中已经存储颜色信息.
     * <p>
     * 计算小球的颜色
     * @param floorId 请求的楼层编号
     * @return 红色、蓝色或暗色（无效）
     */
    @Deprecated
    private String calculateColor(Integer floorId) {
        int currentFloor = rs.getCurrentFloor();
        if (currentFloor < floorId) {
            return Constants.RED;
        } else if (currentFloor > floorId) {
            return Constants.BLUE;
        } else {
            // 当前楼层等于目标楼层，废弃请求
            return Constants.DARK;
        }
    }

    /**
     * 返回电梯运行到的下一个楼层的数字
     * @return 下一个楼层编号，如果没有则返回 Constants.NULL
     */
    public Integer getNext() {
        lock.lock();
        try {
            /*
             * 注意：这里不能阻塞太久，否则可能导致死锁。
             * dummyHead.next == null 并且 lock 被占用时，
             * insert 方法可能永远无法执行。
             */
            if (dummyHead.next == null) {
                return Constants.NULL;
            } else {
                return dummyHead.next.position;
            }
        } finally {
            consume();
            lock.unlock();
        }
    }

    /**
     * 消费第一个非dummy的小球
     */
    public void consume() {
        lock.lock();
        try {
            RedBlueBall current = dummyHead;
            if (current.next != null) {
                log.info("消耗小球: ({}, {})", current.next.position, current.next.color);
                current.next = current.next.next;
                // 消耗小球再进行前端渲染, 不然高频打印贼抽象
                // MyWebSocketHandler.broadcast(Response.toJson(printBall(), Constants.PRINT_BALL));
            }
        } finally {
            lock.unlock();
        }
    }

    public String printBall() {
        lock.lock();
        try {
            RedBlueBall current = dummyHead.next;
            StringBuilder sb = new StringBuilder("路径: ");
            while (current != null) {
                sb.append("(").append(current.position).append(", ").append(current.color).append(") ").append(" -> ");
                current = current.next;
            }
            return sb.toString();
        } finally {
            lock.unlock();
        }
    }
}