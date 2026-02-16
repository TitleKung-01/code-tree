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
            tree_id, parent_id, sibling_order,
            nickname, first_name, last_name, student_id,
            generation, photo_url, status,
            position_x, position_y
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, created_at, updated_at
    `

    err := r.db.Pool.QueryRow(ctx, query,
        n.TreeID,
        n.ParentID,
        n.SiblingOrder,
        n.Nickname,
        n.FirstName,
        n.LastName,
        n.StudentID,
        n.Generation,
        n.PhotoURL,
        n.Status,
        n.PositionX,
        n.PositionY,
    ).Scan(&n.ID, &n.CreatedAt, &n.UpdatedAt)

    if err != nil {
        slog.Error("failed to create node", "error", err)
        return fmt.Errorf("failed to create node: %w", err)
    }

    slog.Info("node created", "id", n.ID, "nickname", n.Nickname, "generation", n.Generation)
    return nil
}

// ==================== FindByID ====================

func (r *NodeRepo) FindByID(ctx context.Context, id string) (*node.Node, error) {
    query := `
        SELECT id, tree_id, parent_id, sibling_order,
               nickname, first_name, last_name, student_id,
               generation, photo_url, status,
               position_x, position_y,
               created_at, updated_at
        FROM nodes
        WHERE id = $1
    `

    n := &node.Node{}
    err := r.db.Pool.QueryRow(ctx, query, id).Scan(
        &n.ID,
        &n.TreeID,
        &n.ParentID,
        &n.SiblingOrder,
        &n.Nickname,
        &n.FirstName,
        &n.LastName,
        &n.StudentID,
        &n.Generation,
        &n.PhotoURL,
        &n.Status,
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
            student_id = $5,
            photo_url = $6,
            status = $7
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

// ==================== Delete ====================

func (r *NodeRepo) Delete(ctx context.Context, id string) error {
    // ON DELETE SET NULL จะทำให้ children.parent_id = NULL
    // แต่เราอยากให้ลบ descendants ด้วย (cascade)
    // ดังนั้นลบ descendants ก่อน แล้วค่อยลบตัวเอง

    tx, err := r.db.Pool.Begin(ctx)
    if err != nil {
        return fmt.Errorf("failed to begin tx: %w", err)
    }
    defer tx.Rollback(ctx)

    // ลบ descendants ทั้งหมดก่อน (ใช้ recursive CTE)
    deleteDescendants := `
        WITH RECURSIVE descendants AS (
            SELECT id FROM nodes WHERE parent_id = $1
            UNION ALL
            SELECT n.id FROM nodes n
            INNER JOIN descendants d ON n.parent_id = d.id
        )
        DELETE FROM nodes WHERE id IN (SELECT id FROM descendants)
    `
    _, err = tx.Exec(ctx, deleteDescendants, id)
    if err != nil {
        return fmt.Errorf("failed to delete descendants: %w", err)
    }

    // ลบตัวเอง
    result, err := tx.Exec(ctx, `DELETE FROM nodes WHERE id = $1`, id)
    if err != nil {
        return fmt.Errorf("failed to delete node: %w", err)
    }

    if result.RowsAffected() == 0 {
        return node.ErrNodeNotFound
    }

    if err := tx.Commit(ctx); err != nil {
        return fmt.Errorf("failed to commit: %w", err)
    }

    slog.Info("node deleted (with descendants)", "id", id)
    return nil
}

// ==================== FindByTreeID ====================

func (r *NodeRepo) FindByTreeID(ctx context.Context, treeID string) ([]*node.Node, error) {
    query := `
        SELECT id, tree_id, parent_id, sibling_order,
               nickname, first_name, last_name, student_id,
               generation, photo_url, status,
               position_x, position_y,
               created_at, updated_at
        FROM nodes
        WHERE tree_id = $1
        ORDER BY generation ASC, sibling_order ASC, created_at ASC
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
            &n.ParentID,
            &n.SiblingOrder,
            &n.Nickname,
            &n.FirstName,
            &n.LastName,
            &n.StudentID,
            &n.Generation,
            &n.PhotoURL,
            &n.Status,
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

// ==================== UpdateParent ====================

func (r *NodeRepo) UpdateParent(ctx context.Context, nodeID string, newParentID *string, generation int) error {
    tx, err := r.db.Pool.Begin(ctx)
    if err != nil {
        return fmt.Errorf("failed to begin tx: %w", err)
    }
    defer tx.Rollback(ctx)

    // 1. Update ตัว node เอง
    _, err = tx.Exec(ctx,
        `UPDATE nodes SET parent_id = $2, generation = $3 WHERE id = $1`,
        nodeID, newParentID, generation,
    )
    if err != nil {
        return fmt.Errorf("failed to update parent: %w", err)
    }

    // 2. Recalculate generation ของ descendants ทั้งหมด
    // ใช้ recursive update
    recalcQuery := `
        WITH RECURSIVE descendants AS (
            SELECT id, $2::int as new_gen
            FROM nodes WHERE parent_id = $1

            UNION ALL

            SELECT n.id, d.new_gen + 1
            FROM nodes n
            INNER JOIN descendants d ON n.parent_id = d.id
        )
        UPDATE nodes SET generation = d.new_gen
        FROM descendants d
        WHERE nodes.id = d.id
    `
    _, err = tx.Exec(ctx, recalcQuery, nodeID, generation+1)
    if err != nil {
        return fmt.Errorf("failed to recalculate generations: %w", err)
    }

    if err := tx.Commit(ctx); err != nil {
        return fmt.Errorf("failed to commit: %w", err)
    }

    slog.Info("node parent updated", "nodeID", nodeID, "newParentID", newParentID, "generation", generation)
    return nil
}

// ==================== FindDescendantIDs ====================

func (r *NodeRepo) FindDescendantIDs(ctx context.Context, nodeID string) ([]string, error) {
    query := `
        WITH RECURSIVE descendants AS (
            SELECT id FROM nodes WHERE parent_id = $1
            UNION ALL
            SELECT n.id FROM nodes n
            INNER JOIN descendants d ON n.parent_id = d.id
        )
        SELECT id FROM descendants
    `

    rows, err := r.db.Pool.Query(ctx, query, nodeID)
    if err != nil {
        return nil, fmt.Errorf("failed to find descendants: %w", err)
    }
    defer rows.Close()

    var ids []string
    for rows.Next() {
        var id string
        if err := rows.Scan(&id); err != nil {
            return nil, fmt.Errorf("failed to scan descendant id: %w", err)
        }
        ids = append(ids, id)
    }

    return ids, nil
}

// ==================== EnsureNodeParentsTable ====================

func (r *NodeRepo) EnsureNodeParentsTable(ctx context.Context) error {
    query := `
        CREATE TABLE IF NOT EXISTS node_parents (
            node_id   UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
            parent_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (node_id, parent_id),
            CHECK (node_id != parent_id)
        )
    `
    _, err := r.db.Pool.Exec(ctx, query)
    if err != nil {
        return fmt.Errorf("failed to ensure node_parents table: %w", err)
    }
    return nil
}

// ==================== AddParentID ====================

func (r *NodeRepo) AddParentID(ctx context.Context, nodeID string, parentID string) error {
    query := `
        INSERT INTO node_parents (node_id, parent_id)
        VALUES ($1, $2)
        ON CONFLICT (node_id, parent_id) DO NOTHING
    `
    result, err := r.db.Pool.Exec(ctx, query, nodeID, parentID)
    if err != nil {
        return fmt.Errorf("failed to add parent: %w", err)
    }
    if result.RowsAffected() == 0 {
        return node.ErrAlreadyParent
    }
    slog.Info("parent added", "nodeID", nodeID, "parentID", parentID)
    return nil
}

// ==================== RemoveParentID ====================

func (r *NodeRepo) RemoveParentID(ctx context.Context, nodeID string, parentID string) error {
    result, err := r.db.Pool.Exec(ctx,
        `DELETE FROM node_parents WHERE node_id = $1 AND parent_id = $2`,
        nodeID, parentID,
    )
    if err != nil {
        return fmt.Errorf("failed to remove parent: %w", err)
    }
    if result.RowsAffected() == 0 {
        return node.ErrNotAParent
    }
    slog.Info("parent removed", "nodeID", nodeID, "parentID", parentID)
    return nil
}

// ==================== FindParentIDsByNodeIDs ====================

func (r *NodeRepo) FindParentIDsByNodeIDs(ctx context.Context, nodeIDs []string) (map[string][]string, error) {
    if len(nodeIDs) == 0 {
        return make(map[string][]string), nil
    }

    query := `
        SELECT node_id, parent_id
        FROM node_parents
        WHERE node_id = ANY($1)
        ORDER BY created_at ASC
    `
    rows, err := r.db.Pool.Query(ctx, query, nodeIDs)
    if err != nil {
        return nil, fmt.Errorf("failed to find parent ids: %w", err)
    }
    defer rows.Close()

    result := make(map[string][]string)
    for rows.Next() {
        var nID, pID string
        if err := rows.Scan(&nID, &pID); err != nil {
            return nil, fmt.Errorf("failed to scan parent id: %w", err)
        }
        result[nID] = append(result[nID], pID)
    }

    return result, nil
}

// ==================== GetMaxSiblingOrder ====================

func (r *NodeRepo) GetMaxSiblingOrder(ctx context.Context, treeID string, parentID *string) (int, error) {
    var maxOrder int

    var err error
    if parentID == nil {
        // Root level
        err = r.db.Pool.QueryRow(ctx,
            `SELECT COALESCE(MAX(sibling_order), -1) FROM nodes WHERE tree_id = $1 AND parent_id IS NULL`,
            treeID,
        ).Scan(&maxOrder)
    } else {
        // Under specific parent
        err = r.db.Pool.QueryRow(ctx,
            `SELECT COALESCE(MAX(sibling_order), -1) FROM nodes WHERE tree_id = $1 AND parent_id = $2`,
            treeID, *parentID,
        ).Scan(&maxOrder)
    }

    if err != nil {
        return 0, fmt.Errorf("failed to get max sibling order: %w", err)
    }

    return maxOrder, nil
}