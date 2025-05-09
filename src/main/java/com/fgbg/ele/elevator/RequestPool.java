package com.fgbg.ele.elevator;

import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
public class RequestPool {

    private final Lock lock = new ReentrantLock();
    private final List<FloorRequest> pool = new LinkedList<>();
    private final PositionManager pm;

    public RequestPool(PositionManager pm) {
        this.pm = pm;
    }

    /**
     * 向请求池中添加一个请求
     * @param request 楼层请求对象
     */
    public void add(FloorRequest request) {
        lock.lock();
        try {
            pool.add(request);
        } finally {
            lock.unlock();
        }
    }

    public void send() {
        lock.lock();
        try {
            if (pool.isEmpty()) {
                log.info("请求池为空，无需发送");
                return;
            }
            log.info("发送请求：{}", pool);
            // 通知pm处理请求
            pm.inserts(pool.toArray(FloorRequest[]::new));

            // 发送后清空池子
            pool.clear();
        } finally {
            lock.unlock();
        }
    }
}