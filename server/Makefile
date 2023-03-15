install:
	pip install -r requirements.txt

start:
	cd src && uvicorn server:app --reload --port 8081

format:
	black .
	isort .