package com.fgbg.ele.elevator;

import lombok.Data;

@Data
public class FloorRequest {
    private int floorId;
    private String color;

    public FloorRequest(int floorId, String color) {
        this.floorId = floorId;
        this.color = color;
    }
}