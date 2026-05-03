package com.lms.dev.announcement.service;

import com.lms.dev.announcement.entity.Announcement;
import com.lms.dev.announcement.repository.AnnouncementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;

    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAllByOrderByDateDesc();
    }

    public List<Announcement> getPublishedAnnouncements() {
        return announcementRepository.findByPublishedTrueOrderByDateDesc();
    }

    public Announcement createAnnouncement(Announcement announcement) {
        if (announcement.getDate() == null) {
            announcement.setDate(LocalDateTime.now());
        }
        return announcementRepository.save(announcement);
    }

    public Announcement updateAnnouncement(UUID id, Announcement updatedAnnouncement) {
        Optional<Announcement> existingOpt = announcementRepository.findById(id);
        if (existingOpt.isPresent()) {
            Announcement existing = existingOpt.get();
            existing.setTitle(updatedAnnouncement.getTitle());
            existing.setBody(updatedAnnouncement.getBody());
            existing.setPublished(updatedAnnouncement.isPublished());
            return announcementRepository.save(existing);
        }
        return null;
    }

    public Announcement togglePublish(UUID id) {
        Optional<Announcement> existingOpt = announcementRepository.findById(id);
        if (existingOpt.isPresent()) {
            Announcement existing = existingOpt.get();
            existing.setPublished(!existing.isPublished());
            return announcementRepository.save(existing);
        }
        return null;
    }

    public void deleteAnnouncement(UUID id) {
        announcementRepository.deleteById(id);
    }
}
