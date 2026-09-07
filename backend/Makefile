PYTHON = ./venv/Scripts/python.exe

# ── Main commands ──────────────────────────────
serve:       ## Start Django dev server
	$(PYTHON) manage.py runserver

migrate:     ## Apply database migrations
	$(PYTHON) manage.py migrate

shell:       ## Open Django interactive shell
	$(PYTHON) manage.py shell

install:     ## Install all dependencies
	./venv/Scripts/pip install -r requirements.txt

models:      ## Download InsightFace ArcFace models (~300 MB, one-time)
	$(PYTHON) -c "from insightface.app import FaceAnalysis; app = FaceAnalysis(name='buffalo_l'); app.prepare(ctx_id=0); print('Models ready!')"

# ── Utility commands ───────────────────────────
check:       ## Run Django system checks
	$(PYTHON) manage.py check

createsuperuser: ## Create an admin user
	$(PYTHON) manage.py createsuperuser

collectstatic: ## Collect static files
	$(PYTHON) manage.py collectstatic --noinput

.PHONY: serve migrate shell install models check createsuperuser collectstatic
