package com.training.platform.entity;

public enum SessionStatus {
    SCHEDULED, // The session is planned but hasn't started yet.
    ONGOING, // The session is currently taking place.
    COMPLETED, // The session has finished.
    CANCELLED // The session was cancelled (trainer unavailable, etc.).
}
