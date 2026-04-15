package com.training.platform.controller;

import com.training.platform.entity.GroupFile;
import com.training.platform.entity.Workgroup;
import com.training.platform.repository.GroupFileRepository;
import com.training.platform.repository.WorkgroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/groups/{groupId}/files")
public class GroupFileController {

    @Autowired
    private GroupFileRepository fileRepo;

    @Autowired
    private WorkgroupRepository groupRepo;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @PathVariable Long groupId,
            @RequestParam("file") MultipartFile file,
            @RequestParam Long uploadedById,
            @RequestParam(required = false) String uploadedByName) {

        Workgroup group = groupRepo.findById(groupId).orElse(null);
        if (group == null)
            return ResponseEntity.notFound().build();

        try {
            GroupFile groupFile = new GroupFile();
            groupFile.setWorkgroup(group);
            groupFile.setFileName(file.getOriginalFilename());
            groupFile.setFileType(file.getContentType());
            groupFile.setFileSize(file.getSize());
            groupFile.setFileData(file.getBytes());
            groupFile.setUploadedById(uploadedById);
            groupFile.setUploadedByName(uploadedByName != null ? uploadedByName : "Teacher");

            fileRepo.save(groupFile);
            return ResponseEntity.status(HttpStatus.CREATED).body("File uploaded successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload file");
        }
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listFiles(@PathVariable Long groupId) {
        List<GroupFile> files = fileRepo.findByWorkgroupIdOrderByUploadedAtDesc(groupId);
        // Return metadata only, not the binary data
        List<Map<String, Object>> result = files.stream().map(f -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", f.getId());
            map.put("fileName", f.getFileName());
            map.put("fileType", f.getFileType());
            map.put("fileSize", f.getFileSize());
            map.put("uploadedByName", f.getUploadedByName());
            map.put("uploadedAt", f.getUploadedAt());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{fileId}/download")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long groupId, @PathVariable Long fileId) {
        GroupFile file = fileRepo.findById(fileId).orElse(null);
        if (file == null || !file.getWorkgroup().getId().equals(groupId)) {
            return ResponseEntity.notFound().build();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(
                MediaType.parseMediaType(file.getFileType() != null ? file.getFileType() : "application/octet-stream"));
        headers.setContentDispositionFormData("attachment", file.getFileName());

        return new ResponseEntity<>(file.getFileData(), headers, HttpStatus.OK);
    }
}
