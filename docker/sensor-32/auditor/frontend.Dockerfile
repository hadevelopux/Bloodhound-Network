# Stage 1: Build (Tailwind + Vanilla JS Fallback)
FROM debian:bookworm-slim AS builder
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./

# Crear directorio de salida
RUN mkdir -p /app/dist

# 1. Compilar Tailwind directamente (sin Vite/Rollup)
RUN npx tailwindcss -i ./style.css -o /app/dist/style.css --minify

# 2. Copiar archivos web crudos
RUN cp index.html app.js /app/dist/

# 3. Extraer Socket.io pre-compilado de node_modules
RUN cp node_modules/socket.io-client/dist/socket.io.esm.min.js /app/dist/socket.io.js

# 4. Inyectar hoja de estilos e Import Map en index.html
RUN sed -i 's|</head>|<link rel="stylesheet" href="./style.css">\n<script type="importmap">{"imports": {"socket.io-client": "./socket.io.js"}}</script>\n</head>|g' /app/dist/index.html

# 5. Eliminar importaciones mágicas de Vite de app.js (el navegador no soporta importar CSS crudo en JS)
RUN sed -i '/import.*style\.css/d' /app/dist/app.js && \
    sed -i '/import.*@fontsource/d' /app/dist/app.js

# Stage 2: Serve
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y nginx openssl && rm -rf /var/lib/apt/lists/*
RUN rm -f /etc/nginx/sites-enabled/default

RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

COPY default.conf /etc/nginx/conf.d/default.conf
RUN echo "daemon off;" >> /etc/nginx/nginx.conf

COPY --from=builder /app/dist /var/www/html

CMD ["nginx"]
