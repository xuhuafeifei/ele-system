package com.fgbg.ele;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EleSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(EleSystemApplication.class, args);
    }

}
