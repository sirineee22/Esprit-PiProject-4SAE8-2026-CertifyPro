package com.ecommerce.service;

import com.ecommerce.entity.Order;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Rectangle;
import com.lowagie.text.PageSize;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import jakarta.mail.internet.MimeMessage;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    ///////////////////////////////////////////////////////////
    // SEND EMAIL WITH PDF RECEIPT
    ///////////////////////////////////////////////////////////

    public void sendOrderConfirmation(Order order) {

        try {

            MimeMessage message =
                    mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(
                            message,
                            true,
                            "UTF-8"
                    );

            helper.setTo(order.getEmail());
            helper.setFrom("contact@longevityplus.store");
            helper.setSubject(
                    "Order Confirmation #" + order.getId()
            );

            helper.setText(
                    buildHtml(order),
                    true
            );

            byte[] pdf =
                    generatePdfReceipt(order);

            helper.addAttachment(
                    "Receipt_Order_" +
                            order.getId() +
                            ".pdf",
                    new ByteArrayResource(pdf)
            );

            mailSender.send(message);

            System.out.println(
                    "Email sent successfully"
            );

        } catch (Exception e) {

            System.out.println(
                    "Mail failed: " +
                            e.getMessage()
            );
        }
    }

    ///////////////////////////////////////////////////////////
    // HTML EMAIL
    ///////////////////////////////////////////////////////////

    private String buildHtml(Order order) {

        return """
        <div style='font-family:Arial;padding:25px;background:#f8fafc'>
        
            <div style='max-width:600px;
                        margin:auto;
                        background:white;
                        border-radius:14px;
                        padding:30px;
                        box-shadow:0 10px 30px rgba(0,0,0,.08)'>

                <h2 style='color:#2563eb;margin-top:0'>
                    Thank you %s 👋
                </h2>

                <p>
                    Your order <b>#%d</b> has been received successfully.
                </p>

                <p>
                    Total Amount:
                    <b>%.2f €</b>
                </p>

                <p>
                    Payment Method:
                    <b>%s</b>
                </p>

                <p>
                    📎 PDF receipt attached.
                </p>

                <hr>

                <p style='color:#64748b'>
                    Certify PRO Team
                </p>

            </div>
        </div>
        """.formatted(
                safe(order.getFullName()),
                order.getId(),
                order.getTotalPrice(),
                safe(order.getPaymentMethod())
        );
    }

    ///////////////////////////////////////////////////////////
    // GENERATE PDF RECEIPT (LIBREPDF / OPENPDF)
    ///////////////////////////////////////////////////////////

    private byte[] generatePdfReceipt(Order order)
            throws Exception {

        ByteArrayOutputStream out =
                new ByteArrayOutputStream();

        Document document =
                new Document(
                        PageSize.A4,
                        40,
                        40,
                        50,
                        50
                );

        PdfWriter.getInstance(
                document,
                out
        );

        document.open();

        //////////////////////////////////////////////////////
        // FONTS
        //////////////////////////////////////////////////////

        Font title =
                FontFactory.getFont(
                        FontFactory.HELVETICA_BOLD,
                        22,
                        Color.BLUE
                );

        Font subtitle =
                FontFactory.getFont(
                        FontFactory.HELVETICA_BOLD,
                        12,
                        Color.DARK_GRAY
                );

        Font normal =
                FontFactory.getFont(
                        FontFactory.HELVETICA,
                        11,
                        Color.BLACK
                );

        Font bold =
                FontFactory.getFont(
                        FontFactory.HELVETICA_BOLD,
                        11,
                        Color.BLACK
                );

        //////////////////////////////////////////////////////
        // TITLE
        //////////////////////////////////////////////////////

        Paragraph p1 =
                new Paragraph(
                        "CERTIFY PRO",
                        title
                );

        p1.setAlignment(
                Element.ALIGN_CENTER
        );

        document.add(p1);

        Paragraph p2 =
                new Paragraph(
                        "Official Payment Receipt",
                        subtitle
                );

        p2.setSpacingAfter(25);
        p2.setAlignment(
                Element.ALIGN_CENTER
        );

        document.add(p2);

        //////////////////////////////////////////////////////
        // ORDER TABLE
        //////////////////////////////////////////////////////

        PdfPTable table =
                new PdfPTable(2);

        table.setWidthPercentage(100);
        table.setSpacingBefore(10);
        table.setSpacingAfter(20);

        table.setWidths(
                new float[]{35, 65}
        );

        addRow(table, "Order ID", "#" + order.getId(), bold, normal);
        addRow(table, "Customer", safe(order.getFullName()), bold, normal);
        addRow(table, "Email", safe(order.getEmail()), bold, normal);

        addRow(
                table,
                "Date",
                order.getOrderDate()
                        .format(
                                DateTimeFormatter.ofPattern(
                                        "dd/MM/yyyy HH:mm"
                                )
                        ),
                bold,
                normal
        );

        addRow(
                table,
                "Address",
                safe(order.getAddress()) +
                        ", " +
                        safe(order.getCity()) +
                        ", " +
                        safe(order.getCountry()),
                bold,
                normal
        );

        addRow(
                table,
                "Payment",
                safe(order.getPaymentMethod()),
                bold,
                normal
        );

        addRow(
                table,
                "Total",
                String.format(
                        "%.2f €",
                        order.getTotalPrice()
                ),
                bold,
                normal
        );

        document.add(table);

        //////////////////////////////////////////////////////
        // FOOTER
        //////////////////////////////////////////////////////

        Paragraph thanks =
                new Paragraph(
                        "Thank you for your purchase.",
                        bold
                );

        thanks.setSpacingBefore(20);

        document.add(thanks);

        Paragraph footer =
                new Paragraph(
                        "This document is generated automatically by Certify PRO.",
                        normal
                );

        footer.setSpacingBefore(8);

        document.add(footer);

        document.close();

        return out.toByteArray();
    }

    ///////////////////////////////////////////////////////////
    // TABLE ROW
    ///////////////////////////////////////////////////////////

    private void addRow(
            PdfPTable table,
            String label,
            String value,
            Font leftFont,
            Font rightFont
    ) {

        PdfPCell c1 =
                new PdfPCell(
                        new Paragraph(label, leftFont)
                );

        c1.setPadding(8);
        c1.setBackgroundColor(
                new Color(245, 247, 250)
        );
        c1.setBorder(
                Rectangle.NO_BORDER
        );

        PdfPCell c2 =
                new PdfPCell(
                        new Paragraph(value, rightFont)
                );

        c2.setPadding(8);
        c2.setBorder(
                Rectangle.NO_BORDER
        );

        table.addCell(c1);
        table.addCell(c2);
    }

    ///////////////////////////////////////////////////////////
    // SAFE NULL
    ///////////////////////////////////////////////////////////

    private String safe(String v) {
        return v == null ? "" : v;
    }
}