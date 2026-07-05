from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__, static_folder=None)
CORS(app)

# In-memory sample catalog
PRODUCTS = [
    {
        "id": "p1",
        "name": "Margherita Pizza",
        "description": "Classic delight with fresh mozzarella & basil.",
        "price": 9.99,
        "image": "https://images.unsplash.com/photo-1601924582975-7aa3f0d3b0a4?auto=format&fit=crop&w=800&q=60",
        "category": "Pizza",
        "rating": 4.6,
        "tags": ["Vegetarian"]
    },
    {
        "id": "p2",
        "name": "Pepperoni Pizza",
        "description": "Spicy pepperoni with a crispy crust.",
        "price": 12.49,
        "image": "https://images.unsplash.com/photo-1548365328-9f547f7b0f7b?auto=format&fit=crop&w=800&q=60",
        "category": "Pizza",
        "rating": 4.7,
        "tags": ["Non-veg"]
    },
    {
        "id": "p3",
        "name": "Chicken Burger",
        "description": "Juicy chicken patty, lettuce, and house sauce.",
        "price": 8.75,
        "image": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=60",
        "category": "Burgers",
        "rating": 4.5,
        "tags": ["Non-veg"]
    },
    {
        "id": "p4",
        "name": "Veggie Burger",
        "description": "Grilled veggie patty with fresh toppings.",
        "price": 7.95,
        "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=60",
        "category": "Burgers",
        "rating": 4.3,
        "tags": ["Vegetarian"]
    },
    {
        "id": "p5",
        "name": "Caesar Salad",
        "description": "Crisp romaine with parmesan & Caesar dressing.",
        "price": 6.99,
        "image": "https://images.unsplash.com/photo-1540420773424-4f41e4d0d4c9?auto=format&fit=crop&w=800&q=60",
        "category": "Salads",
        "rating": 4.4,
        "tags": ["Healthy", "Vegetarian"]
    },
    {
        "id": "p6",
        "name": "Mango Smoothie",
        "description": "Chilled mango smoothie made with real fruit.",
        "price": 4.99,
        "image": "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=800&q=60",
        "category": "Drinks",
        "rating": 4.8,
        "tags": ["Beverage"]
    },
]


def get_product_map():
    return {p["id"]: p for p in PRODUCTS}


@app.get("/api/products")
def products():
    # Query params (optional)
    category = request.args.get("category")
    q = request.args.get("q")

    items = PRODUCTS

    if category:
        items = [p for p in items if p.get("category", "").lower() == category.lower()]

    if q:
        ql = q.lower()
        items = [
            p for p in items
            if ql in p.get("name", "").lower()
            or ql in p.get("description", "").lower()
            or ql in p.get("category", "").lower()
            or any(ql in t.lower() for t in p.get("tags", []))
        ]

    return jsonify({"items": items})


@app.post("/api/checkout")
def checkout():
    payload = request.get_json(silent=True) or {}

    name = payload.get("name", "").strip()
    address = payload.get("address", "").strip()
    phone = payload.get("phone", "").strip()
    cart = payload.get("cart", [])

    if not name or not address or not phone:
        return jsonify({"ok": False, "error": "Missing required fields: name, address, phone"}), 400

    product_map = get_product_map()

    total = 0.0
    normalized_cart = []

    for line in cart:
        pid = line.get("productId")
        qty = int(line.get("qty", 0))
        if qty <= 0:
            continue
        p = product_map.get(pid)
        if not p:
            continue
        line_total = float(p["price"]) * qty
        total += line_total
        normalized_cart.append({"productId": pid, "qty": qty})

    if not normalized_cart:
        return jsonify({"ok": False, "error": "Cart is empty"}), 400

    # Simple success response (no persistence)
    order_id = "ORD-" + "".join(__import__("random").choices("0123456789ABCDEF", k=8))

    return jsonify({
        "ok": True,
        "orderId": order_id,
        "name": name,
        "total": round(total, 2),
        "message": "Order received! (demo backend)"
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

