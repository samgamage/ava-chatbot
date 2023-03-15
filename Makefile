install-server:
	cd server && make install

install-client:
	cd client && pnpm install

install: install-server install-client

server-dev:
	cd server && make start

client-dev:
	cd client && pnpm run dev
