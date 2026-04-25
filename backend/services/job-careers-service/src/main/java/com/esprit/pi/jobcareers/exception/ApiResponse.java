package com.esprit.pi.jobcareers.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> success(T data, String msg) {
        return ApiResponse.<T>builder().success(true).message(msg)
                .data(data).timestamp(LocalDateTime.now()).build();
    }
    public static <T> ApiResponse<T> success(T data) { return success(data, "OK"); }
    public static <T> ApiResponse<T> error(String msg) {
        return ApiResponse.<T>builder().success(false).message(msg)
                .timestamp(LocalDateTime.now()).build();
    }
}