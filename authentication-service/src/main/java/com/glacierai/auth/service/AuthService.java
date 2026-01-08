package com.glacierai.auth.service;

import com.glacierai.auth.dto.AuthRequest;
import com.glacierai.auth.dto.AuthResponse;
import com.glacierai.auth.dto.RegisterRequest;
import com.glacierai.auth.exception.AuthenticationException;
import com.glacierai.auth.exception.UserAlreadyExistsException;
import com.glacierai.auth.model.User;
import com.glacierai.auth.repository.UserRepository;
import com.glacierai.auth.util.JwtUtil;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("User with email " + request.getEmail() + " already exists");
        }

        // Create new user
        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setEmail(request.getEmail().toLowerCase());
        user.setPasswordHash(BCrypt.hashpw(request.getPassword(), BCrypt.gensalt()));
        user.setName(request.getName());
        user.setRole(User.Role.CUSTOMER);
        user.setIsActive(true);

        User savedUser = userRepository.save(user);

        // Generate tokens
        String token = jwtUtil.generateToken(savedUser);
        String refreshToken = jwtUtil.generateRefreshToken(savedUser);

        return new AuthResponse(token, refreshToken, AuthResponse.UserInfo.fromUser(savedUser));
    }

    public AuthResponse login(AuthRequest request) {
        Optional<User> userOpt = userRepository.findActiveByEmail(request.getEmail().toLowerCase());

        if (userOpt.isEmpty()) {
            throw new AuthenticationException("Invalid email or password");
        }

        User user = userOpt.get();

        if (!BCrypt.checkpw(request.getPassword(), user.getPasswordHash())) {
            throw new AuthenticationException("Invalid email or password");
        }

        // Generate tokens
        String token = jwtUtil.generateToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        return new AuthResponse(token, refreshToken, AuthResponse.UserInfo.fromUser(user));
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new AuthenticationException("Invalid refresh token");
        }

        String email = jwtUtil.getEmailFromToken(refreshToken);
        Optional<User> userOpt = userRepository.findActiveByEmail(email);

        if (userOpt.isEmpty()) {
            throw new AuthenticationException("User not found");
        }

        User user = userOpt.get();
        String newToken = jwtUtil.generateToken(user);
        String newRefreshToken = jwtUtil.generateRefreshToken(user);

        return new AuthResponse(newToken, newRefreshToken, AuthResponse.UserInfo.fromUser(user));
    }

    public User validateToken(String token) {
        if (!jwtUtil.validateToken(token)) {
            throw new AuthenticationException("Invalid token");
        }

        String email = jwtUtil.getEmailFromToken(token);
        return userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new AuthenticationException("User not found"));
    }

    public User getUserById(String userId) {
        return userRepository.findActiveById(userId)
                .orElseThrow(() -> new AuthenticationException("User not found"));
    }
}