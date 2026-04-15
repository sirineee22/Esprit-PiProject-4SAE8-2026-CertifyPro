package com.training.platform.service;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.training.platform.entity.SessionSchedule;
import com.training.platform.repository.SessionScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
public class PdfExportService {

    @Autowired
    private SessionScheduleRepository scheduleRepository;

    public byte[] generateTrainerSchedulePdf(Long trainerId) {
        List<SessionSchedule> schedules = scheduleRepository.findByTrainerId(trainerId);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(new Paragraph("Trainer Schedule (Trainer ID: " + trainerId + ")"));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(4);
            table.addCell("Topic");
            table.addCell("Start Time");
            table.addCell("End Time");
            table.addCell("Status");

            for (SessionSchedule schedule : schedules) {
                table.addCell(schedule.getTopic() != null ? schedule.getTopic() : "N/A");
                table.addCell(schedule.getStartTime() != null ? schedule.getStartTime().toString() : "N/A");
                table.addCell(schedule.getEndTime() != null ? schedule.getEndTime().toString() : "N/A");
                table.addCell(schedule.getStatus() != null ? schedule.getStatus().name() : "N/A");
            }

            document.add(table);
            document.close();

            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF", e);
        }
    }
}
