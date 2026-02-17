package tree

import (
    "context"
    "errors"
    "log/slog"

    "connectrpc.com/connect"

    treev1 "github.com/TitleKung-01/code-tree-backend/gen/tree/v1"
    "github.com/TitleKung-01/code-tree-backend/internal/domain/share"
    "github.com/TitleKung-01/code-tree-backend/internal/domain/tree"
    "github.com/TitleKung-01/code-tree-backend/internal/middleware"
)

type Service struct {
    repo      tree.Repository
    shareRepo share.Repository
}

func NewService(repo tree.Repository, shareRepo share.Repository) *Service {
    return &Service{repo: repo, shareRepo: shareRepo}
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

    proto := domainToProto(t)

    // ใส่ my_role ให้ response
    userID, _ := middleware.GetUserID(ctx)
    if userID != "" {
        proto.MyRole = s.resolveMyRole(ctx, t, userID)
    }

    return connect.NewResponse(&treev1.GetTreeResponse{
        Tree: proto,
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

    // แปลง domain → proto (ใส่ my_role = OWNER เพราะเป็น tree ของตัวเอง)
    protoTrees := make([]*treev1.Tree, len(trees))
    for i, t := range trees {
        proto := domainToProto(t)
        proto.MyRole = treev1.ShareRole_SHARE_ROLE_OWNER
        protoTrees[i] = proto
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

// ==================== ShareTree ====================

func (s *Service) ShareTree(
    ctx context.Context,
    req *connect.Request[treev1.ShareTreeRequest],
) (*connect.Response[treev1.ShareTreeResponse], error) {

    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    if req.Msg.TreeId == "" || req.Msg.Email == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("tree_id and email are required"))
    }

    // ตรวจ role
    role := protoRoleToDomain(req.Msg.Role)
    if !role.IsValid() {
        return nil, connect.NewError(connect.CodeInvalidArgument, share.ErrInvalidRole)
    }

    // ตรวจว่าเป็นเจ้าของ tree
    t, err := s.repo.FindByID(ctx, req.Msg.TreeId)
    if err != nil {
        if errors.Is(err, tree.ErrTreeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    if !s.isTreeOwnerOrShareOwner(ctx, t, userID) {
        return nil, connect.NewError(connect.CodePermissionDenied, share.ErrNotShareOwner)
    }

    // หา user จาก email
    targetUserID, err := s.shareRepo.FindUserByEmail(ctx, req.Msg.Email)
    if err != nil {
        if errors.Is(err, share.ErrUserNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, share.ErrUserNotFound)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // ห้ามแชร์ให้ตัวเอง
    if targetUserID == userID {
        return nil, connect.NewError(connect.CodeInvalidArgument, share.ErrCannotShareSelf)
    }

    // สร้าง share
    ts := &share.TreeShare{
        TreeID:    req.Msg.TreeId,
        UserID:    targetUserID,
        Role:      role,
        InvitedBy: &userID,
    }

    if err := s.shareRepo.Create(ctx, ts); err != nil {
        if errors.Is(err, share.ErrAlreadyShared) {
            return nil, connect.NewError(connect.CodeAlreadyExists, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // ดึงข้อมูล user profile กลับมาด้วย
    fullShare, err := s.shareRepo.FindByTreeAndUser(ctx, req.Msg.TreeId, targetUserID)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    return connect.NewResponse(&treev1.ShareTreeResponse{
        Share: shareToProto(fullShare),
    }), nil
}

// ==================== UpdateShare ====================

func (s *Service) UpdateShare(
    ctx context.Context,
    req *connect.Request[treev1.UpdateShareRequest],
) (*connect.Response[treev1.UpdateShareResponse], error) {

    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    if req.Msg.TreeId == "" || req.Msg.UserId == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("tree_id and user_id are required"))
    }

    role := protoRoleToDomain(req.Msg.Role)
    if !role.IsValid() {
        return nil, connect.NewError(connect.CodeInvalidArgument, share.ErrInvalidRole)
    }

    t, err := s.repo.FindByID(ctx, req.Msg.TreeId)
    if err != nil {
        if errors.Is(err, tree.ErrTreeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    if !s.isTreeOwnerOrShareOwner(ctx, t, userID) {
        return nil, connect.NewError(connect.CodePermissionDenied, share.ErrNotShareOwner)
    }

    updated, err := s.shareRepo.UpdateRole(ctx, req.Msg.TreeId, req.Msg.UserId, role)
    if err != nil {
        if errors.Is(err, share.ErrShareNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    fullShare, err := s.shareRepo.FindByTreeAndUser(ctx, req.Msg.TreeId, req.Msg.UserId)
    if err != nil {
        fullShare = updated
    }

    return connect.NewResponse(&treev1.UpdateShareResponse{
        Share: shareToProto(fullShare),
    }), nil
}

// ==================== RemoveShare ====================

func (s *Service) RemoveShare(
    ctx context.Context,
    req *connect.Request[treev1.RemoveShareRequest],
) (*connect.Response[treev1.RemoveShareResponse], error) {

    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    if req.Msg.TreeId == "" || req.Msg.UserId == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("tree_id and user_id are required"))
    }

    t, err := s.repo.FindByID(ctx, req.Msg.TreeId)
    if err != nil {
        if errors.Is(err, tree.ErrTreeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // อนุญาตให้: เจ้าของ tree, share owner, หรือ user ลบตัวเอง (ออกจากแชร์)
    isSelf := req.Msg.UserId == userID
    if !isSelf && !s.isTreeOwnerOrShareOwner(ctx, t, userID) {
        return nil, connect.NewError(connect.CodePermissionDenied, share.ErrNotShareOwner)
    }

    if err := s.shareRepo.Delete(ctx, req.Msg.TreeId, req.Msg.UserId); err != nil {
        if errors.Is(err, share.ErrShareNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    return connect.NewResponse(&treev1.RemoveShareResponse{}), nil
}

// ==================== ListTreeShares ====================

func (s *Service) ListTreeShares(
    ctx context.Context,
    req *connect.Request[treev1.ListTreeSharesRequest],
) (*connect.Response[treev1.ListTreeSharesResponse], error) {

    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    if req.Msg.TreeId == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("tree_id is required"))
    }

    // ตรวจว่ามีสิทธิ์ดูรายการแชร์ (เจ้าของ หรือ ถูกแชร์)
    t, err := s.repo.FindByID(ctx, req.Msg.TreeId)
    if err != nil {
        if errors.Is(err, tree.ErrTreeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    hasAccess := t.CreatedBy == userID
    if !hasAccess {
        _, err := s.shareRepo.GetUserRole(ctx, req.Msg.TreeId, userID)
        hasAccess = err == nil
    }
    if !hasAccess {
        return nil, connect.NewError(connect.CodePermissionDenied, tree.ErrUnauthorized)
    }

    shares, err := s.shareRepo.ListByTree(ctx, req.Msg.TreeId)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    protoShares := make([]*treev1.TreeShare, len(shares))
    for i, sh := range shares {
        protoShares[i] = shareToProto(sh)
    }

    return connect.NewResponse(&treev1.ListTreeSharesResponse{
        Shares: protoShares,
    }), nil
}

// ==================== ListSharedWithMe ====================

func (s *Service) ListSharedWithMe(
    ctx context.Context,
    req *connect.Request[treev1.ListSharedWithMeRequest],
) (*connect.Response[treev1.ListSharedWithMeResponse], error) {

    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    treeIDs, err := s.shareRepo.ListTreeIDsByUser(ctx, userID)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    if len(treeIDs) == 0 {
        return connect.NewResponse(&treev1.ListSharedWithMeResponse{
            Trees: []*treev1.Tree{},
        }), nil
    }

    trees, err := s.repo.FindByIDs(ctx, treeIDs)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    protoTrees := make([]*treev1.Tree, len(trees))
    for i, t := range trees {
        proto := domainToProto(t)
        // ใส่ role สำหรับแต่ละ tree
        role, err := s.shareRepo.GetUserRole(ctx, t.ID, userID)
        if err == nil {
            proto.MyRole = domainRoleToProto(role)
        }
        protoTrees[i] = proto
    }

    return connect.NewResponse(&treev1.ListSharedWithMeResponse{
        Trees: protoTrees,
    }), nil
}

// ==================== GetMyRole ====================

func (s *Service) GetMyRole(
    ctx context.Context,
    req *connect.Request[treev1.GetMyRoleRequest],
) (*connect.Response[treev1.GetMyRoleResponse], error) {

    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    if req.Msg.TreeId == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("tree_id is required"))
    }

    t, err := s.repo.FindByID(ctx, req.Msg.TreeId)
    if err != nil {
        if errors.Is(err, tree.ErrTreeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    isCreator := t.CreatedBy == userID
    myRole := s.resolveMyRole(ctx, t, userID)

    return connect.NewResponse(&treev1.GetMyRoleResponse{
        Role:      myRole,
        IsCreator: isCreator,
    }), nil
}

// ==================== GenerateShareLink ====================

func (s *Service) GenerateShareLink(
    ctx context.Context,
    req *connect.Request[treev1.GenerateShareLinkRequest],
) (*connect.Response[treev1.GenerateShareLinkResponse], error) {

    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    if req.Msg.TreeId == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("tree_id is required"))
    }

    t, err := s.repo.FindByID(ctx, req.Msg.TreeId)
    if err != nil {
        if errors.Is(err, tree.ErrTreeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    if !s.isTreeOwnerOrShareOwner(ctx, t, userID) {
        return nil, connect.NewError(connect.CodePermissionDenied, tree.ErrUnauthorized)
    }

    token, err := s.repo.GenerateShareToken(ctx, req.Msg.TreeId)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    return connect.NewResponse(&treev1.GenerateShareLinkResponse{
        ShareToken: token,
        ShareUrl:   "/share/" + token,
    }), nil
}

// ==================== GetTreeByShareToken ====================

func (s *Service) GetTreeByShareToken(
    ctx context.Context,
    req *connect.Request[treev1.GetTreeByShareTokenRequest],
) (*connect.Response[treev1.GetTreeByShareTokenResponse], error) {

    if req.Msg.ShareToken == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("share_token is required"))
    }

    t, err := s.repo.FindByShareToken(ctx, req.Msg.ShareToken)
    if err != nil {
        if errors.Is(err, tree.ErrTreeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    proto := domainToProto(t)
    proto.MyRole = treev1.ShareRole_SHARE_ROLE_VIEWER

    return connect.NewResponse(&treev1.GetTreeByShareTokenResponse{
        Tree: proto,
    }), nil
}

// ==================== Helpers ====================

// resolveMyRole คำนวณ role ที่ user มีกับ tree
func (s *Service) resolveMyRole(ctx context.Context, t *tree.Tree, userID string) treev1.ShareRole {
    if t.CreatedBy == userID {
        return treev1.ShareRole_SHARE_ROLE_OWNER
    }

    role, err := s.shareRepo.GetUserRole(ctx, t.ID, userID)
    if err != nil {
        if t.IsPublic {
            return treev1.ShareRole_SHARE_ROLE_VIEWER
        }
        return treev1.ShareRole_SHARE_ROLE_UNSPECIFIED
    }

    return domainRoleToProto(role)
}

// isTreeOwnerOrShareOwner ตรวจว่า user เป็น creator หรือ co-owner
func (s *Service) isTreeOwnerOrShareOwner(ctx context.Context, t *tree.Tree, userID string) bool {
    if t.CreatedBy == userID {
        return true
    }
    role, err := s.shareRepo.GetUserRole(ctx, t.ID, userID)
    if err != nil {
        return false
    }
    return role == share.RoleOwner
}

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

func shareToProto(s *share.TreeShare) *treev1.TreeShare {
    return &treev1.TreeShare{
        Id:              s.ID,
        TreeId:          s.TreeID,
        UserId:          s.UserID,
        Role:            domainRoleToProto(s.Role),
        UserEmail:       s.UserEmail,
        UserDisplayName: s.UserDisplayName,
        UserAvatarUrl:   s.UserAvatarURL,
        InvitedBy:       stringPtrToString(s.InvitedBy),
        CreatedAt:       s.CreatedAt.Format("2006-01-02T15:04:05Z"),
    }
}

func domainRoleToProto(r share.Role) treev1.ShareRole {
    switch r {
    case share.RoleViewer:
        return treev1.ShareRole_SHARE_ROLE_VIEWER
    case share.RoleEditor:
        return treev1.ShareRole_SHARE_ROLE_EDITOR
    case share.RoleOwner:
        return treev1.ShareRole_SHARE_ROLE_OWNER
    default:
        return treev1.ShareRole_SHARE_ROLE_UNSPECIFIED
    }
}

func protoRoleToDomain(r treev1.ShareRole) share.Role {
    switch r {
    case treev1.ShareRole_SHARE_ROLE_VIEWER:
        return share.RoleViewer
    case treev1.ShareRole_SHARE_ROLE_EDITOR:
        return share.RoleEditor
    case treev1.ShareRole_SHARE_ROLE_OWNER:
        return share.RoleOwner
    default:
        return ""
    }
}

func stringPtrToString(s *string) string {
    if s == nil {
        return ""
    }
    return *s
}