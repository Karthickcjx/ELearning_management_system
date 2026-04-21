package com.lms.dev.announcement.repository;

import com.lms.dev.announcement.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {
    List<Announcement> findByPublishedTrueOrderByDateDesc();

    List<Announcement> findAllByOrderByDateDesc();
}
