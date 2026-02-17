package postgres

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/TitleKung-01/code-tree-backend/internal/domain/share"
)

type ShareRepo struct {
	db *DB
}

func NewShareRepo(db *DB) *ShareRepo {
	return &ShareRepo{db: db}
}

var _ share.Repository = (*ShareRepo)(nil)

// ==================== Create ====================

func (r *ShareRepo) Create(ctx context.Context, s *share.TreeShare) error {
	query := `
		INSERT INTO tree_shares (tree_id, user_id, role, invited_by)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`

	err := r.db.Pool.QueryRow(ctx, query,
		s.TreeID,
		s.UserID,
		s.Role,
		s.InvitedBy,
	).Scan(&s.ID, &s.CreatedAt, &s.UpdatedAt)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return share.ErrAlreadyShared
		}
		slog.Error("failed to create share", "error", err)
		return fmt.Errorf("failed to create share: %w", err)
	}

	slog.Info("share created", "id", s.ID, "tree_id", s.TreeID, "user_id", s.UserID, "role", s.Role)
	return nil
}

// ==================== FindByTreeAndUser ====================

func (r *ShareRepo) FindByTreeAndUser(ctx context.Context, treeID, userID string) (*share.TreeShare, error) {
	query := `
		SELECT ts.id, ts.tree_id, ts.user_id, ts.role, ts.invited_by,
		       COALESCE(au.email, '') as user_email,
		       COALESCE(p.display_name, '') as user_display_name,
		       COALESCE(p.avatar_url, '') as user_avatar_url,
		       ts.created_at, ts.updated_at
		FROM tree_shares ts
		LEFT JOIN auth.users au ON au.id = ts.user_id
		LEFT JOIN profiles p ON p.id = ts.user_id
		WHERE ts.tree_id = $1 AND ts.user_id = $2
	`

	s := &share.TreeShare{}
	err := r.db.Pool.QueryRow(ctx, query, treeID, userID).Scan(
		&s.ID, &s.TreeID, &s.UserID, &s.Role, &s.InvitedBy,
		&s.UserEmail, &s.UserDisplayName, &s.UserAvatarURL,
		&s.CreatedAt, &s.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, share.ErrShareNotFound
		}
		return nil, fmt.Errorf("failed to find share: %w", err)
	}

	return s, nil
}

// ==================== UpdateRole ====================

func (r *ShareRepo) UpdateRole(ctx context.Context, treeID, userID string, role share.Role) (*share.TreeShare, error) {
	query := `
		UPDATE tree_shares
		SET role = $3
		WHERE tree_id = $1 AND user_id = $2
		RETURNING id, tree_id, user_id, role, invited_by, created_at, updated_at
	`

	s := &share.TreeShare{}
	err := r.db.Pool.QueryRow(ctx, query, treeID, userID, role).Scan(
		&s.ID, &s.TreeID, &s.UserID, &s.Role, &s.InvitedBy,
		&s.CreatedAt, &s.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, share.ErrShareNotFound
		}
		return nil, fmt.Errorf("failed to update share role: %w", err)
	}

	slog.Info("share role updated", "tree_id", treeID, "user_id", userID, "role", role)
	return s, nil
}

// ==================== Delete ====================

func (r *ShareRepo) Delete(ctx context.Context, treeID, userID string) error {
	result, err := r.db.Pool.Exec(ctx,
		`DELETE FROM tree_shares WHERE tree_id = $1 AND user_id = $2`,
		treeID, userID,
	)
	if err != nil {
		return fmt.Errorf("failed to delete share: %w", err)
	}

	if result.RowsAffected() == 0 {
		return share.ErrShareNotFound
	}

	slog.Info("share deleted", "tree_id", treeID, "user_id", userID)
	return nil
}

// ==================== ListByTree ====================

func (r *ShareRepo) ListByTree(ctx context.Context, treeID string) ([]*share.TreeShare, error) {
	query := `
		SELECT ts.id, ts.tree_id, ts.user_id, ts.role, ts.invited_by,
		       COALESCE(au.email, '') as user_email,
		       COALESCE(p.display_name, '') as user_display_name,
		       COALESCE(p.avatar_url, '') as user_avatar_url,
		       ts.created_at, ts.updated_at
		FROM tree_shares ts
		LEFT JOIN auth.users au ON au.id = ts.user_id
		LEFT JOIN profiles p ON p.id = ts.user_id
		WHERE ts.tree_id = $1
		ORDER BY ts.created_at ASC
	`

	rows, err := r.db.Pool.Query(ctx, query, treeID)
	if err != nil {
		return nil, fmt.Errorf("failed to list shares: %w", err)
	}
	defer rows.Close()

	var shares []*share.TreeShare
	for rows.Next() {
		s := &share.TreeShare{}
		err := rows.Scan(
			&s.ID, &s.TreeID, &s.UserID, &s.Role, &s.InvitedBy,
			&s.UserEmail, &s.UserDisplayName, &s.UserAvatarURL,
			&s.CreatedAt, &s.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan share: %w", err)
		}
		shares = append(shares, s)
	}

	return shares, nil
}

// ==================== ListTreeIDsByUser ====================

func (r *ShareRepo) ListTreeIDsByUser(ctx context.Context, userID string) ([]string, error) {
	query := `
		SELECT tree_id FROM tree_shares
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list shared tree IDs: %w", err)
	}
	defer rows.Close()

	var treeIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("failed to scan tree ID: %w", err)
		}
		treeIDs = append(treeIDs, id)
	}

	return treeIDs, nil
}

// ==================== FindUserByEmail ====================

func (r *ShareRepo) FindUserByEmail(ctx context.Context, email string) (string, error) {
	query := `SELECT id FROM auth.users WHERE email = $1`

	var userID string
	err := r.db.Pool.QueryRow(ctx, query, email).Scan(&userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", share.ErrUserNotFound
		}
		return "", fmt.Errorf("failed to find user by email: %w", err)
	}

	return userID, nil
}

// ==================== GetUserRole ====================

func (r *ShareRepo) GetUserRole(ctx context.Context, treeID, userID string) (share.Role, error) {
	query := `SELECT role FROM tree_shares WHERE tree_id = $1 AND user_id = $2`

	var role share.Role
	err := r.db.Pool.QueryRow(ctx, query, treeID, userID).Scan(&role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", share.ErrShareNotFound
		}
		return "", fmt.Errorf("failed to get user role: %w", err)
	}

	return role, nil
}
