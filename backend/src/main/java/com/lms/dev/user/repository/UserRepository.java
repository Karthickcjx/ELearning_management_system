package com.lms.dev.user.repository;

import com.lms.dev.user.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import com.lms.dev.user.entity.User;

import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    User findByEmail(String email);

    boolean existsByRole(UserRole role);

    java.util.List<User> findByRole(UserRole role);
}
