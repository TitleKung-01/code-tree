package tree

import (
    "context"
    "errors"
    "log/slog"

    "connectrpc.com/connect"

    treev1 "github.com/TitleKung-01/code-tree-backend/gen/tree/v1"
    "github.com/TitleKung-01/code-tree-backend/internal/domain/tree"
    "github.com/TitleKung-01/code-tree-backend/internal/middleware"
)

type Service struct {
    repo tree.Repository
}

func NewService(repo tree.Repository) *Service {
    return &Service{repo: repo}
}

// ==================== CreateTree ====================

func (s *Service) CreateTree(
    ctx context.Context,
    req *connect.Request[treev1.CreateTreeRequest],
) (*connect.Response[treev1.CreateTreeResponse], error) {

    // ดึง user ID จาก context (JWT middleware ใส่ให้)
    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    // Validate
    if req.Msg.Name == "" {
        return nil, connect.NewError(
            connect.CodeInvalidArgument,
            tree.ErrTreeNoName,
        )
    }

    // สร้าง domain entity
    t := &tree.Tree{
        Name:        req.Msg.Name,
        Description: req.Msg.Description,
        Faculty:     req.Msg.Faculty,
        Department:  req.Msg.Department,
        CreatedBy:   userID,
    }

    // Save to DB
    if err := s.repo.Create(ctx, t); err != nil {
        slog.Error("failed to create tree", "error", err)
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // Return response
    return connect.NewResponse(&treev1.CreateTreeResponse{
        Tree: domainToProto(t),
    }), nil
}

// ==================== GetTree ====================

func (s *Service) GetTree(
    ctx context.Context,
    req *connect.Request[treev1.GetTreeRequest],
) (*connect.Response[treev1.GetTreeResponse], error) {

    if req.Msg.Id == "" {
        return nil, connect.NewError(
            connect.CodeInvalidArgument,
            errors.New("tree id is required"),
        )
    }

    t, err := s.repo.FindByID(ctx, req.Msg.Id)
    if err != nil {
        if errors.Is(err, tree.ErrTreeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    return connect.NewResponse(&treev1.GetTreeResponse{
        Tree: domainToProto(t),
    }), nil
}

// ==================== ListMyTrees ====================

func (s *Service) ListMyTrees(
    ctx context.Context,
    req *connect.Request[treev1.ListMyTreesRequest],
) (*connect.Response[treev1.ListMyTreesResponse], error) {

    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    trees, err := s.repo.ListByUser(ctx, userID)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // แปลง domain → proto
    protoTrees := make([]*treev1.Tree, len(trees))
    for i, t := range trees {
        protoTrees[i] = domainToProto(t)
    }

    return connect.NewResponse(&treev1.ListMyTreesResponse{
        Trees: protoTrees,
    }), nil
}

// ==================== DeleteTree ====================

func (s *Service) DeleteTree(
    ctx context.Context,
    req *connect.Request[treev1.DeleteTreeRequest],
) (*connect.Response[treev1.DeleteTreeResponse], error) {

    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    // ตรวจสอบว่าเป็นเจ้าของ
    t, err := s.repo.FindByID(ctx, req.Msg.Id)
    if err != nil {
        if errors.Is(err, tree.ErrTreeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    if t.CreatedBy != userID {
        return nil, connect.NewError(
            connect.CodePermissionDenied,
            tree.ErrUnauthorized,
        )
    }

    // ลบ (cascade ลบ nodes ด้วย เพราะ ON DELETE CASCADE)
    if err := s.repo.Delete(ctx, req.Msg.Id); err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    return connect.NewResponse(&treev1.DeleteTreeResponse{}), nil
}

// ==================== Helper: Domain → Proto ====================

func domainToProto(t *tree.Tree) *treev1.Tree {
    return &treev1.Tree{
        Id:          t.ID,
        Name:        t.Name,
        Description: t.Description,
        Faculty:     t.Faculty,
        Department:  t.Department,
        CreatedBy:   t.CreatedBy,
        CreatedAt:   t.CreatedAt.Format("2006-01-02T15:04:05Z"),
        UpdatedAt:   t.UpdatedAt.Format("2006-01-02T15:04:05Z"),
    }
}