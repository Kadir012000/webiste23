<?php
require_once 'config.php';

// Rate limiting
if (!rate_limit($_SERVER['REMOTE_ADDR'])) {
    json_response(['error' => 'Rate limit exceeded'], 429);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get items with filters
        $category = isset($_GET['category']) ? sanitize_input($_GET['category']) : null;
        $subcategory = isset($_GET['subcategory']) ? sanitize_input($_GET['subcategory']) : null;
        $min_price = isset($_GET['min_price']) ? (float)$_GET['min_price'] : null;
        $max_price = isset($_GET['max_price']) ? (float)$_GET['max_price'] : null;
        $condition = isset($_GET['condition']) ? sanitize_input($_GET['condition']) : null;
        $location = isset($_GET['location']) ? sanitize_input($_GET['location']) : null;
        $sort = isset($_GET['sort']) ? sanitize_input($_GET['sort']) : 'newest';
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $offset = ($page - 1) * $limit;

        $query = "SELECT i.*, c.name as category_name, u.first_name, u.last_name, 
                        (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = 1 LIMIT 1) as image_url
                 FROM items i
                 JOIN categories c ON i.category_id = c.id
                 JOIN users u ON i.seller_id = u.id
                 WHERE i.status = 'active'";
        $params = [];

        if ($category) {
            $query .= " AND c.name = ?";
            $params[] = $category;
        }
        if ($subcategory) {
            $query .= " AND c.name = ?";
            $params[] = $subcategory;
        }
        if ($min_price !== null) {
            $query .= " AND i.price >= ?";
            $params[] = $min_price;
        }
        if ($max_price !== null) {
            $query .= " AND i.price <= ?";
            $params[] = $max_price;
        }
        if ($condition) {
            $query .= " AND i.condition = ?";
            $params[] = $condition;
        }
        if ($location) {
            $query .= " AND i.location = ?";
            $params[] = $location;
        }

        // Add sorting
        switch ($sort) {
            case 'price-asc':
                $query .= " ORDER BY i.price ASC";
                break;
            case 'price-desc':
                $query .= " ORDER BY i.price DESC";
                break;
            case 'newest':
            default:
                $query .= " ORDER BY i.created_at DESC";
                break;
        }

        // Add pagination
        $query .= " LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        try {
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $items = $stmt->fetchAll();

            // Get total count for pagination
            $count_query = str_replace("SELECT i.*, c.name as category_name, u.first_name, u.last_name, 
                        (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = 1 LIMIT 1) as image_url",
                        "SELECT COUNT(*) as total", $query);
            $count_query = preg_replace('/LIMIT.*$/', '', $count_query);
            $stmt = $pdo->prepare($count_query);
            $stmt->execute(array_slice($params, 0, -2));
            $total = $stmt->fetch()['total'];

            json_response([
                'items' => $items,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit,
                    'total_pages' => ceil($total / $limit)
                ]
            ]);
        } catch (PDOException $e) {
            json_response(['error' => 'Database error'], 500);
        }
        break;

    case 'POST':
        // Create new item
        $user_id = authenticate_request();
        
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            json_response(['error' => 'Invalid input'], 400);
        }

        // Validate required fields
        $required_fields = ['title', 'description', 'price', 'category_id', 'condition', 'location'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field])) {
                json_response(['error' => "Missing required field: $field"], 400);
            }
        }

        try {
            $pdo->beginTransaction();

            // Insert item
            $stmt = $pdo->prepare("INSERT INTO items (title, description, price, category_id, seller_id, condition, location) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                sanitize_input($data['title']),
                sanitize_input($data['description']),
                (float)$data['price'],
                (int)$data['category_id'],
                $user_id,
                sanitize_input($data['condition']),
                sanitize_input($data['location'])
            ]);
            $item_id = $pdo->lastInsertId();

            // Handle images
            if (isset($data['images']) && is_array($data['images'])) {
                $stmt = $pdo->prepare("INSERT INTO item_images (item_id, image_url, is_primary) VALUES (?, ?, ?)");
                foreach ($data['images'] as $index => $image_url) {
                    $stmt->execute([$item_id, $image_url, $index === 0]);
                }
            }

            $pdo->commit();
            json_response(['message' => 'Item created successfully', 'item_id' => $item_id], 201);
        } catch (PDOException $e) {
            $pdo->rollBack();
            json_response(['error' => 'Database error'], 500);
        }
        break;

    case 'PUT':
        // Update item
        $user_id = authenticate_request();
        $item_id = isset($_GET['id']) ? (int)$_GET['id'] : null;
        
        if (!$item_id) {
            json_response(['error' => 'Item ID required'], 400);
        }

        // Check if user owns the item
        $stmt = $pdo->prepare("SELECT seller_id FROM items WHERE id = ?");
        $stmt->execute([$item_id]);
        $item = $stmt->fetch();

        if (!$item || $item['seller_id'] !== $user_id) {
            json_response(['error' => 'Unauthorized'], 403);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            json_response(['error' => 'Invalid input'], 400);
        }

        try {
            $pdo->beginTransaction();

            // Update item
            $update_fields = [];
            $params = [];
            $allowed_fields = ['title', 'description', 'price', 'category_id', 'condition', 'location', 'status'];

            foreach ($allowed_fields as $field) {
                if (isset($data[$field])) {
                    $update_fields[] = "$field = ?";
                    $params[] = $field === 'price' ? (float)$data[$field] : sanitize_input($data[$field]);
                }
            }

            if (!empty($update_fields)) {
                $params[] = $item_id;
                $stmt = $pdo->prepare("UPDATE items SET " . implode(', ', $update_fields) . " WHERE id = ?");
                $stmt->execute($params);
            }

            // Handle images
            if (isset($data['images']) && is_array($data['images'])) {
                // Delete existing images
                $stmt = $pdo->prepare("DELETE FROM item_images WHERE item_id = ?");
                $stmt->execute([$item_id]);

                // Insert new images
                $stmt = $pdo->prepare("INSERT INTO item_images (item_id, image_url, is_primary) VALUES (?, ?, ?)");
                foreach ($data['images'] as $index => $image_url) {
                    $stmt->execute([$item_id, $image_url, $index === 0]);
                }
            }

            $pdo->commit();
            json_response(['message' => 'Item updated successfully']);
        } catch (PDOException $e) {
            $pdo->rollBack();
            json_response(['error' => 'Database error'], 500);
        }
        break;

    case 'DELETE':
        // Delete item
        $user_id = authenticate_request();
        $item_id = isset($_GET['id']) ? (int)$_GET['id'] : null;
        
        if (!$item_id) {
            json_response(['error' => 'Item ID required'], 400);
        }

        // Check if user owns the item
        $stmt = $pdo->prepare("SELECT seller_id FROM items WHERE id = ?");
        $stmt->execute([$item_id]);
        $item = $stmt->fetch();

        if (!$item || $item['seller_id'] !== $user_id) {
            json_response(['error' => 'Unauthorized'], 403);
        }

        try {
            $pdo->beginTransaction();

            // Delete item images
            $stmt = $pdo->prepare("DELETE FROM item_images WHERE item_id = ?");
            $stmt->execute([$item_id]);

            // Delete item
            $stmt = $pdo->prepare("DELETE FROM items WHERE id = ?");
            $stmt->execute([$item_id]);

            $pdo->commit();
            json_response(['message' => 'Item deleted successfully']);
        } catch (PDOException $e) {
            $pdo->rollBack();
            json_response(['error' => 'Database error'], 500);
        }
        break;

    default:
        json_response(['error' => 'Method not allowed'], 405);
} 