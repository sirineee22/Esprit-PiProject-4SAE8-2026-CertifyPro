package com.training.platform.service;

import com.training.platform.entity.SessionSchedule;
import com.training.platform.repository.SessionScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class CalendarExportService {

    @Autowired
    private SessionScheduleRepository scheduleRepository;

    public String generateTrainerScheduleIcs(Long trainerId) {
        List<SessionSchedule> schedules = scheduleRepository.findByTrainerId(trainerId);

        StringBuilder ics = new StringBuilder();
        ics.append("BEGIN:VCALENDAR\r\n");
        ics.append("VERSION:2.0\r\n");
        ics.append("PRODID:-//CertifyPro//Training Platform//EN\r\n");
        ics.append("CALSCALE:GREGORIAN\r\n");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");

        for (SessionSchedule schedule : schedules) {
            ics.append("BEGIN:VEVENT\r\n");
            ics.append("SUMMARY:").append(schedule.getTopic()).append("\r\n");
            if (schedule.getStartTime() != null) {
                ics.append("DTSTART:").append(schedule.getStartTime().format(dtf)).append("\r\n");
            }
            if (schedule.getEndTime() != null) {
                ics.append("DTEND:").append(schedule.getEndTime().format(dtf)).append("\r\n");
            }
            ics.append("DESCRIPTION:Room ID: ").append(schedule.getRoom() != null ? schedule.getRoom().getId() : "TBD")
                    .append("\r\n");
            ics.append("END:VEVENT\r\n");
        }

        ics.append("END:VCALENDAR\r\n");
        return ics.toString();
    }
}
