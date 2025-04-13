#!/bin/bash

# Colors for output formatting
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print success message
print_success() {
  echo -e "${GREEN}$1${NC}"
}

# Print error message
print_error() {
  echo -e "${RED}$1${NC}"
}

# Ensure the script is run as root
ensure_root() {
  if [ "$(id -u)" -ne 0 ]; then
    print_error "This script must be run as root. Use: sudo ./setup_server_installs.sh"
    exit 1
  fi
}

# Generic function to check and install a package
check_and_install() {
  local package_name=$1
  local command_check=$2

  if ! command -v "$command_check" &>/dev/null; then
    echo "Installing $package_name..."
    if apt install -y "$package_name"; then
      print_success "$package_name installed successfully."
    else
      print_error "Failed to install $package_name."
      exit 1
    fi
  else
    print_success "$package_name is already installed."
  fi
}

# Update system packages
update_system() {
  echo "Updating package list..."
  if apt update && apt upgrade -y; then
    print_success "System packages updated successfully."
  else
    print_error "Failed to update system packages."
    exit 1
  fi
}

# Install Docker and its dependencies
install_docker() {
  if ! docker --version &>/dev/null; then
    echo "Installing Docker..."
    if apt install -y ca-certificates curl gnupg lsb-release &&
       mkdir -p /etc/apt/keyrings &&
       curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg &&
       echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null &&
       apt update &&
       apt install -y docker-ce docker-ce-cli containerd.io; then
      print_success "Docker installed successfully."
    else
      print_error "Failed to install Docker."
      exit 1
    fi
  else
    print_success "Docker is already installed."
  fi
}

# Install Docker Compose
install_docker_compose() {
  if ! command -v docker-compose &>/dev/null; then
    echo "Installing Docker Compose..."
    if curl -L "https://github.com/docker/compose/releases/download/$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r .tag_name)/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose &&
       chmod +x /usr/local/bin/docker-compose; then
      print_success "Docker Compose installed successfully."
    else
      print_error "Failed to install Docker Compose."
      exit 1
    fi
  else
    print_success "Docker Compose is already installed."
  fi
}



# Display running Docker containers
check_docker_containers() {
  echo "Checking running Docker containers..."
  if docker ps -q | grep -q .; then
    print_success "The following Docker containers are running:"
    docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"
  else
    print_error "No Docker containers are currently running."
  fi
}



# -------------------------
# 🚀 MAIN EXECUTION STARTS
# -------------------------
ensure_root
update_system

# Install required tools
check_and_install "curl" "curl"
check_and_install "net-tools (for netstat)" "netstat"
check_and_install "make" "make"

install_docker
install_docker_compose
check_docker_containers

print_success "<-- Setup completed successfully -->"