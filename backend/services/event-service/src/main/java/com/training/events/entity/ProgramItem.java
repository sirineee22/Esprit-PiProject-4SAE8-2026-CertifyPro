package com.training.events.entity;

import jakarta.persistence.Embeddable;

@Embeddable
public class ProgramItem {
    private String time;
    private String activity;

    public ProgramItem() {}
    public ProgramItem(String time, String activity) {
        this.time = time;
        this.activity = activity;
    }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public String getActivity() { return activity; }
    public void setActivity(String activity) { this.activity = activity; }
}
