const Constants = Object.freeze({
    // Colors
    RED: "red",
    BLUE: "blue",
    DARK: "dark",
    NULL: -10000,

    // Running Status
    RUNNING_STATUS_RUNNING: "RUNNING_STATUS_RUNNING",
    RUNNING_STATUS_STOPPED: "RUNNING_STATUS_STOPPED",

    // Back to front communication
    ELEVATOR_MOVING_TO_NEXT: "ELEVATOR_MOVING_TO_NEXT",

    // Front to back communication
    ELEVATOR_RENDER_DONE: "ELEVATOR_RENDER_DONE",

    // System status
    START: "START",

    // Floor request generation
    FLOOR_REQUEST_GENERATE: "FLOOR_REQUEST_GENERATE",

    // Request limits
    RANDOM_REQUEST_COUNT: 2, // Max 2 requests per floor per dispatch
    TOTAL_FLOORS: 3,
    RANDOM_REQUEST_FLOOR_COUNT: 1 // Randomly pick 1 floor to generate request
});

// 导出供其他模块使用（如果是模块化开发）
export default Constants;