package com.training.events.dto;

public class ProgramItemDto {
    private String time;
    private String activity;

    public ProgramItemDto() {}
    public ProgramItemDto(String time, String activity) {
        this.time = time;
        this.activity = activity;
    }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public String getActivity() { return activity; }
    public void setActivity(String activity) { this.activity = activity; }
}
