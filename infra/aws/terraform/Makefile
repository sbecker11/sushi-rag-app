SHELL := /bin/bash

ENV ?= dev
TFVARS_FILE ?= env/$(ENV).tfvars
PLAN_FILE ?= plan-$(ENV).tfplan

.PHONY: help check init fmt validate plan apply destroy output clean-plan

help:
	@echo "Terraform workflow helpers"
	@echo ""
	@echo "Usage:"
	@echo "  make <target> [ENV=dev|staging|prod]"
	@echo ""
	@echo "Targets:"
	@echo "  check       Verify terraform binary is available"
	@echo "  init        terraform init"
	@echo "  fmt         terraform fmt -recursive"
	@echo "  validate    terraform validate"
	@echo "  plan        terraform plan using env-specific tfvars"
	@echo "  apply       terraform apply the saved plan file"
	@echo "  destroy     terraform destroy using env-specific tfvars"
	@echo "  output      terraform output"
	@echo "  clean-plan  remove generated plan file"
	@echo ""
	@echo "Defaults:"
	@echo "  ENV=$(ENV)"
	@echo "  TFVARS_FILE=$(TFVARS_FILE)"
	@echo "  PLAN_FILE=$(PLAN_FILE)"

check:
	@command -v terraform >/dev/null 2>&1 || { echo "terraform not found in PATH"; exit 1; }
	@echo "terraform found: $$(terraform version | head -n1)"

init: check
	terraform init

fmt: check
	terraform fmt -recursive

validate: check
	terraform validate

plan: check
	@if [ ! -f "$(TFVARS_FILE)" ]; then \
		echo "Missing tfvars file: $(TFVARS_FILE)"; \
		echo "Create it from terraform.tfvars.example"; \
		exit 1; \
	fi
	terraform plan -var-file="$(TFVARS_FILE)" -out="$(PLAN_FILE)"

apply: check
	@if [ ! -f "$(PLAN_FILE)" ]; then \
		echo "Missing plan file: $(PLAN_FILE)"; \
		echo "Run: make plan ENV=$(ENV)"; \
		exit 1; \
	fi
	terraform apply "$(PLAN_FILE)"

destroy: check
	@if [ ! -f "$(TFVARS_FILE)" ]; then \
		echo "Missing tfvars file: $(TFVARS_FILE)"; \
		echo "Create it from terraform.tfvars.example"; \
		exit 1; \
	fi
	terraform destroy -var-file="$(TFVARS_FILE)"

output: check
	terraform output

clean-plan:
	rm -f "$(PLAN_FILE)"

