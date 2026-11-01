package com.team04.ewaste.auth;

import com.team04.ewaste.auth.dto.AuthResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /*
     * Register new user
     * Default role = OWNER
     */
    public AuthResponse register(String email, String rawPassword) {

        if (userRepository.existsByEmail(email)) {
            return new AuthResponse(false, "Email already exists", null, null, null);
        }

        // encrypt password
        String hash = passwordEncoder.encode(rawPassword);

        // create user
        User user = new User();
        // user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setPasswordHash(hash);
        user.setRole(Role.OWNER);

        userRepository.save(user);

        return new AuthResponse(
                true,
                "Registered successfully",
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    /*
     * Manual login method (used by controller)
     */
    public AuthResponse login(String email, String rawPassword) {

        var opt = userRepository.findByEmail(email);

        if (opt.isEmpty()) {
            return new AuthResponse(false, "Invalid email or password", null, null, null);
        }

        User user = opt.get();

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            return new AuthResponse(false, "Invalid email or password", null, null, null);
        }

        return new AuthResponse(
                true,
                "Login success",
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );
    }
}