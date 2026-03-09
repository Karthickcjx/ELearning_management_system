package com.lms.dev.controller;

import com.lms.dev.entity.Announcement;
import com.lms.dev.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<Announcement> getAllAnnouncements() {
        return announcementService.getAllAnnouncements();
    }

    @GetMapping("/published")
    public List<Announcement> getPublishedAnnouncements() {
        return announcementService.getPublishedAnnouncements();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public Announcement createAnnouncement(@RequestBody Announcement announcement) {
        return announcementService.createAnnouncement(announcement);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Announcement updateAnnouncement(@PathVariable UUID id, @RequestBody Announcement announcement) {
        return announcementService.updateAnnouncement(id, announcement);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/toggle-publish")
    public Announcement togglePublish(@PathVariable UUID id) {
        return announcementService.togglePublish(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void deleteAnnouncement(@PathVariable UUID id) {
        announcementService.deleteAnnouncement(id);
    }
}
