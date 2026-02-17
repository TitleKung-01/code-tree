package postgres

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5"

	"github.com/TitleKung-01/code-tree-backend/internal/domain/node"
)

type NodeRepo struct {
	db *DB
}

func NewNodeRepo(db *DB) *NodeRepo {
	return &NodeRepo{db: db}
}

var _ node.Repository = (*NodeRepo)(nil)

// ==================== Create ====================

func (r *NodeRepo) Create(ctx context.Context, n *node.Node) error {
	query := `
		INSERT INTO nodes (
			tree_id,
			nickname, first_name, last_name, student_id,
			photo_url, status, generation,
			position_x, position_y
		)
		VALUES ($1, $2, $3, $4, NULLIF($5, ''), $6, $7, $8, $9, $10)
		RETURNING id, created_at, updated_at
	`

	err := r.db.Pool.QueryRow(ctx, query,
		n.TreeID,
		n.Nickname,
		n.FirstName,
		n.LastName,
		n.StudentID,
		n.PhotoURL,
		n.Status,
		n.Generation,
		n.PositionX,
		n.PositionY,
	).Scan(&n.ID, &n.CreatedAt, &n.UpdatedAt)

	if err != nil {
		slog.Error("failed to create node", "error", err)
		return fmt.Errorf("failed to create node: %w", err)
	}

	slog.Info("node created", "id", n.ID, "nickname", n.Nickname)
	return nil
}

// ==================== FindByID ====================

func (r *NodeRepo) FindByID(ctx context.Context, id string) (*node.Node, error) {
	query := `
		SELECT id, tree_id,
		       nickname, first_name, last_name, COALESCE(student_id, ''),
		       photo_url, status, generation,
		       position_x, position_y,
		       created_at, updated_at
		FROM nodes
		WHERE id = $1
	`

	n := &node.Node{}
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&n.ID,
		&n.TreeID,
		&n.Nickname,
		&n.FirstName,
		&n.LastName,
		&n.StudentID,
		&n.PhotoURL,
		&n.Status,
		&n.Generation,
		&n.PositionX,
		&n.PositionY,
		&n.CreatedAt,
		&n.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, node.ErrNodeNotFound
		}
		return nil, fmt.Errorf("failed to find node: %w", err)
	}

	return n, nil
}

// ==================== Update ====================

func (r *NodeRepo) Update(ctx context.Context, n *node.Node) error {
	query := `
		UPDATE nodes SET
			nickname = $2,
			first_name = $3,
			last_name = $4,
			student_id = NULLIF($5, ''),
			photo_url = $6,
			status = $7,
			generation = $8
		WHERE id = $1
		RETURNING updated_at
	`

	err := r.db.Pool.QueryRow(ctx, query,
		n.ID,
		n.Nickname,
		n.FirstName,
		n.LastName,
		n.StudentID,
		n.PhotoURL,
		n.Status,
		n.Generation,
	).Scan(&n.UpdatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return node.ErrNodeNotFound
		}
		return fmt.Errorf("failed to update node: %w", err)
	}

	slog.Info("node updated", "id", n.ID, "nickname", n.Nickname)
	return nil
}

// ==================== UpdateGeneration ====================

func (r *NodeRepo) UpdateGeneration(ctx context.Context, id string, generation int32) error {
	result, err := r.db.Pool.Exec(ctx,
		`UPDATE nodes SET generation = $2 WHERE id = $1`, id, generation,
	)
	if err != nil {
		return fmt.Errorf("failed to update generation: %w", err)
	}
	if result.RowsAffected() == 0 {
		return node.ErrNodeNotFound
	}
	return nil
}

// ==================== Delete ====================

func (r *NodeRepo) Delete(ctx context.Context, id string) error {
	result, err := r.db.Pool.Exec(ctx, `DELETE FROM nodes WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete node: %w", err)
	}

	if result.RowsAffected() == 0 {
		return node.ErrNodeNotFound
	}

	slog.Info("node deleted", "id", id)
	return nil
}

// ==================== FindByTreeID ====================

func (r *NodeRepo) FindByTreeID(ctx context.Context, treeID string) ([]*node.Node, error) {
	query := `
		SELECT id, tree_id,
		       nickname, first_name, last_name, COALESCE(student_id, ''),
		       photo_url, status, generation,
		       position_x, position_y,
		       created_at, updated_at
		FROM nodes
		WHERE tree_id = $1
		ORDER BY created_at ASC
	`

	rows, err := r.db.Pool.Query(ctx, query, treeID)
	if err != nil {
		return nil, fmt.Errorf("failed to list nodes: %w", err)
	}
	defer rows.Close()

	var nodes []*node.Node
	for rows.Next() {
		n := &node.Node{}
		err := rows.Scan(
			&n.ID,
			&n.TreeID,
			&n.Nickname,
			&n.FirstName,
			&n.LastName,
			&n.StudentID,
			&n.PhotoURL,
			&n.Status,
			&n.Generation,
			&n.PositionX,
			&n.PositionY,
			&n.CreatedAt,
			&n.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan node: %w", err)
		}
		nodes = append(nodes, n)
	}

	return nodes, nil
}

// ==================== CountByTreeID ====================

func (r *NodeRepo) CountByTreeID(ctx context.Context, treeID string) (int, error) {
	var count int
	err := r.db.Pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM nodes WHERE tree_id = $1`, treeID,
	).Scan(&count)

	if err != nil {
		return 0, fmt.Errorf("failed to count nodes: %w", err)
	}
	return count, nil
}
