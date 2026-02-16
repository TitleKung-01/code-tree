package middleware

import (
    "context"
    "errors"
    "fmt"
    "log/slog"
    "net/http"
    "strings"

    "github.com/golang-jwt/jwt/v5"
)

// Context key สำหรับเก็บ user info
type contextKey string

const UserIDKey contextKey = "user_id"
const UserEmailKey contextKey = "user_email"

// AuthMiddleware ตรวจสอบ JWT token จาก Supabase
type AuthMiddleware struct {
    jwtSecret []byte
}

func NewAuthMiddleware(jwtSecret string) *AuthMiddleware {
    return &AuthMiddleware{
        jwtSecret: []byte(jwtSecret),
    }
}

// Wrap ครอบ handler ด้วย auth check
func (m *AuthMiddleware) Wrap(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // ดึง token จาก header
        authHeader := r.Header.Get("Authorization")
        if authHeader == "" {
            http.Error(w, `{"error":"missing authorization header"}`, http.StatusUnauthorized)
            return
        }

        // ตัด "Bearer " ออก
        tokenString := strings.TrimPrefix(authHeader, "Bearer ")
        if tokenString == authHeader {
            http.Error(w, `{"error":"invalid authorization format"}`, http.StatusUnauthorized)
            return
        }

        // Parse + Verify JWT
        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            // ตรวจ signing method
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
            }
            return m.jwtSecret, nil
        })

        if err != nil || !token.Valid {
            slog.Warn("invalid JWT token", "error", err)
            http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
            return
        }

        // ดึง claims
        claims, ok := token.Claims.(jwt.MapClaims)
        if !ok {
            http.Error(w, `{"error":"invalid token claims"}`, http.StatusUnauthorized)
            return
        }

        // ดึง user_id (sub) จาก claims
        userID, ok := claims["sub"].(string)
        if !ok || userID == "" {
            http.Error(w, `{"error":"missing user id in token"}`, http.StatusUnauthorized)
            return
        }

        // ดึง email (optional)
        email, _ := claims["email"].(string)

        slog.Debug("authenticated user", "user_id", userID, "email", email)

        // Inject user info เข้า context
        ctx := context.WithValue(r.Context(), UserIDKey, userID)
        ctx = context.WithValue(ctx, UserEmailKey, email)

        // ส่งต่อไปยัง handler ถัดไป
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// Helper functions สำหรับดึง user info จาก context

func GetUserID(ctx context.Context) (string, error) {
    userID, ok := ctx.Value(UserIDKey).(string)
    if !ok || userID == "" {
        return "", errors.New("user not authenticated")
    }
    return userID, nil
}

func GetUserEmail(ctx context.Context) string {
    email, _ := ctx.Value(UserEmailKey).(string)
    return email
}