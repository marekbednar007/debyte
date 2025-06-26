#!/bin/bash

# AI Board of Directors - Complete Setup Script
# ============================================

echo "🚀 Setting up AI Board of Directors Debate System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_info "Setting up project dependencies..."

# Install root dependencies
print_info "Installing root dependencies..."
npm install

# Install server dependencies
print_info "Installing server dependencies..."
cd server && npm install && cd ..

# Install client dependencies  
print_info "Installing client dependencies..."
cd client && npm install && cd ..

# Install Python dependencies
print_info "Installing Python dependencies..."
cd agents && pip3 install -r requirements.txt && cd ..

print_status "All dependencies installed successfully!"

# Environment setup
print_info "Setting up environment files..."

# Check if server .env exists
if [ ! -f "server/src/config/.env" ]; then
    print_warning "Server .env file not found. Creating template..."
    mkdir -p server/src/config
    cat > server/src/config/.env << EOF
# LLM APIs
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# LangChain (optional)
LANGSMITH_TRACING=false
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=your_langsmith_key_here
LANGSMITH_PROJECT=debyte

# MongoDB
MONGO_URI=mongodb://localhost:27017/debyte
EOF
    print_warning "Please edit server/src/config/.env with your actual API keys"
fi

# Check if agents .env exists
if [ ! -f "agents/.env" ]; then
    print_warning "Agents .env file not found. Creating template..."
    cat > agents/.env << EOF
# LLM APIs
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# LangChain (optional)
LANGSMITH_TRACING=false
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=your_langsmith_key_here
LANGSMITH_PROJECT=debyte

# MongoDB
MONGO_URI=mongodb://localhost:27017/debyte
EOF
    print_warning "Please edit agents/.env with your actual API keys"
fi

print_status "Environment files set up!"

# Database setup
print_info "Checking MongoDB connection..."
if command -v mongosh &> /dev/null; then
    print_status "MongoDB CLI tools found"
elif command -v mongo &> /dev/null; then
    print_status "MongoDB CLI tools found"
else
    print_warning "MongoDB CLI tools not found. Please install MongoDB or use MongoDB Atlas"
    print_info "For local MongoDB: brew install mongodb/brew/mongodb-community"
    print_info "For MongoDB Atlas: Update MONGO_URI in your .env files"
fi

print_status "Setup completed successfully! 🎉"

echo ""
print_info "To start the full system:"
echo "  npm run dev              # Starts all services"
echo ""
print_info "To start services individually:"
echo "  npm run dev:server       # Backend API (port 3001)"
echo "  npm run dev:client       # Frontend (port 5173)"
echo "  npm run dev:agents       # Python agents (watch mode)"
echo ""
print_info "To test Python agents directly:"
echo "  cd agents && python3 main.py --topic \"Your topic here\" --debate-id \"test123\" --max-iterations 1"
echo ""
print_info "Frontend URL: http://localhost:5173"
print_info "Backend API: http://localhost:3001/api"
echo ""
print_warning "Remember to add your actual API keys to the .env files!"
