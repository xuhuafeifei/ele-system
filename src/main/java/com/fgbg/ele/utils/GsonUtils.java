package com.fgbg.ele.utils;

import com.google.gson.*;

/**
 * @author feigebuge
 * @email 2508020102@qq.com
 */
public class GsonUtils {
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    public static String toJson(Object object) {
        return gson.toJson(object);
    }

    public static <T> T fromJson(String json, Class<T> classOfT) {
        return gson.fromJson(json, classOfT);
    }
}