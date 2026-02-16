package postgres

import (
    "context"
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

// ตรวจสอบว่า TreeRepo implement tree.Repository interface
var _ tree.Repository = (*TreeRepo)(nil)

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

    slog.Info("tree created", "id", t.ID, "name", t.Name)
    return nil
}

func (r *TreeRepo) FindByID(ctx context.Context, id string) (*tree.Tree, error) {
    query := `
        SELECT id, name, description, faculty, department,
               created_by, share_token, is_public,
               created_at, updated_at
        FROM trees
        WHERE id = $1
    `

    t := &tree.Tree{}
    err := r.db.Pool.QueryRow(ctx, query, id).Scan(
        &t.ID,
        &t.Name,
        &t.Description,
        &t.Faculty,
        &t.Department,
        &t.CreatedBy,
        &t.ShareToken,
        &t.IsPublic,
        &t.CreatedAt,
        &t.UpdatedAt,
    )

    if err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            return nil, tree.ErrTreeNotFound
        }
        return nil, fmt.Errorf("failed to find tree: %w", err)
    }

    return t, nil
}

func (r *TreeRepo) ListByUser(ctx context.Context, userID string) ([]*tree.Tree, error) {
    query := `
        SELECT id, name, description, faculty, department,
               created_by, share_token, is_public,
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
        err := rows.Scan(
            &t.ID,
            &t.Name,
            &t.Description,
            &t.Faculty,
            &t.Department,
            &t.CreatedBy,
            &t.ShareToken,
            &t.IsPublic,
            &t.CreatedAt,
            &t.UpdatedAt,
        )
        if err != nil {
            return nil, fmt.Errorf("failed to scan tree: %w", err)
        }
        trees = append(trees, t)
    }

    return trees, nil
}

func (r *TreeRepo) Delete(ctx context.Context, id string) error {
    query := `DELETE FROM trees WHERE id = $1`

    result, err := r.db.Pool.Exec(ctx, query, id)
    if err != nil {
        return fmt.Errorf("failed to delete tree: %w", err)
    }

    if result.RowsAffected() == 0 {
        return tree.ErrTreeNotFound
    }

    slog.Info("tree deleted", "id", id)
    return nil
}