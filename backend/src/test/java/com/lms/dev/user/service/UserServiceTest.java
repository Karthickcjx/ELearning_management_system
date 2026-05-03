package com.lms.dev.user.service;

import com.lms.dev.user.dto.UpdateUserRequest;
import com.lms.dev.user.entity.User;
import com.lms.dev.user.enums.UserRole;
import com.lms.dev.progress.repository.ProgressRepository;
import com.lms.dev.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private ProgressRepository progressRepository;

    @InjectMocks
    private UserService userService;

    private UUID knownId;
    private UUID unknownId;
    private User existingUser;

    @BeforeEach
    void setUp() {
        knownId = UUID.randomUUID();
        unknownId = UUID.randomUUID();
        existingUser = User.builder()
                .id(knownId)
                .username("original")
                .email("user@test.com")
                .password("encoded")
                .role(UserRole.USER)
                .isActive(true)
                .build();
    }

    @Test
    void getUserById_whenExists_returnsUser() {
        when(userRepository.findById(knownId)).thenReturn(Optional.of(existingUser));
        User result = userService.getUserById(knownId);
        assertThat(result.getId()).isEqualTo(knownId);
    }

    @Test
    void getUserById_whenNotFound_throws404() {
        when(userRepository.findById(unknownId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.getUserById(unknownId))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void updateUser_whenNotFound_throws404() {
        when(userRepository.findById(unknownId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.updateUser(unknownId, new UpdateUserRequest()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void updateUser_cannotChangeRole() {
        when(userRepository.findById(knownId)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserRequest req = new UpdateUserRequest();
        req.setUsername("newname");

        User result = userService.updateUser(knownId, req);

        // Role must stay USER regardless of what the caller sends
        assertThat(result.getRole()).isEqualTo(UserRole.USER);
        assertThat(result.getUsername()).isEqualTo("newname");
    }

    @Test
    void createUser_persistsRegistrationFieldsAndHashesPassword() {
        User newUser = User.builder()
                .username("new learner")
                .email("new@example.com")
                .password("raw-pass")
                .mobileNumber("+15550001111")
                .dob("1998-05-10")
                .gender("Female")
                .location("Chennai, India")
                .profession("Engineer")
                .linkedin_url("https://linkedin.com/in/new-learner")
                .github_url("https://github.com/new-learner")
                .build();

        when(userRepository.findByEmail("new@example.com")).thenReturn(null);
        when(passwordEncoder.encode("raw-pass")).thenReturn("encoded-pass");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.createUser(newUser);

        assertThat(result.getRole()).isEqualTo(UserRole.USER);
        assertThat(result.getIsActive()).isTrue();
        assertThat(result.getPassword()).isEqualTo("encoded-pass");
        assertThat(result.getMobileNumber()).isEqualTo("+15550001111");
        assertThat(result.getDob()).isEqualTo("1998-05-10");
        assertThat(result.getGender()).isEqualTo("Female");
        assertThat(result.getProfession()).isEqualTo("Engineer");
        assertThat(result.getLinkedin_url()).isEqualTo("https://linkedin.com/in/new-learner");
        assertThat(result.getGithub_url()).isEqualTo("https://github.com/new-learner");
    }
}
