package com.esprit.pi.jobcareers.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    private SecurityUtils() {}

    public static Long getCurrentUserId(HttpServletRequest request) {
        Object v = request.getAttribute("userId");
        if (v == null) {
            return null;
        }
        if (v instanceof Long l) {
            return l;
        }
        if (v instanceof Number n) {
            return n.longValue();
        }
        return Long.parseLong(v.toString());
    }

    public static String getCurrentUserRole(HttpServletRequest request) {
        return (String) request.getAttribute("userRole");
    }

    public static String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }

    public static boolean isAdmin(HttpServletRequest request) {
        String role = getCurrentUserRole(request);
        return "ADMIN".equals(role);
    }

    public static boolean isEmployer(HttpServletRequest request) {
        String role = getCurrentUserRole(request);
        return "EMPLOYER".equals(role) || "ADMIN".equals(role);
    }
}