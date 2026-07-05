# Food Delivery App (HTML/CSS/JS + Python backend)

## What’s included
- Simple responsive frontend: search menu, add to cart, checkout form
- Python Flask backend: serves menu products and accepts checkout

## Run
1. Install Python dependencies:
   ```bash
   cd food-delivery-app
   pip install flask flask-cors
   ```

2. Start the server:
   ```bash
   python app.py
   ```

3. Open frontend:
   - Open `frontend/index.html` in a browser.
   - (Tip: if your browser blocks local file API calls, use the built-in server below.)

## Alternative (recommended) local hosting for frontend
If needed, run a static server from the project root, e.g.:
- Python:
  ```bash
  python -m http.server 8000
  ```
- Then open:
  http://localhost:8000/frontend

## API endpoints
- `GET /api/products`
- `POST /api/checkout`


