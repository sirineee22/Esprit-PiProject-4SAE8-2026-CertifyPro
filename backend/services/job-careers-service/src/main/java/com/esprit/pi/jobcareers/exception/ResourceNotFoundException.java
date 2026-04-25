package com.esprit.pi.jobcareers.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String msg) { super(msg); }
    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " introuvable avec l'id : " + id);
    }
}