# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-21-sub-feature-request-system/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Endpoints

### Sub-Feature CRUD Operations

#### GET /api/features/{feature_id}/sub-features/
**Description**: List all sub-features for a feature with hierarchical structure
**Parameters**:
- `expand`: Include all nested levels (default: false)
- `max_depth`: Maximum nesting depth to return
- `include_dependencies`: Include dependency information

**Response**:
```json
{
  "results": [
    {
      "id": 1,
      "title": "User Authentication Module",
      "description": "Implement login/logout functionality",
      "parent_id": null,
      "level": 0,
      "order": 1,
      "path": "1",
      "status": "in_progress",
      "progress_percentage": 45,
      "children": [
        {
          "id": 2,
          "title": "Login Form Component",
          "parent_id": 1,
          "level": 1,
          "order": 1,
          "path": "1.2",
          "children": []
        }
      ]
    }
  ]
}
```

#### POST /api/features/{feature_id}/sub-features/
**Description**: Create new sub-feature
**Body**:
```json
{
  "title": "New Sub-Feature",
  "description": "Description of the sub-feature",
  "parent_id": 1,
  "priority": "medium",
  "assigned_to_id": 123,
  "estimated_hours": 8.5
}
```

#### GET /api/sub-features/{id}/
**Description**: Get specific sub-feature with full hierarchy context

#### PUT /api/sub-features/{id}/
**Description**: Update sub-feature details

#### DELETE /api/sub-features/{id}/
**Description**: Delete sub-feature and handle children
**Parameters**:
- `action`: "cascade" | "reparent" | "promote"

### Tree Operations

#### POST /api/sub-features/{id}/move/
**Description**: Move sub-feature to new parent or reorder
**Body**:
```json
{
  "new_parent_id": 5,
  "new_order": 2,
  "action": "move"
}
```

#### POST /api/sub-features/bulk-move/
**Description**: Move multiple sub-features
**Body**:
```json
{
  "sub_feature_ids": [1, 2, 3],
  "new_parent_id": 4,
  "preserve_order": true
}
```

#### GET /api/sub-features/{id}/ancestors/
**Description**: Get all ancestor sub-features up to root

#### GET /api/sub-features/{id}/descendants/
**Description**: Get all descendant sub-features
**Parameters**:
- `max_depth`: Limit depth of descendants returned

### Dependency Management

#### POST /api/sub-features/{id}/dependencies/
**Description**: Create dependency between sub-features
**Body**:
```json
{
  "prerequisite_sub_feature_id": 2,
  "dependency_type": "blocks"
}
```

#### GET /api/sub-features/{id}/dependencies/
**Description**: Get all dependencies for a sub-feature

#### DELETE /api/sub-features/dependencies/{dependency_id}/
**Description**: Remove dependency relationship

### Progress & Analytics

#### GET /api/sub-features/{id}/progress/
**Description**: Get progress rollup for sub-feature and all children
**Response**:
```json
{
  "sub_feature_id": 1,
  "direct_progress": 50,
  "children_progress": 75,
  "overall_progress": 65,
  "completed_children": 3,
  "total_children": 8
}
```

#### PUT /api/sub-features/{id}/progress/
**Description**: Update progress percentage
**Body**:
```json
{
  "progress_percentage": 75,
  "update_parent": true
}
```

## Controllers

### SubFeatureViewSet
```python
class SubFeatureViewSet(viewsets.ModelViewSet):
    queryset = SubFeatureRequest.objects.all()
    serializer_class = SubFeatureSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        feature_id = self.kwargs.get('feature_id')
        if feature_id:
            return SubFeatureRequest.objects.filter(feature_request_id=feature_id)
        return super().get_queryset()
    
    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        """Move sub-feature to new parent or reorder"""
        sub_feature = self.get_object()
        new_parent_id = request.data.get('new_parent_id')
        new_order = request.data.get('new_order', 0)
        
        # Validate no circular dependencies
        if self._creates_circular_dependency(sub_feature, new_parent_id):
            return Response({'error': 'Would create circular dependency'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Update parent and reorder siblings
        sub_feature.move_to(new_parent_id, new_order)
        return Response(SubFeatureSerializer(sub_feature).data)
    
    @action(detail=True)
    def ancestors(self, request, pk=None):
        """Get all ancestors of sub-feature"""
        sub_feature = self.get_object()
        ancestors = sub_feature.get_ancestors()
        return Response(SubFeatureSerializer(ancestors, many=True).data)
    
    @action(detail=True)
    def descendants(self, request, pk=None):
        """Get all descendants of sub-feature"""
        sub_feature = self.get_object()
        max_depth = request.query_params.get('max_depth', None)
        descendants = sub_feature.get_descendants(max_depth=max_depth)
        return Response(SubFeatureSerializer(descendants, many=True).data)
```

### Tree Management Services
```python
class SubFeatureTreeService:
    @staticmethod
    def move_node(sub_feature, new_parent_id, new_order):
        """Move node to new position in tree"""
        with transaction.atomic():
            old_parent = sub_feature.parent
            
            # Update materialized path
            if new_parent_id:
                new_parent = SubFeatureRequest.objects.get(id=new_parent_id)
                new_path = f"{new_parent.materialized_path}.{sub_feature.id}"
            else:
                new_path = str(sub_feature.id)
            
            # Update all descendants paths
            sub_feature.update_descendants_paths(new_path)
            
            # Reorder siblings
            SubFeatureTreeService.reorder_siblings(sub_feature, new_order)
    
    @staticmethod
    def calculate_progress_rollup(sub_feature):
        """Calculate progress including all descendants"""
        descendants = sub_feature.get_descendants(include_self=True)
        if not descendants.exists():
            return sub_feature.progress_percentage
            
        total_progress = sum(d.progress_percentage for d in descendants)
        return total_progress / descendants.count()
```