package com.team04.ewaste.config;

import com.team04.ewaste.auth.Role;
import com.team04.ewaste.auth.User;
import com.team04.ewaste.auth.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminSeeder(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        // ADMIN
        String adminEmail = "admin@test.com";
        if (!userRepository.existsByEmail(adminEmail)) {

            User admin = new User(
                    adminEmail,
                    passwordEncoder.encode("admin123"),
                    Role.ADMIN
            );

            userRepository.save(admin);
        }

        // OWNER
        String ownerEmail = "owner@test.com";
        if (!userRepository.existsByEmail(ownerEmail)) {

            User owner = new User(
                    ownerEmail,
                    passwordEncoder.encode("123456"),
                    Role.OWNER
            );

            userRepository.save(owner);
        }

        // STAFF
        String staffEmail = "staff@test.com";
        if (!userRepository.existsByEmail(staffEmail)) {

            User staff = new User(
                    staffEmail,
                    passwordEncoder.encode("123456"),
                    Role.STAFF
            );

            userRepository.save(staff);
        }
    }
}