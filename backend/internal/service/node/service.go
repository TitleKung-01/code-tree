package node

import (
    "context"
    "errors"
    "log/slog"

    "connectrpc.com/connect"

    nodev1 "github.com/TitleKung-01/code-tree-backend/gen/node/v1"
    "github.com/TitleKung-01/code-tree-backend/internal/domain/node"
    "github.com/TitleKung-01/code-tree-backend/internal/domain/tree"
    "github.com/TitleKung-01/code-tree-backend/internal/middleware"
)

type Service struct {
    nodeRepo node.Repository
    treeRepo tree.Repository
}

func NewService(nodeRepo node.Repository, treeRepo tree.Repository) *Service {
    return &Service{
        nodeRepo: nodeRepo,
        treeRepo: treeRepo,
    }
}

// ==================== CreateNode ====================

func (s *Service) CreateNode(
    ctx context.Context,
    req *connect.Request[nodev1.CreateNodeRequest],
) (*connect.Response[nodev1.CreateNodeResponse], error) {

    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    // Validate input
    if req.Msg.TreeId == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrTreeIDRequired)
    }
    if req.Msg.Nickname == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrNoNickname)
    }

    // ตรวจสอบว่า user เป็นเจ้าของ tree
    t, err := s.treeRepo.FindByID(ctx, req.Msg.TreeId)
    if err != nil {
        if errors.Is(err, tree.ErrTreeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }
    if t.CreatedBy != userID {
        return nil, connect.NewError(connect.CodePermissionDenied, tree.ErrUnauthorized)
    }

    // คำนวณ generation จาก parent
    var parentID *string
    generation := 1 // default root

    if req.Msg.ParentId != nil && *req.Msg.ParentId != "" {
        pid := *req.Msg.ParentId
        parentID = &pid

        // หา parent node
        parentNode, err := s.nodeRepo.FindByID(ctx, pid)
        if err != nil {
            if errors.Is(err, node.ErrNodeNotFound) {
                return nil, connect.NewError(connect.CodeNotFound, node.ErrParentNotFound)
            }
            return nil, connect.NewError(connect.CodeInternal, err)
        }

        // ตรวจว่า parent อยู่ tree เดียวกัน
        if parentNode.TreeID != req.Msg.TreeId {
            return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrCrossTreeMove)
        }

        generation = node.CalculateGeneration(parentNode)
    }

    // คำนวณ sibling_order (ใส่ท้ายสุด)
    maxOrder, err := s.nodeRepo.GetMaxSiblingOrder(ctx, req.Msg.TreeId, parentID)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // แปลง proto status → domain status
    status := protoStatusToDomain(req.Msg.Status)

    // สร้าง node
    n := &node.Node{
        TreeID:       req.Msg.TreeId,
        ParentID:     parentID,
        SiblingOrder: maxOrder + 1,
        Nickname:     req.Msg.Nickname,
        FirstName:    req.Msg.FirstName,
        LastName:     req.Msg.LastName,
        StudentID:    req.Msg.StudentId,
        Generation:   generation,
        PhotoURL:     req.Msg.PhotoUrl,
        Status:       status,
    }

    if err := s.nodeRepo.Create(ctx, n); err != nil {
        slog.Error("failed to create node", "error", err)
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    return connect.NewResponse(&nodev1.CreateNodeResponse{
        Node: domainToProto(n),
    }), nil
}

// ==================== UpdateNode ====================

func (s *Service) UpdateNode(
    ctx context.Context,
    req *connect.Request[nodev1.UpdateNodeRequest],
) (*connect.Response[nodev1.UpdateNodeResponse], error) {

    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    if req.Msg.Id == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("node id is required"))
    }
    if req.Msg.Nickname == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrNoNickname)
    }

    // หา node เดิม
    existing, err := s.nodeRepo.FindByID(ctx, req.Msg.Id)
    if err != nil {
        if errors.Is(err, node.ErrNodeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // ตรวจสอบ ownership
    t, err := s.treeRepo.FindByID(ctx, existing.TreeID)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }
    if t.CreatedBy != userID {
        return nil, connect.NewError(connect.CodePermissionDenied, tree.ErrUnauthorized)
    }

    // อัปเดตข้อมูล
    existing.Nickname = req.Msg.Nickname
    existing.FirstName = req.Msg.FirstName
    existing.LastName = req.Msg.LastName
    existing.StudentID = req.Msg.StudentId
    existing.PhotoURL = req.Msg.PhotoUrl
    existing.Status = protoStatusToDomain(req.Msg.Status)

    if err := s.nodeRepo.Update(ctx, existing); err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    return connect.NewResponse(&nodev1.UpdateNodeResponse{
        Node: domainToProto(existing),
    }), nil
}

// ==================== DeleteNode ====================

func (s *Service) DeleteNode(
    ctx context.Context,
    req *connect.Request[nodev1.DeleteNodeRequest],
) (*connect.Response[nodev1.DeleteNodeResponse], error) {

    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    if req.Msg.Id == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("node id is required"))
    }

    // หา node
    existing, err := s.nodeRepo.FindByID(ctx, req.Msg.Id)
    if err != nil {
        if errors.Is(err, node.ErrNodeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // ตรวจสอบ ownership
    t, err := s.treeRepo.FindByID(ctx, existing.TreeID)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }
    if t.CreatedBy != userID {
        return nil, connect.NewError(connect.CodePermissionDenied, tree.ErrUnauthorized)
    }

    // ลบ node + descendants
    if err := s.nodeRepo.Delete(ctx, req.Msg.Id); err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    return connect.NewResponse(&nodev1.DeleteNodeResponse{}), nil
}

// ==================== GetTreeNodes ====================

func (s *Service) GetTreeNodes(
    ctx context.Context,
    req *connect.Request[nodev1.GetTreeNodesRequest],
) (*connect.Response[nodev1.GetTreeNodesResponse], error) {

    if req.Msg.TreeId == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrTreeIDRequired)
    }

    // ตรวจ tree มีอยู่จริง
    _, err := s.treeRepo.FindByID(ctx, req.Msg.TreeId)
    if err != nil {
        if errors.Is(err, tree.ErrTreeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // ดึง nodes ทั้งหมด
    nodes, err := s.nodeRepo.FindByTreeID(ctx, req.Msg.TreeId)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // ดึง parent_ids จาก node_parents table (multi-parent)
    nodeIDs := make([]string, len(nodes))
    for i, n := range nodes {
        nodeIDs[i] = n.ID
    }
    parentIDsMap, err := s.nodeRepo.FindParentIDsByNodeIDs(ctx, nodeIDs)
    if err != nil {
        slog.Warn("failed to load parent_ids from node_parents, using fallback", "error", err)
        parentIDsMap = make(map[string][]string)
    }

    // เติม ParentIDs ลง domain nodes
    for _, n := range nodes {
        if pids, ok := parentIDsMap[n.ID]; ok && len(pids) > 0 {
            n.ParentIDs = pids
        } else if n.ParentID != nil {
            n.ParentIDs = []string{*n.ParentID}
        }
    }

    // แปลง domain → proto
    protoNodes := make([]*nodev1.Node, len(nodes))
    for i, n := range nodes {
        protoNodes[i] = domainToProto(n)
    }

    return connect.NewResponse(&nodev1.GetTreeNodesResponse{
        Nodes: protoNodes,
    }), nil
}

// ==================== MoveNode (placeholder) ====================

func (s *Service) MoveNode(
    ctx context.Context,
    req *connect.Request[nodev1.MoveNodeRequest],
) (*connect.Response[nodev1.MoveNodeResponse], error) {

    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    if req.Msg.NodeId == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("node_id is required"))
    }
    if req.Msg.NewParentId == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("new_parent_id is required"))
    }

    // หา node ที่จะย้าย
    n, err := s.nodeRepo.FindByID(ctx, req.Msg.NodeId)
    if err != nil {
        if errors.Is(err, node.ErrNodeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // ตรวจ ownership
    t, err := s.treeRepo.FindByID(ctx, n.TreeID)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }
    if t.CreatedBy != userID {
        return nil, connect.NewError(connect.CodePermissionDenied, tree.ErrUnauthorized)
    }

    // หา new parent
    newParent, err := s.nodeRepo.FindByID(ctx, req.Msg.NewParentId)
    if err != nil {
        if errors.Is(err, node.ErrNodeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, node.ErrParentNotFound)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // ===== Validations =====

    // 1. ห้ามย้ายไปเป็น child ตัวเอง
    if req.Msg.NodeId == req.Msg.NewParentId {
        return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrSelfParent)
    }

    // 2. ห้ามย้ายข้าม tree
    if n.TreeID != newParent.TreeID {
        return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrCrossTreeMove)
    }

    // 3. ห้ามย้ายไป descendant ของตัวเอง (circular reference)
    descendantIDs, err := s.nodeRepo.FindDescendantIDs(ctx, req.Msg.NodeId)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }
    for _, dID := range descendantIDs {
        if dID == req.Msg.NewParentId {
            return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrCircularReference)
        }
    }

    // ===== Move =====
    newGeneration := node.CalculateGeneration(newParent)
    newParentID := req.Msg.NewParentId

    if err := s.nodeRepo.UpdateParent(ctx, req.Msg.NodeId, &newParentID, newGeneration); err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // ดึง node ที่อัปเดตแล้ว
    updated, err := s.nodeRepo.FindByID(ctx, req.Msg.NodeId)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    return connect.NewResponse(&nodev1.MoveNodeResponse{
        Node: domainToProto(updated),
    }), nil
}

// ==================== Helpers ====================

func domainToProto(n *node.Node) *nodev1.Node {
    pn := &nodev1.Node{
        Id:           n.ID,
        TreeId:       n.TreeID,
        Nickname:     n.Nickname,
        FirstName:    n.FirstName,
        LastName:     n.LastName,
        StudentId:    n.StudentID,
        Generation:   int32(n.Generation),
        PhotoUrl:     n.PhotoURL,
        Status:       domainStatusToProto(n.Status),
        SiblingOrder: int32(n.SiblingOrder),
        PositionX:    n.PositionX,
        PositionY:    n.PositionY,
        CreatedAt:    n.CreatedAt.Format("2006-01-02T15:04:05Z"),
        UpdatedAt:    n.UpdatedAt.Format("2006-01-02T15:04:05Z"),
        ParentIds:    n.ParentIDs,
    }

    if n.ParentID != nil {
        pn.ParentId = n.ParentID
    }

    return pn
}

func protoStatusToDomain(s nodev1.NodeStatus) node.Status {
    switch s {
    case nodev1.NodeStatus_NODE_STATUS_GRADUATED:
        return node.StatusGraduated
    case nodev1.NodeStatus_NODE_STATUS_RETIRED:
        return node.StatusRetired
    default:
        return node.StatusStudying
    }
}

func domainStatusToProto(s node.Status) nodev1.NodeStatus {
    switch s {
    case node.StatusGraduated:
        return nodev1.NodeStatus_NODE_STATUS_GRADUATED
    case node.StatusRetired:
        return nodev1.NodeStatus_NODE_STATUS_RETIRED
    default:
        return nodev1.NodeStatus_NODE_STATUS_STUDYING
    }
}

// ==================== AddParent (เพิ่มพี่ให้ node - multi-parent) ====================

func (s *Service) AddParent(
    ctx context.Context,
    req *connect.Request[nodev1.AddParentRequest],
) (*connect.Response[nodev1.AddParentResponse], error) {

    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    if req.Msg.NodeId == "" || req.Msg.ParentId == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("node_id and parent_id are required"))
    }

    // ห้ามเป็น parent ตัวเอง
    if req.Msg.NodeId == req.Msg.ParentId {
        return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrSelfParent)
    }

    // หา node
    n, err := s.nodeRepo.FindByID(ctx, req.Msg.NodeId)
    if err != nil {
        if errors.Is(err, node.ErrNodeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // หา parent
    parentNode, err := s.nodeRepo.FindByID(ctx, req.Msg.ParentId)
    if err != nil {
        if errors.Is(err, node.ErrNodeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, node.ErrParentNotFound)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // ตรวจ ownership
    t, err := s.treeRepo.FindByID(ctx, n.TreeID)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }
    if t.CreatedBy != userID {
        return nil, connect.NewError(connect.CodePermissionDenied, tree.ErrUnauthorized)
    }

    // ห้ามข้าม tree
    if n.TreeID != parentNode.TreeID {
        return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrCrossTreeMove)
    }

    // ห้าม circular reference
    descendantIDs, err := s.nodeRepo.FindDescendantIDs(ctx, req.Msg.NodeId)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }
    for _, dID := range descendantIDs {
        if dID == req.Msg.ParentId {
            return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrCircularReference)
        }
    }

    // เพิ่ม parent ลง node_parents table
    if err := s.nodeRepo.AddParentID(ctx, req.Msg.NodeId, req.Msg.ParentId); err != nil {
        if errors.Is(err, node.ErrAlreadyParent) {
            return nil, connect.NewError(connect.CodeAlreadyExists, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // ถ้า node ยังไม่มี primary parent → ตั้งค่า parent_id ใน nodes table ด้วย
    if n.ParentID == nil {
        newGen := node.CalculateGeneration(parentNode)
        pid := req.Msg.ParentId
        if err := s.nodeRepo.UpdateParent(ctx, req.Msg.NodeId, &pid, newGen); err != nil {
            return nil, connect.NewError(connect.CodeInternal, err)
        }
    }

    // ดึง node ที่อัปเดตแล้ว
    updated, err := s.nodeRepo.FindByID(ctx, req.Msg.NodeId)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // เติม parent_ids
    pidsMap, _ := s.nodeRepo.FindParentIDsByNodeIDs(ctx, []string{updated.ID})
    if pids, ok := pidsMap[updated.ID]; ok {
        updated.ParentIDs = pids
    }

    return connect.NewResponse(&nodev1.AddParentResponse{
        Node: domainToProto(updated),
    }), nil
}

// ==================== RemoveParent (ตัดสายจาก parent เฉพาะตัว) ====================

func (s *Service) RemoveParent(
    ctx context.Context,
    req *connect.Request[nodev1.RemoveParentRequest],
) (*connect.Response[nodev1.RemoveParentResponse], error) {

    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    if req.Msg.NodeId == "" || req.Msg.ParentId == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("node_id and parent_id are required"))
    }

    // หา node
    n, err := s.nodeRepo.FindByID(ctx, req.Msg.NodeId)
    if err != nil {
        if errors.Is(err, node.ErrNodeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // ตรวจ ownership
    t, err := s.treeRepo.FindByID(ctx, n.TreeID)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }
    if t.CreatedBy != userID {
        return nil, connect.NewError(connect.CodePermissionDenied, tree.ErrUnauthorized)
    }

    // ลบ parent จาก node_parents table
    if err := s.nodeRepo.RemoveParentID(ctx, req.Msg.NodeId, req.Msg.ParentId); err != nil {
        if errors.Is(err, node.ErrNotAParent) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // ดึง parent_ids ที่เหลือ
    pidsMap, err := s.nodeRepo.FindParentIDsByNodeIDs(ctx, []string{req.Msg.NodeId})
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }
    remainingPIDs := pidsMap[req.Msg.NodeId]

    // อัปเดต primary parent_id ใน nodes table
    if len(remainingPIDs) == 0 {
        // ไม่เหลือ parent → เป็น root
        if err := s.nodeRepo.UpdateParent(ctx, req.Msg.NodeId, nil, 1); err != nil {
            return nil, connect.NewError(connect.CodeInternal, err)
        }
    } else if n.ParentID != nil && *n.ParentID == req.Msg.ParentId {
        // ถ้า primary parent ถูกลบ → ใช้ parent ตัวถัดไปแทน
        firstRemaining := remainingPIDs[0]
        remainingParent, err := s.nodeRepo.FindByID(ctx, firstRemaining)
        if err != nil {
            return nil, connect.NewError(connect.CodeInternal, err)
        }
        newGen := node.CalculateGeneration(remainingParent)
        if err := s.nodeRepo.UpdateParent(ctx, req.Msg.NodeId, &firstRemaining, newGen); err != nil {
            return nil, connect.NewError(connect.CodeInternal, err)
        }
    }

    // ดึง node ที่อัปเดตแล้ว
    updated, err := s.nodeRepo.FindByID(ctx, req.Msg.NodeId)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }
    updated.ParentIDs = remainingPIDs

    return connect.NewResponse(&nodev1.RemoveParentResponse{
        Node: domainToProto(updated),
    }), nil
}

// ==================== UnlinkNode ====================

func (s *Service) UnlinkNode(
    ctx context.Context,
    req *connect.Request[nodev1.UnlinkNodeRequest],
) (*connect.Response[nodev1.UnlinkNodeResponse], error) {

    userID, err := middleware.GetUserID(ctx)
    if err != nil {
        return nil, connect.NewError(connect.CodeUnauthenticated, err)
    }

    if req.Msg.NodeId == "" {
        return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("node_id is required"))
    }

    // หา node
    n, err := s.nodeRepo.FindByID(ctx, req.Msg.NodeId)
    if err != nil {
        if errors.Is(err, node.ErrNodeNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    // ตรวจ ownership
    t, err := s.treeRepo.FindByID(ctx, n.TreeID)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }
    if t.CreatedBy != userID {
        return nil, connect.NewError(connect.CodePermissionDenied, tree.ErrUnauthorized)
    }

    // ถ้าเป็น root อยู่แล้ว → ไม่ต้องทำอะไร
    if n.IsRoot() {
        return connect.NewResponse(&nodev1.UnlinkNodeResponse{
            Node: domainToProto(n),
        }), nil
    }

    // Set parent = nil, generation = 1
    if err := s.nodeRepo.UpdateParent(ctx, req.Msg.NodeId, nil, 1); err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    updated, err := s.nodeRepo.FindByID(ctx, req.Msg.NodeId)
    if err != nil {
        return nil, connect.NewError(connect.CodeInternal, err)
    }

    return connect.NewResponse(&nodev1.UnlinkNodeResponse{
        Node: domainToProto(updated),
    }), nil
}