package com.glacierai.auth.dto;

import com.glacierai.auth.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private String refreshToken;
    private UserInfo user;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private String id;
        private String email;
        private String name;
        private String role;

        public static UserInfo fromUser(User user) {
            return new UserInfo(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole().name()
            );
        }
    }
}