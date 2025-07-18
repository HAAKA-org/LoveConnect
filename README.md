## 🚀 Running the Django Project with Daphne (ASGI Server)

To start the server with WebSocket support using Daphne, run the following command:

```bash
daphne -p 8000 Backend.asgi:application
