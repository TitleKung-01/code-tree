package node

import (
	"context"
	"errors"
	"log/slog"

	"connectrpc.com/connect"

	nodev1 "github.com/TitleKung-01/code-tree-backend/gen/node/v1"
	"github.com/TitleKung-01/code-tree-backend/internal/domain/node"
	"github.com/TitleKung-01/code-tree-backend/internal/domain/share"
	"github.com/TitleKung-01/code-tree-backend/internal/domain/tree"
	"github.com/TitleKung-01/code-tree-backend/internal/middleware"
)

type Service struct {
	nodeRepo  node.Repository
	treeRepo  tree.Repository
	shareRepo share.Repository
}

func NewService(nodeRepo node.Repository, treeRepo tree.Repository, shareRepo share.Repository) *Service {
	return &Service{
		nodeRepo:  nodeRepo,
		treeRepo:  treeRepo,
		shareRepo: shareRepo,
	}
}

// canEditTree ตรวจว่า user มีสิทธิ์แก้ไข tree (owner, creator, editor)
func (s *Service) canEditTree(ctx context.Context, t *tree.Tree, userID string) bool {
	if t.CreatedBy == userID {
		return true
	}
	role, err := s.shareRepo.GetUserRole(ctx, t.ID, userID)
	if err != nil {
		return false
	}
	return role.CanEdit()
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

	if req.Msg.TreeId == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrTreeIDRequired)
	}
	if req.Msg.Nickname == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrNoNickname)
	}

	t, err := s.treeRepo.FindByID(ctx, req.Msg.TreeId)
	if err != nil {
		if errors.Is(err, tree.ErrTreeNotFound) {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	if !s.canEditTree(ctx, t, userID) {
		return nil, connect.NewError(connect.CodePermissionDenied, tree.ErrUnauthorized)
	}

	// รวม parentIDs จาก parent_ids (multi) หรือ parent_id (single / backward compat)
	parentIDs := req.Msg.ParentIds
	if len(parentIDs) == 0 && req.Msg.ParentId != nil && *req.Msg.ParentId != "" {
		parentIDs = []string{*req.Msg.ParentId}
	}

	// ตรวจ parent ทุกตัวว่าอยู่ tree เดียวกัน + คำนวณรุ่นจาก parent ตัวแรก
	generation := req.Msg.Generation
	for i, pid := range parentIDs {
		parentNode, err := s.nodeRepo.FindByID(ctx, pid)
		if err != nil {
			if errors.Is(err, node.ErrNodeNotFound) {
				return nil, connect.NewError(connect.CodeNotFound, node.ErrParentNotFound)
			}
			return nil, connect.NewError(connect.CodeInternal, err)
		}
		if parentNode.TreeID != req.Msg.TreeId {
			return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrCrossTreeMove)
		}
		if i == 0 {
			generation = parentNode.Generation + 1
		}
	}

	status := protoStatusToDomain(req.Msg.Status)

	n := &node.Node{
		TreeID:     req.Msg.TreeId,
		Nickname:   req.Msg.Nickname,
		FirstName:  req.Msg.FirstName,
		LastName:   req.Msg.LastName,
		StudentID:  req.Msg.StudentId,
		PhotoURL:   req.Msg.PhotoUrl,
		Status:     status,
		Generation: generation,
	}
	n.SetContact(req.Msg.Phone, req.Msg.Email, req.Msg.LineId, req.Msg.Discord, req.Msg.Facebook)

	if err := s.nodeRepo.Create(ctx, n); err != nil {
		slog.Error("failed to create node", "error", err)
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	// เพิ่ม node เข้า tree structure ด้วย parent ตัวแรก (หรือ root)
	var firstParentID *string
	if len(parentIDs) > 0 {
		firstParentID = &parentIDs[0]
	}
	if err := s.treeRepo.AddNodeToStructure(ctx, req.Msg.TreeId, n.ID, firstParentID); err != nil {
		slog.Error("failed to add node to structure", "error", err)
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	// เพิ่ม parent ตัวที่ 2+ (multi-parent)
	if len(parentIDs) > 1 {
		for _, pid := range parentIDs[1:] {
			if err := s.treeRepo.AddChildToParent(ctx, req.Msg.TreeId, n.ID, pid); err != nil {
				slog.Error("failed to add additional parent", "error", err, "parentID", pid)
				return nil, connect.NewError(connect.CodeInternal, err)
			}
		}
	}

	// ดึง structure ใหม่สำหรับ response
	updatedTree, err := s.treeRepo.FindByID(ctx, req.Msg.TreeId)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return connect.NewResponse(&nodev1.CreateNodeResponse{
		Node: domainToProto(n, &updatedTree.Structure),
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

	existing, err := s.nodeRepo.FindByID(ctx, req.Msg.Id)
	if err != nil {
		if errors.Is(err, node.ErrNodeNotFound) {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	t, err := s.treeRepo.FindByID(ctx, existing.TreeID)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	if !s.canEditTree(ctx, t, userID) {
		return nil, connect.NewError(connect.CodePermissionDenied, tree.ErrUnauthorized)
	}

	existing.Nickname = req.Msg.Nickname
	existing.FirstName = req.Msg.FirstName
	existing.LastName = req.Msg.LastName
	existing.StudentID = req.Msg.StudentId
	existing.PhotoURL = req.Msg.PhotoUrl
	existing.Status = protoStatusToDomain(req.Msg.Status)
	existing.Generation = req.Msg.Generation
	existing.SetContact(req.Msg.Phone, req.Msg.Email, req.Msg.LineId, req.Msg.Discord, req.Msg.Facebook)

	if err := s.nodeRepo.Update(ctx, existing); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return connect.NewResponse(&nodev1.UpdateNodeResponse{
		Node: domainToProto(existing, &t.Structure),
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

	existing, err := s.nodeRepo.FindByID(ctx, req.Msg.Id)
	if err != nil {
		if errors.Is(err, node.ErrNodeNotFound) {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	t, err := s.treeRepo.FindByID(ctx, existing.TreeID)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	if !s.canEditTree(ctx, t, userID) {
		return nil, connect.NewError(connect.CodePermissionDenied, tree.ErrUnauthorized)
	}

	// ลบ node ออกจาก structure ก่อน (ย้าย children ขึ้น parent)
	if err := s.treeRepo.RemoveNodeFromStructure(ctx, existing.TreeID, req.Msg.Id); err != nil {
		slog.Error("failed to remove node from structure", "error", err)
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	// ลบ node จาก nodes table
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

	t, err := s.treeRepo.FindByID(ctx, req.Msg.TreeId)
	if err != nil {
		if errors.Is(err, tree.ErrTreeNotFound) {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	nodes, err := s.nodeRepo.FindByTreeID(ctx, req.Msg.TreeId)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	protoNodes := make([]*nodev1.Node, len(nodes))
	for i, n := range nodes {
		protoNodes[i] = domainToProto(n, &t.Structure)
	}

	return connect.NewResponse(&nodev1.GetTreeNodesResponse{
		Nodes: protoNodes,
	}), nil
}

// ==================== MoveNode ====================

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

	n, err := s.nodeRepo.FindByID(ctx, req.Msg.NodeId)
	if err != nil {
		if errors.Is(err, node.ErrNodeNotFound) {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	t, err := s.treeRepo.FindByID(ctx, n.TreeID)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	if !s.canEditTree(ctx, t, userID) {
		return nil, connect.NewError(connect.CodePermissionDenied, tree.ErrUnauthorized)
	}

	newParent, err := s.nodeRepo.FindByID(ctx, req.Msg.NewParentId)
	if err != nil {
		if errors.Is(err, node.ErrNodeNotFound) {
			return nil, connect.NewError(connect.CodeNotFound, node.ErrParentNotFound)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	if req.Msg.NodeId == req.Msg.NewParentId {
		return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrSelfParent)
	}
	if n.TreeID != newParent.TreeID {
		return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrCrossTreeMove)
	}

	// ตรวจ circular reference จาก structure
	if t.Structure.IsDescendant(req.Msg.NodeId, req.Msg.NewParentId) {
		return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrCircularReference)
	}

	newParentID := req.Msg.NewParentId
	if err := s.treeRepo.MoveNodeInStructure(ctx, n.TreeID, req.Msg.NodeId, &newParentID); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	// ดึง tree ใหม่หลัง move
	updatedTree, err := s.treeRepo.FindByID(ctx, n.TreeID)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	// คำนวณรุ่นใหม่อัตโนมัติ: node = parent + 1, cascade ลง descendants
	newGen := newParent.Generation + 1
	if err := s.recalcDescendantGenerations(ctx, req.Msg.NodeId, newGen, &updatedTree.Structure); err != nil {
		slog.Error("failed to recalc generations after move", "error", err)
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	n.Generation = newGen

	return connect.NewResponse(&nodev1.MoveNodeResponse{
		Node: domainToProto(n, &updatedTree.Structure),
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

	n, err := s.nodeRepo.FindByID(ctx, req.Msg.NodeId)
	if err != nil {
		if errors.Is(err, node.ErrNodeNotFound) {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	t, err := s.treeRepo.FindByID(ctx, n.TreeID)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	if !s.canEditTree(ctx, t, userID) {
		return nil, connect.NewError(connect.CodePermissionDenied, tree.ErrUnauthorized)
	}

	// ย้ายเป็น root (parent = nil)
	if err := s.treeRepo.MoveNodeInStructure(ctx, n.TreeID, req.Msg.NodeId, nil); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	updatedTree, err := s.treeRepo.FindByID(ctx, n.TreeID)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return connect.NewResponse(&nodev1.UnlinkNodeResponse{
		Node: domainToProto(n, &updatedTree.Structure),
	}), nil
}

// ==================== AddParent ====================

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
	if req.Msg.NodeId == req.Msg.ParentId {
		return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrSelfParent)
	}

	n, err := s.nodeRepo.FindByID(ctx, req.Msg.NodeId)
	if err != nil {
		if errors.Is(err, node.ErrNodeNotFound) {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	parentNode, err := s.nodeRepo.FindByID(ctx, req.Msg.ParentId)
	if err != nil {
		if errors.Is(err, node.ErrNodeNotFound) {
			return nil, connect.NewError(connect.CodeNotFound, node.ErrParentNotFound)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	t, err := s.treeRepo.FindByID(ctx, n.TreeID)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	if !s.canEditTree(ctx, t, userID) {
		return nil, connect.NewError(connect.CodePermissionDenied, tree.ErrUnauthorized)
	}
	if n.TreeID != parentNode.TreeID {
		return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrCrossTreeMove)
	}

	// ตรวจ circular
	if t.Structure.IsDescendant(req.Msg.NodeId, req.Msg.ParentId) {
		return nil, connect.NewError(connect.CodeInvalidArgument, node.ErrCircularReference)
	}

	// เพิ่ม parent ใหม่ให้ node (ไม่ลบ parent เดิม — multi-parent / DAG)
	if err := s.treeRepo.AddChildToParent(ctx, n.TreeID, req.Msg.NodeId, req.Msg.ParentId); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	updatedTree, err := s.treeRepo.FindByID(ctx, n.TreeID)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	// คำนวณรุ่นใหม่อัตโนมัติ: node = parent + 1, cascade ลง descendants
	newGen := parentNode.Generation + 1
	if err := s.recalcDescendantGenerations(ctx, req.Msg.NodeId, newGen, &updatedTree.Structure); err != nil {
		slog.Error("failed to recalc generations after add parent", "error", err)
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	n.Generation = newGen

	return connect.NewResponse(&nodev1.AddParentResponse{
		Node: domainToProto(n, &updatedTree.Structure),
	}), nil
}

// ==================== RemoveParent ====================

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

	n, err := s.nodeRepo.FindByID(ctx, req.Msg.NodeId)
	if err != nil {
		if errors.Is(err, node.ErrNodeNotFound) {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	t, err := s.treeRepo.FindByID(ctx, n.TreeID)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	if !s.canEditTree(ctx, t, userID) {
		return nil, connect.NewError(connect.CodePermissionDenied, tree.ErrUnauthorized)
	}

	// ย้ายเป็น root (ตัดสาย parent)
	if err := s.treeRepo.MoveNodeInStructure(ctx, n.TreeID, req.Msg.NodeId, nil); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	updatedTree, err := s.treeRepo.FindByID(ctx, n.TreeID)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return connect.NewResponse(&nodev1.RemoveParentResponse{
		Node: domainToProto(n, &updatedTree.Structure),
	}), nil
}

// ==================== GetNodesByShareToken (public, no auth) ====================

func (s *Service) GetNodesByShareToken(
	ctx context.Context,
	req *connect.Request[nodev1.GetNodesByShareTokenRequest],
) (*connect.Response[nodev1.GetNodesByShareTokenResponse], error) {

	if req.Msg.ShareToken == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("share_token is required"))
	}

	t, err := s.treeRepo.FindByShareToken(ctx, req.Msg.ShareToken)
	if err != nil {
		if errors.Is(err, tree.ErrTreeNotFound) {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	nodes, err := s.nodeRepo.FindByTreeID(ctx, t.ID)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	protoNodes := make([]*nodev1.Node, len(nodes))
	for i, n := range nodes {
		protoNodes[i] = domainToProto(n, &t.Structure)
	}

	return connect.NewResponse(&nodev1.GetNodesByShareTokenResponse{
		Nodes: protoNodes,
	}), nil
}

// ==================== Helpers ====================

// recalcDescendantGenerations คำนวณรุ่นใหม่ให้ node และ descendants ทั้งหมด
func (s *Service) recalcDescendantGenerations(ctx context.Context, nodeID string, generation int32, structure *tree.TreeStructure) error {
	if err := s.nodeRepo.UpdateGeneration(ctx, nodeID, generation); err != nil {
		return err
	}

	edge, ok := structure.Edges[nodeID]
	if !ok {
		return nil
	}
	for _, childID := range edge.Children {
		if err := s.recalcDescendantGenerations(ctx, childID, generation+1, structure); err != nil {
			return err
		}
	}
	return nil
}

// domainToProto แปลง domain Node → proto Node
// ดึง parent info จาก structure (ถ้ามี)
func domainToProto(n *node.Node, structure *tree.TreeStructure) *nodev1.Node {
	pn := &nodev1.Node{
		Id:         n.ID,
		TreeId:     n.TreeID,
		Nickname:   n.Nickname,
		FirstName:  n.FirstName,
		LastName:   n.LastName,
		StudentId:  n.StudentID,
		PhotoUrl:   n.PhotoURL,
		Status:     domainStatusToProto(n.Status),
		Generation: n.Generation,
		PositionX:  n.PositionX,
		PositionY:  n.PositionY,
		Phone:      n.Phone(),
		Email:      n.Email(),
		LineId:     n.LineID(),
		Discord:    n.Discord(),
		Facebook:   n.Facebook(),
		CreatedAt:  n.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:  n.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}

	// เติม parent_ids จาก structure (multi-parent / DAG)
	if structure != nil {
		parentIDs := structure.FindParentIDs(n.ID)
		if len(parentIDs) > 0 {
			pn.ParentId = &parentIDs[0]
			pn.ParentIds = parentIDs
		}
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
