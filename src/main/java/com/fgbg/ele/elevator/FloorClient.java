package com.fgbg.ele.elevator;

import com.fgbg.ele.controller.*;
import com.fgbg.ele.entity.*;
import com.fgbg.ele.utils.*;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Slf4j
public class FloorClient {

    private final int floor;
    private final int totalFloors;
    private final RunningSystem rs;
    private Connection connection;

    public FloorClient(int floor, int totalFloors, RunningSystem rs) {
        this.floor = floor;
        this.totalFloors = totalFloors;
        this.rs = rs;
    }

    public void doConnect(Elevator elevator) {
        this.connection = elevator.connect();
    }

    public void doSend() {
        for (int i = 1; i <= Constants.RANDOM_REQUEST_COUNT; i++) {
            int destFloor = RandomUtils.nextIntExclude(1, totalFloors, this.floor);
            // 通知前端渲染
            Map<String, Integer> data =
                    new java.util.HashMap<>(Map.of(
                    "floor", this.floor,
                    "destFloor", this.floor
                    ));
            // 先让电梯到达当层楼
            log.info("current floor: " + rs.getCurrentFloor());
            this.connection.send(new FloorRequest(this.floor, calculateColor(this.floor)));

            // 再让电梯到达目标楼
            data.put("destFloor", destFloor);
            MyWebSocketHandler.broadcast(Response.toJson(data, Constants.FLOOR_REQUEST_GENERATE));
            this.connection.send(new FloorRequest(destFloor, calculateColor(destFloor, this.floor)));

            log.info("楼层 {} 请求到达楼层 {}", this.floor, destFloor);
        }
    }

    private String calculateColor(int floorId) {
        int currentFloor = rs.getCurrentFloor();
        return calculateColor(floorId, currentFloor);
    }

    private String calculateColor(int floorId, int currentFloor) {
        if (currentFloor < floorId) {
            return Constants.RED;
        } else if (currentFloor > floorId) {
            return Constants.BLUE;
        } else {
            // 当前楼层等于目标楼层，废弃请求
            return Constants.DARK;
        }
    }
}