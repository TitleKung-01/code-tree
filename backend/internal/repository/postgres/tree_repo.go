package postgres

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5"

	"github.com/TitleKung-01/code-tree-backend/internal/domain/tree"
)

type TreeRepo struct {
	db *DB
}

func NewTreeRepo(db *DB) *TreeRepo {
	return &TreeRepo{db: db}
}

var _ tree.Repository = (*TreeRepo)(nil)

// ==================== Create ====================

func (r *TreeRepo) Create(ctx context.Context, t *tree.Tree) error {
	query := `
		INSERT INTO trees (name, description, faculty, department, created_by)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`

	err := r.db.Pool.QueryRow(ctx, query,
		t.Name,
		t.Description,
		t.Faculty,
		t.Department,
		t.CreatedBy,
	).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)

	if err != nil {
		slog.Error("failed to create tree", "error", err)
		return fmt.Errorf("failed to create tree: %w", err)
	}

	t.Structure = tree.NewEmptyStructure()
	slog.Info("tree created", "id", t.ID, "name", t.Name)
	return nil
}

// ==================== FindByID ====================

func (r *TreeRepo) FindByID(ctx context.Context, id string) (*tree.Tree, error) {
	query := `
		SELECT id, name, description, faculty, department,
		       created_by, share_token, is_public, structure,
		       created_at, updated_at
		FROM trees
		WHERE id = $1
	`

	t := &tree.Tree{}
	var structureJSON []byte
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&t.ID,
		&t.Name,
		&t.Description,
		&t.Faculty,
		&t.Department,
		&t.CreatedBy,
		&t.ShareToken,
		&t.IsPublic,
		&structureJSON,
		&t.CreatedAt,
		&t.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, tree.ErrTreeNotFound
		}
		return nil, fmt.Errorf("failed to find tree: %w", err)
	}

	s, err := tree.ParseStructure(structureJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to parse tree structure: %w", err)
	}
	t.Structure = *s

	return t, nil
}

// ==================== ListByUser ====================

func (r *TreeRepo) ListByUser(ctx context.Context, userID string) ([]*tree.Tree, error) {
	query := `
		SELECT id, name, description, faculty, department,
		       created_by, share_token, is_public, structure,
		       created_at, updated_at
		FROM trees
		WHERE created_by = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list trees: %w", err)
	}
	defer rows.Close()

	var trees []*tree.Tree
	for rows.Next() {
		t := &tree.Tree{}
		var structureJSON []byte
		err := rows.Scan(
			&t.ID,
			&t.Name,
			&t.Description,
			&t.Faculty,
			&t.Department,
			&t.CreatedBy,
			&t.ShareToken,
			&t.IsPublic,
			&structureJSON,
			&t.CreatedAt,
			&t.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan tree: %w", err)
		}

		s, err := tree.ParseStructure(structureJSON)
		if err != nil {
			return nil, fmt.Errorf("failed to parse tree structure: %w", err)
		}
		t.Structure = *s

		trees = append(trees, t)
	}

	return trees, nil
}

// ==================== FindByShareToken ====================

func (r *TreeRepo) FindByShareToken(ctx context.Context, token string) (*tree.Tree, error) {
	query := `
		SELECT id, name, description, faculty, department,
		       created_by, share_token, is_public, structure,
		       created_at, updated_at
		FROM trees
		WHERE share_token = $1
	`

	t := &tree.Tree{}
	var structureJSON []byte
	err := r.db.Pool.QueryRow(ctx, query, token).Scan(
		&t.ID,
		&t.Name,
		&t.Description,
		&t.Faculty,
		&t.Department,
		&t.CreatedBy,
		&t.ShareToken,
		&t.IsPublic,
		&structureJSON,
		&t.CreatedAt,
		&t.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, tree.ErrTreeNotFound
		}
		return nil, fmt.Errorf("failed to find tree by share token: %w", err)
	}

	s, err := tree.ParseStructure(structureJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to parse tree structure: %w", err)
	}
	t.Structure = *s

	return t, nil
}

// ==================== GenerateShareToken ====================

func (r *TreeRepo) GenerateShareToken(ctx context.Context, treeID string) (string, error) {
	// ตรวจว่ามี token อยู่แล้วไหม
	var existing *string
	err := r.db.Pool.QueryRow(ctx,
		`SELECT share_token FROM trees WHERE id = $1`, treeID,
	).Scan(&existing)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", tree.ErrTreeNotFound
		}
		return "", fmt.Errorf("failed to check existing token: %w", err)
	}

	// ถ้ามี token อยู่แล้ว ใช้ตัวเดิม
	if existing != nil && *existing != "" {
		return *existing, nil
	}

	// สร้าง token ใหม่ (16 bytes = 32 hex chars)
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate random token: %w", err)
	}
	token := hex.EncodeToString(bytes)

	// บันทึก token
	_, err = r.db.Pool.Exec(ctx,
		`UPDATE trees SET share_token = $1 WHERE id = $2`,
		token, treeID,
	)
	if err != nil {
		return "", fmt.Errorf("failed to save share token: %w", err)
	}

	slog.Info("share token generated", "treeID", treeID, "token", token)
	return token, nil
}

// ==================== FindByIDs ====================

func (r *TreeRepo) FindByIDs(ctx context.Context, ids []string) ([]*tree.Tree, error) {
	if len(ids) == 0 {
		return nil, nil
	}

	query := `
		SELECT id, name, description, faculty, department,
		       created_by, share_token, is_public, structure,
		       created_at, updated_at
		FROM trees
		WHERE id = ANY($1)
		ORDER BY created_at DESC
	`

	rows, err := r.db.Pool.Query(ctx, query, ids)
	if err != nil {
		return nil, fmt.Errorf("failed to find trees by IDs: %w", err)
	}
	defer rows.Close()

	var trees []*tree.Tree
	for rows.Next() {
		t := &tree.Tree{}
		var structureJSON []byte
		err := rows.Scan(
			&t.ID,
			&t.Name,
			&t.Description,
			&t.Faculty,
			&t.Department,
			&t.CreatedBy,
			&t.ShareToken,
			&t.IsPublic,
			&structureJSON,
			&t.CreatedAt,
			&t.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan tree: %w", err)
		}

		s, err := tree.ParseStructure(structureJSON)
		if err != nil {
			return nil, fmt.Errorf("failed to parse tree structure: %w", err)
		}
		t.Structure = *s

		trees = append(trees, t)
	}

	return trees, nil
}

// ==================== Delete ====================

func (r *TreeRepo) Delete(ctx context.Context, id string) error {
	result, err := r.db.Pool.Exec(ctx, `DELETE FROM trees WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete tree: %w", err)
	}

	if result.RowsAffected() == 0 {
		return tree.ErrTreeNotFound
	}

	slog.Info("tree deleted", "id", id)
	return nil
}

// ==================== Structure Operations ====================

// AddNodeToStructure เรียก DB function เพิ่ม node เข้า tree structure
func (r *TreeRepo) AddNodeToStructure(ctx context.Context, treeID, nodeID string, parentID *string) error {
	query := `SELECT public.add_node_to_structure($1, $2, $3)`
	var result []byte
	err := r.db.Pool.QueryRow(ctx, query, treeID, nodeID, parentID).Scan(&result)
	if err != nil {
		return fmt.Errorf("failed to add node to structure: %w", err)
	}
	slog.Info("node added to structure", "treeID", treeID, "nodeID", nodeID, "parentID", parentID)
	return nil
}

// RemoveNodeFromStructure เรียก DB function ลบ node ออกจาก tree structure
func (r *TreeRepo) RemoveNodeFromStructure(ctx context.Context, treeID, nodeID string) error {
	query := `SELECT public.remove_node_from_structure($1, $2)`
	var result []byte
	err := r.db.Pool.QueryRow(ctx, query, treeID, nodeID).Scan(&result)
	if err != nil {
		return fmt.Errorf("failed to remove node from structure: %w", err)
	}
	slog.Info("node removed from structure", "treeID", treeID, "nodeID", nodeID)
	return nil
}

// MoveNodeInStructure เรียก DB function ย้าย node ไป parent ใหม่
func (r *TreeRepo) MoveNodeInStructure(ctx context.Context, treeID, nodeID string, newParentID *string) error {
	query := `SELECT public.move_node_in_structure($1, $2, $3)`
	var result []byte
	err := r.db.Pool.QueryRow(ctx, query, treeID, nodeID, newParentID).Scan(&result)
	if err != nil {
		return fmt.Errorf("failed to move node in structure: %w", err)
	}
	slog.Info("node moved in structure", "treeID", treeID, "nodeID", nodeID, "newParentID", newParentID)
	return nil
}

// AddChildToParent เพิ่ม parent ให้ node โดยไม่ลบ parent เดิม (multi-parent / DAG)
func (r *TreeRepo) AddChildToParent(ctx context.Context, treeID, nodeID, parentID string) error {
	query := `SELECT public.add_child_to_parent($1::uuid, $2::uuid, $3::uuid)`
	var result []byte
	err := r.db.Pool.QueryRow(ctx, query, treeID, nodeID, parentID).Scan(&result)
	if err != nil {
		return fmt.Errorf("failed to add child to parent: %w", err)
	}
	slog.Info("child added to parent", "treeID", treeID, "nodeID", nodeID, "parentID", parentID)
	return nil
}
